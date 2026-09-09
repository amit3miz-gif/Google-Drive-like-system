import { useEffect, useMemo, useState } from "react";
import Spinner from "../common/Spinner";
import { fileService } from "../../services/fileService";
import "./viewers.css";
import InlineError from "../common/inLineError";

/**
 * TextFileViewer
 * - Loads content from GET /api/files/:id
 * - Edits in a textarea
 * - Saves via PATCH /api/files/:id with { content }
 * - Deletes: Move to bin (trash)
 * - Undo: discards unsaved edits and restores last loaded/saved content
 */
export default function TextFileViewer({
  fileId,
  token,
  onClose,
  onDeleted,
  onSaved,
  onDirtyChange,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [fileName, setFileName] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [text, setText] = useState("");

  const isDirty = useMemo(() => text !== originalText, [text, originalText]);
  const isBusy = loading || saving || deleting;

  // Report dirty state to parent
  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

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
        setOriginalText(content);
        setText(content);
      } catch (e) {
        // Robust error message fallback
        const msg = e?.message || "Failed to load file";
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

  async function handleSave() {
    // Block save during deleting too by using isBusy
    if (!isDirty || isBusy) return;

    setSaving(true);
    setError("");

    try {
      await fileService.update(fileId, { content: text }, token);
      setOriginalText(text);
      onSaved?.(fileId);
    } catch (e) {
      // Robust error message fallback
      const msg = e?.message || "Failed to save";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleUndo() {
    if (isBusy || !isDirty) return;
    setText(originalText);
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
    <section className="viewer" aria-label="Text file viewer">
      <header className="viewer__header">
        <div className="viewer__title">
          <span className="material-symbols-outlined" aria-hidden="true">
            description
          </span>

          <span className="viewer__name" title={fileName}>
            {fileName}
          </span>

          {isDirty && <span className="viewer__dirty">● Unsaved</span>}
        </div>

        <div className="viewer__actions">
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
      ) : (
        <textarea
          className="viewer__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          // Placeholder for empty content
          placeholder="Start typing…"
          spellCheck={false}
        />
      )}
    </section>
  );
}
