import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { apiClient } from "./apiClient";

// list files (root / folder)
export async function listFiles(folderId, token) {
  const params = new URLSearchParams();
  if (folderId) params.set("parentId", folderId);

  const qs = params.toString();
  const url = qs ? `/api/files?${qs}` : "/api/files";
  return apiClient.get(url, { token });
}

export async function searchFiles(query, token) {
  const safe = encodeURIComponent(String(query || ""));
  return apiClient.get(`/api/search/${safe}`, { token });
}

export async function getFile(fileId, token) {
  return apiClient.get(`/api/files/${fileId}`, { token });
}

export async function getPath(fileId, token) {
  return apiClient.get(`/api/files/${fileId}/path`, { token });
}

export async function listPermissions(fileId, token) {
  return apiClient.get(`/api/files/${fileId}/permissions`, { token });
}

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

export async function getUserByUsername(username, token) {
  const safe = encodeURIComponent(username.trim().toLowerCase());
  return apiClient.get(`/api/users/by-username/${safe}`, { token });
}

export async function getUserById(userId, token) {
  const safe = encodeURIComponent(String(userId).trim());
  return apiClient.get(`/api/users/${safe}`, { token });
}

export async function moveFile(fileId, newParentId, token) {
  const payload = {};
  payload.parentId = newParentId === null || newParentId === undefined ? null : String(newParentId);
  return updateFile(fileId, payload, token);
}

function safeFileName(name) {
  const base = String(name || "file").trim() || "file";
  return base.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}

function guessMime(name = "") {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".txt")) return "text/plain;charset=utf-8";
  if (lower.endsWith(".json")) return "application/json;charset=utf-8";
  return "application/octet-stream";
}


function normalizeBase64(s = "") {
  const str = String(s || "");
  if (str.startsWith("data:")) {
    const comma = str.indexOf(",");
    return comma >= 0 ? str.slice(comma + 1) : str;
  }
  return str;
}

function base64ToBlob(base64, mime) {
  const b64 = normalizeBase64(base64);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function downloadSingleItem(fileId, token) {
  const file = await apiClient.get(`/api/files/${String(fileId)}`, { token });

  if (!file) throw new Error("File not found");
  if (file.type === "folder") throw new Error("Download is supported for files only.");

  const name = safeFileName(file.name || `file-${fileId}`);
  const mime = file.mimeType || guessMime(name);

  const hasB64 = !!(file.contentBase64);
  const isBinary = mime.startsWith("image/") || file.encoding === "base64" || hasB64;

  if (Platform.OS === "web") {
    let blob;
    if (isBinary) {
      const b64 = file.contentBase64 ?? file.content;
      if (!b64) throw new Error("Missing base64 content for binary file");
      blob = base64ToBlob(b64, mime);
    } else {
      const content = String(file.content ?? "");
      blob = new Blob([content], { type: mime });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  }
  // Native (Expo)
  const localUri = FileSystem.documentDirectory + name;

  // Always overwrite if file already exists
  await FileSystem.deleteAsync(localUri, { idempotent: true });

  if (isBinary) {
    const b64 = file.contentBase64 ?? file.content;
    if (!b64) throw new Error("Missing base64 content for binary file");

    await FileSystem.writeAsStringAsync(localUri, normalizeBase64(b64), {
      encoding: FileSystem?.EncodingType?.Base64 || "base64",
    });
  } else {
    await FileSystem.writeAsStringAsync(localUri, String(file.content ?? ""), {
      encoding: FileSystem?.EncodingType?.UTF8 || "utf8",
    });
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error("Sharing is not available on this device.");

  await Sharing.shareAsync(localUri);
  return { ok: true, uri: localUri };
}

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
