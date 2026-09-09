import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { searchFiles } from "../../services/fileService";
import Spinner from "../common/Spinner";
import FileList from "./FileList";
import { useDriveView } from "../../context/DriveViewContext";
import InlineError from "../common/inLineError";

/**
 * SearchOverlay
 * Full-screen overlay for searching files and folders in the drive.
 */
export default function SearchOverlay({
  query,
  onQueryChange,
  onClose,
}) {
  const { token } = useAuth();
  
  // Global viewer state and handlers from context
  const { handleItemClick: handleGlobalItemClick } = useDriveView();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Close overlay on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Perform search when query changes
  useEffect(() => {
    const q = query.trim();

    // If there is no query OR no token, clear results and close overlay
    if (!q || !token) {
      setItems([]);
      setLoading(false);
      setError("");
      if (!token) {
        onClose(); // user logged out, close the search overlay
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    // Call the searchFiles service function
    searchFiles(q, token)     
      .then((res) => !cancelled && setItems(res))
      .catch((e) => !cancelled && setError(e.message || "Search failed"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [query, token, onClose]);

  // Delegate click handling to the parent
  const handleClick = async (item) => {
    await handleGlobalItemClick(item);
    onClose();
  };

  return (
    <div className="search-overlay" role="dialog" aria-modal="true">
      <div className="search-overlay__backdrop" onClick={onClose} />

      <div className="search-overlay__panel">
        <div className="search-overlay__header">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search in Drive"
          />
          <button
            type="button"
            className="ui-icon-btn"
            onClick={onClose}
            aria-label="Close search"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {loading && <Spinner />}
        {!loading && <InlineError message={error} />}
        {!loading && !error && (
          <FileList
            items={items}
            view="list"
            onItemClick={handleClick}
            onMenuClick={() => {}}
            compact={true}
          />
        )}
      </div>
    </div>
  );
}
