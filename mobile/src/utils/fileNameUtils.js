import { ALLOWED_EXTENSIONS } from "./fileConstants";

// Splits filename into base and extension
export function splitNameAndExtension(name) {
  const s = String(name || "");
  const lastDot = s.lastIndexOf(".");
  if (lastDot <= 0) return { base: s, ext: "" };
  return { base: s.slice(0, lastDot), ext: s.slice(lastDot) };
}

// Checks if the filename has an allowed extension
export function hasAllowedExtension(name) {
  const lower = String(name || "").toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// Standard "Allowed" message
export function allowedExtensionsMessage() {
  // Keep the same order/text as Web UI
  return "Unsupported file extension. Allowed: .jpeg, .jpg, .png, .gif, .webp, .svg, .txt";
}

// Sanitize filename to be safe for downloads on Windows/macOS
export function sanitizeFilename(name) {
  const safe = String(name || "download").trim() || "download";
  return safe.replace(/[\\/:*?"<>|]+/g, "_");
}

export function extFromMime(mime) {
  switch (mime) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    case "text/plain":
    case "text/plain;charset=utf-8":
      return ".txt";
    default:
      return "";
  }
}

export function ensureExtension(filename, mime) {
  const clean = sanitizeFilename(filename);
  if (clean.includes(".")) return clean;
  const ext = extFromMime(mime);
  return ext ? `${clean}${ext}` : clean;
}

// Web-like behavior for "create new text file":
// - If missing extension => add ".txt"
// - If ends with "." => add "txt"
// - If has another extension => keep and let caller validate
export function normalizeCreateTextName(input) {
  let finalName = String(input || "").trim();

  if (!finalName) finalName = "Untitled";

  if (!finalName.includes(".")) {
    finalName += ".txt";
  } else if (finalName.endsWith(".")) {
    finalName += "txt";
  }

  return sanitizeFilename(finalName);
}

export function isTxtFilename(name) {
  return String(name || "").toLowerCase().endsWith(".txt");
}
