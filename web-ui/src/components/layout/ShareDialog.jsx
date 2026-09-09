import { useState } from "react";

export default function ShareDialog({
  isOpen,
  file,
  onClose,
  onShare,
}) {
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("read"); // 'read' | 'write' | 'manage'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !file) return null;

  const reset = () => {
    setEmail("");
    setLevel("read");
    setError("");
  }

  const handleClose = () => {
    reset();
    onClose?.();
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setSubmitting(true);
      await onShare?.(email.trim(), level);
      // reset and close on success
      handleClose();
    } catch (err) {
      setError(err?.message || "Failed to share file");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="share-dialog-overlay" onMouseDown={handleClose}>
      <div
        className="share-dialog"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Share file"
      >
        <header className="share-dialog__header">
          <h2 className="share-dialog__title">
            Share "{file.name}"
          </h2>
          <button
            type="button"
            className="share-dialog__close"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <form className="share-dialog__body" onSubmit={handleSubmit}>
          {/* Permission level select */}
          <div className="share-dialog__row">
            <label className="share-dialog__label" htmlFor="share-level">
              Permission
            </label>
            <select
              id="share-level"
              className="share-dialog__select"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="read">View only</option>
              <option value="write">Can edit</option>
              <option value="manage">Can manage</option>
            </select>
          </div>

          {/* Email input */}
          <div className="share-dialog__row">
            <label className="share-dialog__label" htmlFor="share-email">
              People
            </label>
            <input
              id="share-email"
              type="email"
              className="share-dialog__input"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <div className="share-dialog__error">{error}</div>}

          <footer className="share-dialog__footer">
            <button
              type="button"
              className="share-dialog__btn share-dialog__btn--secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="share-dialog__btn share-dialog__btn--primary"
              disabled={submitting}
            >
              {submitting ? "Sharing..." : "Share"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
