import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useDriveView } from "../context/DriveViewContext";
import { fileService } from "../services/fileService";

import FileToolbar from "../components/files/FileToolbar";
import Breadcrumbs from "../components/files/Breadcrumbs";
import FileList from "../components/files/FileList";
import Spinner from "../components/common/Spinner";
import FileViewer from "../components/viewers/FileViewer";
import InlineError from "../components/common/inLineError";
import DetailsDrawer from "../components/files/DetailsDrawer";

import "./DrivePage.css";

/**
 * StarredPage
 * Page for browsing files and folders starred by the user.
 */
export default function StarredPage() {
  const { token } = useAuth();

  // Global viewer state and handlers
  const {
    handleItemClick: handleGlobalItemClick,
    openedFile,
    setOpenedFile,
    viewerDirty,
    setViewerDirty,
    closeViewer,
    detailsOpen,
    detailsItem,
    openDetailsPanel,
    toggleDetailsPanel,
    closeDetails,
    setDetailsItem,
    detailsRefreshKey,
    refreshDetails,
  } = useDriveView();

  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Static breadcrumb path for the Starred page
  const path = [{ id: null, name: "Starred" }];

  /**
   * Load starred items from the server and normalize
   * them into the shape expected by <FileList />.
   */
  const loadStarred = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fileService.getStarred(token);

      setItems(
        (Array.isArray(data) ? data : []).map((f) => ({
          id: f.id,
          type: f.type || "file", // Could be 'file' or 'folder'
          name: f.name,
          lastModified: f.updatedAt || f.createdAt,
          ownerName: f.ownerName,
        }))
      );
    } catch (e) {
      setError(e?.message || "Failed to load starred files");
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Initial load of starred items when the component mounts
   * or when the auth token changes.
   */
  useEffect(() => {
    loadStarred();
  }, [loadStarred]);

  // Handle un-starring an item from the starred list
  const handleUnstar = async (item) => {
    setError("");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await fileService.setStarred(item.id, false, token);
    } catch (err) {
      setItems((prev) => [item, ...prev]);
      setError(err?.message || "Failed to update starred file");
    }
  };

  // Starred-specific actions object
  const starActions = {
    onUnstar: handleUnstar,
  };

  /**
   * Handle clicking an item in the Starred list.
   */
  const handleClick = async (item) => {
    setSelected(item);
    setDetailsItem(item); // keep details target in sync with selection

    // If details drawer is open, clicking updates details instead of opening viewer
    if (detailsOpen) {
      openDetailsPanel(item);
      return;
    }

    await handleGlobalItemClick(item);
  };

  // Toolbar details target: selected > openedFile > none
  const detailsTarget = selected || openedFile || null;

  return (
    <div className="drive-page">
      <div className="drive-panel">
        <div className="drive-body">
          <div className="drive-main">
            <div className="drive-header">
              <Breadcrumbs path={path} />
              <FileToolbar
                view={view}
                onChangeView={setView}
                // Drive-like toggle (open/close)
                onViewDetails={() => toggleDetailsPanel(detailsTarget)}
                canViewDetails={true}
              />
            </div>

            {selected && (
              <div className="drive-selected">
                Selected: <strong>{selected.name}</strong>
              </div>
            )}

            {loading && (
              <div className="drive-loading">
                <Spinner />
              </div>
            )}

            {!loading && <InlineError message={error} />}

            {!loading && !error && (
              <FileList
                items={items}
                view={view}
                onItemClick={handleClick}
                starActions={starActions}
                compact={false}
              />
            )}
          </div>

          <DetailsDrawer
            open={detailsOpen}
            item={detailsItem}
            token={token}
            onClose={closeDetails}
            detailsRefreshKey={detailsRefreshKey}
          />
        </div>

        {openedFile?.id && (
          <div
            className="drive-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="File viewer"
            onMouseDown={closeViewer}
          >
            <div
              className="drive-modal"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <FileViewer
                fileId={openedFile.id}
                fileName={openedFile.name}
                token={token}
                onClose={closeViewer}
                onDirtyChange={setViewerDirty}
                onDeleted={async () => {
                  // Reset viewer-related state
                  setOpenedFile(null);
                  setViewerDirty(false);
                  setSelected(null);

                  // Reload starred list to reflect deletion
                  await loadStarred();
                }}
                onSaved={async () => {
                  // reload starred list so timestamps / ordering update
                  await loadStarred();
                  refreshDetails();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
