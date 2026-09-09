const BASE_URL = process.env.REACT_APP_API_URL || "";

function buildUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}

// Treat /api/tokens as login request (401 there = invalid credentials)
function isLoginPath(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p === "/api/tokens";
}

// Friendly UI message by HTTP status (with login special-case)
function mapErrorMessage(status, path) {
  const login = isLoginPath(path);

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
      return "The operation cannot be completed in the current state";
    case 500:
      return "Server error. Please try again later";
    default:
      return `Request failed (${status})`;
  }
}

function normalizeHttpError(status, data, path) {
  const err = new Error(mapErrorMessage(status, path));
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

// 401 guard logic
let alreadyFiredUnauthorized = false;

export function resetUnauthorizedFlag() {
  alreadyFiredUnauthorized = false;
}

function fireUnauthorized(reason = "SESSION_EXPIRED") {
  window.dispatchEvent(
    new CustomEvent("auth:unauthorized", { detail: { reason } })
  );
}

/**
 * Reads response body safely for error normalization:
 * - if JSON -> parsed object
 * - else -> text
 */
async function readBodyForError(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  if (isJson) return await res.json().catch(() => null);
  return await res.text().catch(() => null);
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

  // Fire unauthorized ONLY for authenticated requests (had token) AND NOT login
  if (token && !loginReq && res.status === 401 && !alreadyFiredUnauthorized) {
    alreadyFiredUnauthorized = true;
    fireUnauthorized("SESSION_EXPIRED");
  }

  if (!res.ok) {
    const data = await readBodyForError(res);
    throw normalizeHttpError(res.status, data, path);
  }

  // Default success parsing: JSON if possible, else text
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  if (isJson) return await res.json().catch(() => null);
  return await res.text().catch(() => null);
}


// for downloads/binary endpoints - Like request(), but returns Blob on success.
async function requestBlob(path, { method = "GET", body, token } = {}) {
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

  if (token && !loginReq && res.status === 401 && !alreadyFiredUnauthorized) {
    alreadyFiredUnauthorized = true;
    fireUnauthorized("SESSION_EXPIRED");
  }

  if (!res.ok) {
    const data = await readBodyForError(res);
    throw normalizeHttpError(res.status, data, path);
  }

  return await res.blob();
}

export const apiClient = {
  get: (path, opts = {}) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts = {}) =>
    request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts = {}) =>
    request(path, { ...opts, method: "PATCH", body }),
  del: (path, opts = {}) => request(path, { ...opts, method: "DELETE" }),

  // for downloads / binary endpoints
  getBlob: (path, opts = {}) => requestBlob(path, { ...opts, method: "GET" }),
};
