import { apiClient } from "./apiClient";
import { dataUrlToBlob, ensureExtension, triggerBrowserDownload } from "../utils/download";

// Core API wrappers

// List files in a specific folder (or root when folderId is null/undefined)
export async function listFiles(folderId, token) {
  const params = new URLSearchParams();
  if (folderId) {
    params.set("parentId", folderId);
  }

  const qs = params.toString();
  const url = qs ? `/api/files?${qs}` : "/api/files";
  return apiClient.get(url, { token });
}

// Search files by query (GET /api/search/:query)
export async function searchFiles(query, token) {
  const safe = encodeURIComponent(query);
  return apiClient.get(`/api/search/${safe}`, { token });
}

// Get file by ID
export async function getFile(fileId, token) {
  return apiClient.get(`/api/files/${fileId}`, { token });
}

// Get per-user path for a file/folder
export async function getPath(fileId, token) {
  return apiClient.get(`/api/files/${fileId}/path`, { token });
}

// Get all permissions for a file
export async function listPermissions(fileId, token) {
  return apiClient.get(`/api/files/${fileId}/permissions`, { token });
}

// NOTE: POST /api/files has no response body, so we return { ok: true }
export async function createFile({ name, content = "", parentId = null }, token) {
  await apiClient.post(
    "/api/files",
    { name, type: "file", content, parentId },
    { token }
  );
  return { ok: true };
}

export async function createFolder({ name, parentId = null }, token) {
  await apiClient.post(
    "/api/files",
    { name, type: "folder", parentId },
    { token }
  );
  return { ok: true };
}

export async function updateFile(fileId, fields, token) {
  await apiClient.patch(`/api/files/${fileId}`, fields, { token });
  return { ok: true };
}

export async function deleteFilePermanently(fileId, token) {
  await apiClient.del(`/api/files/${fileId}`, { token });
  return { ok: true };
}

// Get user by username (email)
export async function getUserByUsername(username, token) {
  const safe = encodeURIComponent(username.trim().toLowerCase());
  return apiClient.get(`/api/users/by-username/${safe}`, { token });
}

// Get user by ID
export async function getUserById(userId, token) {
  const safe = encodeURIComponent(String(userId).trim());
  return apiClient.get(`/api/users/${safe}`, { token });
}

// Download a single file/image using existing content model
// text files: content is a string, images: content is a data URL
export async function downloadSingleItem(fileId, token) {
  const data = await getFile(fileId, token);

  const name = data?.name || "download";
  const type = data?.type; // do NOT default
  const content = data?.content;

  // folders: do nothing silently
  if (type === "folder") return { ok: true };

  if (typeof content !== "string") {
    throw new Error("File content is missing.");
  }

  // Image (data URL) -> Blob
  if (content.startsWith("data:")) {
    const blob = dataUrlToBlob(content);
    const filename = ensureExtension(name, blob.type || "application/octet-stream");
    triggerBrowserDownload(blob, filename);
    return { ok: true };
  }

  // Text -> Blob
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const filename = ensureExtension(name, blob.type);
  triggerBrowserDownload(blob, filename);
  return { ok: true };
}

// Move file to a new parent folder (or root if newParentId is null)
export async function moveFile(fileId, newParentId, token) {
  // newParentId can be null to move to root
  const payload = {};

  if (newParentId === null || newParentId === undefined) {
    // Explicitly move to root
    payload.parentId = null;
  } else {
    // Move under a specific folder
    payload.parentId = String(newParentId);
  }

  // Use the existing updateFile helper so all PATCH logic is centralized
  return updateFile(fileId, payload, token);
}

// Convenience object service
export const fileService = {
  // list
  listRootFiles: (token) => apiClient.get("/api/files", { token }),
  listFilesInFolder: (folderId, token) => listFiles(folderId, token),

  // get
  getById: (fileId, token) => getFile(fileId, token),

  // create
  createFile: (payload, token) => createFile(payload, token),
  createFolder: (payload, token) => createFolder(payload, token),

  // update
  update: (fileId, fields, token) => updateFile(fileId, fields, token),

  // delete
  permanentlyDelete: (fileId, token) => deleteFilePermanently(fileId, token),

  // search
  search: (query, token) => searchFiles(query, token),

  // recent
  listRecent: (token) => apiClient.get("/api/files/recent", { token }),

  // shared
  listSharedWithMe: (token) => apiClient.get("/api/files/shared-with-me", { token }),

  // starred
  getStarred: (token) => apiClient.get("/api/files/starred", { token }),
  setStarred: async (fileId, starred, token) => {
    await apiClient.patch(`/api/files/${fileId}/star`, { starred }, { token });
    return { ok: true };
  },

  // trash
  getTrash: (token) => apiClient.get("/api/files/trash", { token }),
  restoreFromTrash: async (fileId, token) => {
    await apiClient.patch(`/api/files/${fileId}/trash`, { trashed: false }, { token });
    return { ok: true };
  },
  moveToTrash: async (fileId, token) => {
    await apiClient.patch(`/api/files/${fileId}/trash`, { trashed: true }, { token });
    return { ok: true };
  },

  // permissions
  createPermission: async (fileId, payload, token) => {
    await apiClient.post(`/api/files/${fileId}/permissions`, payload, { token });
    return { ok: true };
  },
  patchPermission: async (fileId, pId, fields, token) => {
    await apiClient.patch(`/api/files/${fileId}/permissions/${pId}`, fields, { token });
    return { ok: true };
  },
  deletePermission: async (fileId, pId, token) => {
    await apiClient.del(`/api/files/${fileId}/permissions/${pId}`, { token });
    return { ok: true };
  },
  listPermissions: (fileId, token) => listPermissions(fileId, token),

  // path
  getPath: (fileId, token) => getPath(fileId, token),

  // download
  downloadSingleItem: (fileId, token) => downloadSingleItem(fileId, token),

  // users
  getUserByUsername,
  getUserById,

  // move
  move: (fileId, newParentId, token) => moveFile(fileId, newParentId, token),
};
