import { useRef } from "react";

export default function NewMenu({
  onNewFile,
  onNewFolder,
  onUploadText,
  onUploadImage,
  onClose,
}) {
  const textInputRef = useRef(null);
  const imageInputRef = useRef(null);

  return (
    // Simple menu container for creating new items
    <div className="new-menu" role="menu">
      {/* Create empty text file */}
      <button
        type="button"
        className="new-menu__item"
        onClick={() => {
          onNewFile?.();
          onClose?.();
        }}
      >
        New file
      </button>

      {/* Create folder */}
      <button
        type="button"
        className="new-menu__item"
        onClick={() => {
          onNewFolder?.();
          onClose?.();
        }}
      >
        New folder
      </button>

      {/* Upload text file */}
      <button
        type="button"
        className="new-menu__item"
        onClick={() => {
          textInputRef.current?.click();
        }}
      >
        Upload text file
      </button>

      <input
        ref={textInputRef}
        type="file"
        accept=".txt,text/plain"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadText?.(file);
          e.target.value = "";
          onClose?.();
        }}
      />

      {/* Upload image */}
      <button
        type="button"
        className="new-menu__item"
        onClick={() => {
          imageInputRef.current?.click();
        }}
      >
        Upload image
      </button>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadImage?.(file);
          e.target.value = "";
          onClose?.();
        }}
      />
    </div>
  );
}
