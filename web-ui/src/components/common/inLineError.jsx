import "./inLineError.css";

export default function InlineError({ message, className = "" }) {
  if (!message) return null;

  return (
    <div className={`ui-error ${className}`} role="alert">
      {message}
    </div>
  );
}
