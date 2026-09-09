import TextFileViewer from "./TextFileViewer";
import ImageFileViewer from "./ImageFileViewer";

/**
 * FileViewer
 * - Routes to the correct viewer by file extension (based on fileName).
 * - Also forwards onDirtyChange so DrivePage can block closing on unsaved changes.
 */
export default function FileViewer({
  fileId,
  fileName,
  token,
  onClose,
  onDeleted,
  onSaved,
  onDirtyChange,
}) {
  if (isImageName(fileName)) {
    return (
      <ImageFileViewer
        fileId={fileId}
        token={token}
        onClose={onClose}
        onDeleted={onDeleted}
        onSaved={onSaved}
        onDirtyChange={onDirtyChange}
      />
    );
  }

  return (
    <TextFileViewer
      fileId={fileId}
      token={token}
      onClose={onClose}
      onDeleted={onDeleted}
      onSaved={onSaved}
      onDirtyChange={onDirtyChange}
    />
  );
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