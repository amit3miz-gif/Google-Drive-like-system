import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient, resetUnauthorizedFlag } from "./apiClient";

const TOKEN_KEY = "token";
const LOGOUT_REASON_KEY = "auth.logoutReason";

// --- token helpers ---
async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function setToken(token) {
  if (!token) return AsyncStorage.removeItem(TOKEN_KEY);
  return AsyncStorage.setItem(TOKEN_KEY, token);
}

async function clearToken() {
  return AsyncStorage.removeItem(TOKEN_KEY);
}

// optional: show message on Login later
async function setLogoutReason(reason) {
  try {
    await AsyncStorage.setItem(LOGOUT_REASON_KEY, String(reason || "LOGGED_OUT"));
  } catch {}
}

async function popLogoutReason() {
  try {
    const r = await AsyncStorage.getItem(LOGOUT_REASON_KEY);
    if (r) await AsyncStorage.removeItem(LOGOUT_REASON_KEY);
    return r;
  } catch {
    return null;
  }
}

// --- auth API ---
async function login(username, password) {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const data = await apiClient.post("/api/tokens", { username, password });

  const token = data && typeof data === "object" ? data.token : null;
  if (!token) {
    throw new Error("Login succeeded but no token returned from server");
  }

  await setToken(token);
  resetUnauthorizedFlag();

  return { token };
}

async function register({ username, password, name, picture } = {}) {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const payload = { username, password };
  if (name !== undefined) payload.name = name;

  if (picture !== undefined) {
    payload.pictureData = picture.data;
    payload.pictureContentType = picture.contentType;
  }

  const data = await apiClient.post("/api/users", payload);
  return { ok: true, data };
}

async function logout(reason = "LOGGED_OUT") {
  await setLogoutReason(reason);
  await clearToken();
  resetUnauthorizedFlag();
}

async function me(token) {
  if (!token) throw new Error("Missing token");
  return apiClient.get("/api/users/me", { token });
}

export const authService = {
  // token access
  getToken,

  // optional reason helpers
  popLogoutReason,

  // flows
  login,
  register,
  logout,
  me,
};
