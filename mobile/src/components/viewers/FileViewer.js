import TextFileViewer from "./TextFileViewer";
import ImageFileViewer from "./ImageFileViewer";

export default function FileViewer({ file, token }) {
  const name = String(file?.name || "");
  const mimeType = String(file?.mimeType || "");
  const content = typeof file?.content === "string" ? file.content : "";

  const isImage =
    mimeType.startsWith("image/") ||
    isImageName(name) ||
    content.startsWith("data:image/");

  if (isImage) {
    return <ImageFileViewer file={file} token={token} />;
  }

  return <TextFileViewer file={file} token={token} />;
}

function isImageName(name = "") {
  const n = String(name).toLowerCase();
  return (
    n.endsWith(".png") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".gif") ||
    n.endsWith(".webp")
  );
}
