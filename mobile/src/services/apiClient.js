const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

// ---- URL helpers ----
function buildUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}

function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

function isLoginPath(path) {
  const p = normalizePath(path);
  return p === "/api/tokens";
}

function isRegisterPath(path) {
  const p = normalizePath(path);
  return p === "/api/users";
}

// ---- Error mapping ----
function mapErrorMessage(status, path) {
  const login = isLoginPath(path);
  const register = isRegisterPath(path);

  switch (status) {
    case 400:
      return "Invalid request";
    case 401:
      return login
        ? "Invalid credentials"
        : "Your session has expired. Please log in again.";
    case 403:
      return "You are not authorized to perform this action";
    case 404:
      return "The requested resource was not found";
    case 409:
      // message specific for register endpoint
      return register
        ? "This email is already registered"
        : "The operation cannot be completed in the current state";
    case 500:
      return "Server error. Please try again later";
    default:
      return `Request failed (${status})`;
  }
}

function extractServerMessage(data) {
  // try to use server-provided message if present
  if (!data) return null;
  if (typeof data === "string") return data; // sometimes server returns plain text
  if (typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    if (typeof data.error === "string" && data.error.trim()) return data.error;
  }
  return null;
}

function normalizeHttpError(status, data, path) {
  // prefer server message when available
  const serverMsg = extractServerMessage(data);
  const err = new Error(serverMsg || mapErrorMessage(status, path));
  err.status = status;
  err.raw = data;
  err.code = "HTTP_ERROR";
  err.path = path;
  return err;
}

function normalizeNetworkError(originalError) {
  const err = new Error("Network error. The server is unreachable.");
  err.status = 0;
  err.raw = originalError;
  err.code = "NETWORK_ERROR";
  return err;
}

async function readBodyForError(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  if (isJson) return await res.json().catch(() => null);
  return await res.text().catch(() => null);
}

// ---- 401 guard (no window events) ----
let alreadyFiredUnauthorized = false;
let unauthorizedHandler = null;

export function resetUnauthorizedFlag() {
  alreadyFiredUnauthorized = false;
}

export function setUnauthorizedHandler(handlerOrNull) {
  unauthorizedHandler = typeof handlerOrNull === "function" ? handlerOrNull : null;

  // If we detach handler (e.g., during unmount), allow future 401s to fire again
  if (!unauthorizedHandler) {
    alreadyFiredUnauthorized = false;
  }
}

function fireUnauthorized(reason = "SESSION_EXPIRED") {
  unauthorizedHandler?.({ reason });
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(buildUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw normalizeNetworkError(e);
  }

  const loginReq = isLoginPath(path);

  // handle 401 unauthorized globally (only for authenticated requests, not login)
  if (token && !loginReq && res.status === 401 && !alreadyFiredUnauthorized) {
    alreadyFiredUnauthorized = true;
    fireUnauthorized("SESSION_EXPIRED");
  }

  if (!res.ok) {
    const data = await readBodyForError(res);
    throw normalizeHttpError(res.status, data, path);
  }

  // success parsing
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  if (isJson) return await res.json().catch(() => null);
  return await res.text().catch(() => null);
}

export const apiClient = {
  get: (path, opts = {}) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts = {}) =>
    request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts = {}) =>
    request(path, { ...opts, method: "PATCH", body }),
  del: (path, opts = {}) => request(path, { ...opts, method: "DELETE" }),
};
