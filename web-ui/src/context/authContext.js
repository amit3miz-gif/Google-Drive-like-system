import { createContext, useEffect, useMemo, useState, useCallback } from "react";
import { authService } from "../services/authService";
import { resetUnauthorizedFlag } from "../services/apiClient";

export const AuthContext = createContext(null);

// helpers
function decodeJwtPayload(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length !== 3) return null;

    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);

    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isJwtExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  const nowSec = Date.now() / 1000;
  return nowSec >= payload.exp;
}

function msUntilJwtExpiry(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return 0;
  const expMs = payload.exp * 1000;
  return Math.max(0, expMs - Date.now());
}

function setLogoutReason(reason) {
  try {
    sessionStorage.setItem("auth.logoutReason", reason);
  } catch {}
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // accept reason + save it for LoginPage
  const logout = useCallback((reason = "LOGGED_OUT") => {
    setLogoutReason(reason);

    // so that future 401s are not blocked
    resetUnauthorizedFlag();

    authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  // Listen to global unauthorized event from apiClient
  useEffect(() => {
    const onUnauthorized = (e) => {
      const reason = e?.detail?.reason || "SESSION_EXPIRED";
      logout(reason);
    };

    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [logout]);

  // Load token from localStorage on app start + verify it with /api/users/me
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const existing = authService.getToken();

      if (!existing) {
        if (!cancelled) setLoading(false);
        return;
      }

      // expired/invalid -> treat as session expired
      if (isJwtExpired(existing)) {
        if (!cancelled) logout("SESSION_EXPIRED");
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const me = await authService.me(existing);
        if (cancelled) return;

        resetUnauthorizedFlag();

        setToken(existing);
        setUser(me);
      } catch {
        if (cancelled) return;
        logout("SESSION_EXPIRED");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const isAuthenticated = Boolean(token);

  const login = useCallback(
    async (username, password) => {
      resetUnauthorizedFlag();

      const result = await authService.login(username, password);

      if (!result?.token || isJwtExpired(result.token)) {
        logout("SESSION_EXPIRED");
        throw new Error("Received an invalid or expired token");
      }

      try {
        const me = await authService.me(result.token);

        setToken(result.token);
        setUser(me);

        resetUnauthorizedFlag();

        return result;
      } catch (err) {
        // login succeeded but me failed
        if (err?.code === "NETWORK_ERROR") {
          throw new Error(
            "Login succeeded but failed to load your profile. Please try again."
          );
        }

        if (err?.status === 401) {
          logout("SESSION_EXPIRED");
          throw new Error("Your session has expired. Please log in again.");
        }

        throw err;
      }
    },
    [logout]
  );

  const register = (data) => authService.register(data);

  // Auto logout on expiry
  useEffect(() => {
    if (!token) return;

    const msLeft = msUntilJwtExpiry(token);

    if (msLeft <= 0) {
      logout("SESSION_EXPIRED");
      return;
    }

    const timerId = setTimeout(() => {
      logout("SESSION_EXPIRED");
    }, msLeft);

    return () => clearTimeout(timerId);
  }, [token, logout]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      loading,
      login,
      register,
      logout,
    }),
    [token, user, isAuthenticated, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
