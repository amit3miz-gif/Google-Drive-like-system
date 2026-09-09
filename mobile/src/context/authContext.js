import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import {
  resetUnauthorizedFlag,
  setUnauthorizedHandler,
} from "../services/apiClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async (reason = "LOGGED_OUT") => {
    resetUnauthorizedFlag();
    await authService.logout(reason);
    setTokenState(null);
    setUser(null);
  }, []);

  // 401 handler (no window events)
  useEffect(() => {
    setUnauthorizedHandler(({ reason }) => {
      logout(reason || "SESSION_EXPIRED");
    });

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // init: load token + /me
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const existing = await authService.getToken();

        if (!existing) {
          if (!cancelled) setLoading(false);
          return;
        }

        try {
          const me = await authService.me(existing);
          if (cancelled) return;

          resetUnauthorizedFlag();
          setTokenState(existing);
          setUser(me);
        } catch {
          if (cancelled) return;
          await logout("SESSION_EXPIRED");
        } finally {
          if (!cancelled) setLoading(false);
        }
      } catch {
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

      try {
        const me = await authService.me(result.token);

        setTokenState(result.token);
        setUser(me);

        resetUnauthorizedFlag();
        return result;
      } catch (e) {
        // If login succeeded but /me failed, treat as session issue
        await logout("SESSION_EXPIRED");
        throw e;
      }
    },
    [logout]
  );

  const register = (data) => authService.register(data);

  const value = useMemo(
    () => ({ token, user, isAuthenticated, loading, login, register, logout }),
    [token, user, isAuthenticated, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
