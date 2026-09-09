import { useEffect, useState } from "react";
import { listFiles, getFile, getPath } from "../../services/fileService";

/**
 * MoveDialog
 * Simple dialog for choosing a destination folder.
 */
export default function MoveDialog({ token, sourceItem, onClose, onMove }) {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [currentFolderItem, setCurrentFolderItem] = useState(null); // { id, name } or null
  const [currentPath, setCurrentPath] = useState([]);               // per-user path

  // When dialog opens, start from My Drive (root)
  useEffect(() => {
    if (!sourceItem) return;
    setCurrentFolderId(null);
  }, [sourceItem]);

  // Load folders for the current folder
  useEffect(() => {
    async function loadFolders() {
      try {
        const all = await listFiles(currentFolderId, token);
        setFolders(all.filter((f) => f.type === "folder"));
      } catch {
        setFolders([]);
      }
    }

    loadFolders();
  }, [currentFolderId, token]);

  // Load current folder item + per-user path
  useEffect(() => {
    // Root has no item and no path
    if (!currentFolderId) {
      setCurrentFolderItem(null);
      setCurrentPath([]);
      return;
    }

    async function loadCurrent() {
      try {
        const folder = await getFile(currentFolderId, token);
        setCurrentFolderItem(folder);

        // Per-user path (respects userTree)
        const path = await getPath(currentFolderId, token);
        setCurrentPath(path);
      } catch {
        setCurrentFolderItem(null);
        setCurrentPath([]);
      }
    }

    loadCurrent();
  }, [currentFolderId, token]);

  const handleEnterFolder = (folder) => {
    setCurrentFolderId(folder.id);
  };

  // Go one level up using per-user path instead of logical parentId
  const handleGoUp = () => {
    if (!currentFolderId) return; // already at root

    // No parent in path -> go to root (My Drive)
    if (!currentPath || currentPath.length < 2) {
      setCurrentFolderId(null);
      return;
    }

    // The element before the last is the effective parent for this user
    const parent = currentPath[currentPath.length - 2];
    setCurrentFolderId(parent.id);
  };

  const handleMoveHere = async () => {
    await onMove(sourceItem, currentFolderId);
    onClose();
  };

  if (!sourceItem) return null;

  const destinationLabel =
    currentFolderId === null
      ? "My Drive"
      : currentFolderItem?.name || "Current folder";

  const upLabel =
    currentFolderId === null
      ? null
      : currentPath.length < 2
      ? "Up to My Drive"
      : "Up to parent folder";

  return (
    <div className="move-dialog-overlay" role="dialog" aria-modal="true">
      <div className="move-dialog">
        <div className="move-dialog__header">
          <h2 className="move-dialog__title">Move item</h2>
          <button
            type="button"
            className="move-dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="move-dialog__body">
          <div className="move-dialog__text">
            Choose a destination folder for <strong>{sourceItem.name}</strong>.
          </div>

          {/* Current destination label */}
          <div className="move-dialog__current-path">
            <span className="material-symbols-outlined" aria-hidden="true">
              folder_open
            </span>
            <span>Destination: {destinationLabel}</span>
          </div>

          <ul className="move-dialog__folder-list">
            {upLabel && (
              <li className="move-dialog__folder-item" onClick={handleGoUp}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_upward
                </span>
                <span>{upLabel}</span>
              </li>
            )}

            {folders.map((f) => (
              <li
                key={f.id}
                className="move-dialog__folder-item"
                onClick={() => handleEnterFolder(f)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  folder
                </span>
                <span>{f.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="move-dialog__footer">
          <button
            type="button"
            className="move-dialog__btn move-dialog__btn--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="move-dialog__btn move-dialog__btn--primary"
            onClick={handleMoveHere}
          >
            Move here
          </button>
        </div>
      </div>
    </div>
  );
}
