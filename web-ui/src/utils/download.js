// Remove characters that can break file saving on Windows/macOS
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
    case "application/pdf":
      return ".pdf";
    case "application/json":
      return ".json";
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

// data:<mime>;base64,xxxx -> Blob
export function dataUrlToBlob(dataUrl) {
  const s = String(dataUrl || "");
  const comma = s.indexOf(",");
  if (!s.startsWith("data:") || comma === -1) {
    // fallback: treat as text
    return new Blob([s], { type: "text/plain;charset=utf-8" });
  }

  const meta = s.slice(5, comma); // after "data:"
  const base64 = s.slice(comma + 1);

  const [mimePart, encoding] = meta.split(";");
  const mime = mimePart || "application/octet-stream";

  // base64 only (expected)
  if (encoding !== "base64") {
    return new Blob([base64], { type: mime });
  }

  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);

  return new Blob([bytes], { type: mime });
}

// convert blob to temp object URL and trigger browser download
export function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeFilename(filename);
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();

  // revoke later to avoid cutting download in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
