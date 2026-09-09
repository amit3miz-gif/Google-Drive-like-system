import { apiClient, resetUnauthorizedFlag } from "./apiClient";

// save token key in localStorage
const TOKEN_KEY = "token";

// login with username and password and save the token
async function login(username, password) {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const data = await apiClient.post("/api/tokens", { username, password });

  const token = data && typeof data === "object" ? data.token : null;
  if (!token) {
    throw new Error("Login succeeded but no token returned from server");
  }

  localStorage.setItem(TOKEN_KEY, token);

  // new session -> allow 401 to trigger logout again
  resetUnauthorizedFlag();

  return { token };
}

// add a new user
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

// logout by removing the token + reset 401 guard
function logout() {
  localStorage.removeItem(TOKEN_KEY);
  resetUnauthorizedFlag();
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

async function me(token) {
  if (!token) throw new Error("Missing token");
  return await apiClient.get("/api/users/me", { token });
}

export const authService = {
  login,
  register,
  logout,
  getToken,
  me,
};
