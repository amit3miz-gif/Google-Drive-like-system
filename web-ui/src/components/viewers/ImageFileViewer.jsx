import { useEffect, useMemo, useRef, useState } from "react";
import Spinner from "../common/Spinner";
import { fileService } from "../../services/fileService";
import "./viewers.css";
import InlineError from "../common/inLineError";

/**
 * ImageFileViewer
 * - View: renders <img src={content} />
 * - Replace: select a local image -> preview (not saved yet)
 * - Save: PATCH content with a data URL (string)
 * - Undo: revert preview back to original content
 * - Delete: Move to bin (trash)
 */
export default function ImageFileViewer({
  fileId,
  token,
  onClose,
  onDeleted,
  onSaved,
  onDirtyChange,
}) {
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [fileName, setFileName] = useState("");
  const [originalSrc, setOriginalSrc] = useState("");
  const [src, setSrc] = useState("");

  const isDirty = useMemo(() => src !== originalSrc, [src, originalSrc]);
  const isBusy = loading || saving || deleting;

  // Report dirty state to parent (DrivePage)
  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      // Guard when token is missing (prevents 401 + unwanted global unauthorized handling)
      if (!token) {
        setLoading(false);
        setError("Not authenticated");
        return;
      }

      try {
        const data = await fileService.getById(fileId, token);
        if (cancelled) return;

        setFileName(data?.name || "Untitled");
        const content = typeof data?.content === "string" ? data.content : "";
        setOriginalSrc(content);
        setSrc(content);
      } catch (e) {
        // Robust error message fallback
        const msg = e?.message || "Failed to load image";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fileId, token]);

  function handleReplaceClick() {
    if (isBusy) return;
    inputRef.current?.click();
  }

  async function handleFilePicked(e) {
    const file = e.target.files && e.target.files[0];

    // Clear old error if user cancels picker
    if (!file) {
      setError("");
      return;
    }

    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // guard because JSON body limit is 5mb and base64 expands size by ~33% 
    const maxBytes = 3_500_000;
    if (file.size > maxBytes) {
      setError("Image is too large for now. Please pick a smaller image.");
      return;
    }

    setError("");

    const dataUrl = await readAsDataURL(file);
    setSrc(dataUrl);
  }

  async function handleSave() {
    if (!isDirty || isBusy) return;

    setSaving(true);
    setError("");

    try {
      await fileService.update(fileId, { content: src }, token);
      setOriginalSrc(src);
      onSaved?.(fileId);
    } catch (e) {
      const msg = e?.message || "Failed to save image";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleUndo() {
    if (isBusy || !isDirty) return;
    setSrc(originalSrc);
    setError("");
  }

  async function handleDelete() {
    if (isBusy) return;

    const ok = window.confirm('Move this file to Bin?');
    if (!ok) return;

    setDeleting(true);
    setError("");

    try {
      await fileService.moveToTrash(fileId, token);
      onDeleted?.(fileId);
      onClose?.();
    } catch (e) {
      const msg = e?.message || "Failed to move to bin";
      setError(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="viewer" aria-label="Image file viewer">
      <header className="viewer__header">
        <div className="viewer__title">
          <span className="material-symbols-outlined" aria-hidden="true">
            image
          </span>

          <span className="viewer__name" title={fileName}>
            {fileName}
          </span>

          {isDirty && <span className="viewer__dirty">● Unsaved</span>}
        </div>

        <div className="viewer__actions">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="viewer__file-input"
            onChange={handleFilePicked}
          />

          <button
            type="button"
            className="ui-icon-btn has-tooltip"
            onClick={handleReplaceClick}
            disabled={isBusy}
            aria-label="Replace"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              swap_horiz
            </span>
            <span className="ui-tooltip ui-tooltip--right" role="tooltip">
              Replace
            </span>
          </button>

          <button
            type="button"
            className="ui-icon-btn has-tooltip"
            onClick={handleSave}
            disabled={!isDirty || isBusy}
            aria-label="Save"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              save
            </span>
            <span className="ui-tooltip ui-tooltip--right" role="tooltip">
              Save
            </span>
          </button>

          <button
            type="button"
            className="ui-icon-btn has-tooltip"
            onClick={handleUndo}
            disabled={!isDirty || isBusy}
            aria-label="Undo"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              undo
            </span>
            <span className="ui-tooltip ui-tooltip--right" role="tooltip">
              Undo
            </span>
          </button>

          <button
            type="button"
            className="ui-icon-btn has-tooltip viewer__danger-btn"
            onClick={handleDelete}
            disabled={isBusy}
            aria-label="Move to bin"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              delete
            </span>
            <span className="ui-tooltip ui-tooltip--right" role="tooltip">
              Move to bin
            </span>
          </button>

          <button
            type="button"
            className="ui-icon-btn has-tooltip"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
            <span className="ui-tooltip ui-tooltip--right" role="tooltip">
              Close
            </span>
          </button>
        </div>
      </header>

      <InlineError message={error} className="ui-error--viewer" />

      {loading ? (
        <div className="viewer__loading">
          <Spinner />
        </div>
      ) : !src ? (
        // Show a clear primary action when no image content exists
        <div className="viewer__empty">
          <div>No image content found.</div>
          <div className="viewer__empty-actions">
            <button
              type="button"
              className="ui-icon-btn has-tooltip"
              onClick={handleReplaceClick}
              aria-label="Upload image"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                upload
              </span>
              <span className="ui-tooltip ui-tooltip--right" role="tooltip">
                Upload
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="viewer__image-wrap">
          <img
            className="viewer__image"
            src={src}
            alt={fileName || "Preview of uploaded image"}
          />
        </div>
      )}
    </section>
  );
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Failed to read file"));
    r.readAsDataURL(file);
  });
}
