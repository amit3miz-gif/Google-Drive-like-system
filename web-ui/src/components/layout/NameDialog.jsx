import { useEffect, useRef, useState } from "react";

export default function NameDialog({
  isOpen,
  title,
  label,
  initialValue = "",
  confirmText = "Create",
  onConfirm,
  onCancel,
}) {
  // Local state for the input value
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  useEffect(() => {
    // When dialog opens, reset value and focus the input
    if (isOpen) {
      setValue(initialValue);
      // setTimeout ensures the element is rendered before calling focus
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, initialValue]);

  // Close on ESC when dialog is open
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel?.();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  // Do not render anything if dialog is closed
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    // Prevent empty names
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  const isValid = value.trim().length > 0;

  return (
    // Backdrop: clicking on it closes the dialog (mouse down outside)
    <div className="drive-name-dialog-backdrop" onMouseDown={onCancel}>
      <div
        className="drive-name-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // Stop propagation so clicks inside the dialog do NOT close it
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Dialog title */}
        <h2 className="drive-name-dialog__title">{title}</h2>

        {/* Form for name input + actions */}
        <form onSubmit={handleSubmit} className="drive-name-dialog__form">
          <label className="drive-name-dialog__label">
            {label}
            <input
              ref={inputRef}
              className="drive-name-dialog__input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="New name"
            />
          </label>

          {/* Actions row: Cancel + Confirm */}
          <div className="drive-name-dialog__actions">
            <button
              type="button"
              className="drive-name-dialog__btn drive-name-dialog__btn--secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="drive-name-dialog__btn drive-name-dialog__btn--primary"
              disabled={!isValid}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
