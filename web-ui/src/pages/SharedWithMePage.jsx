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
import ShareDialog from "../components/layout/ShareDialog";

import "./DrivePage.css";

/**
 * SharedWithMePage
 * Page for browsing files (and folders) that were shared with the user.
 */
export default function SharedWithMePage() {
  const { token } = useAuth();

  // Global viewer state and handlers
  const {
    handleItemClick: handleGlobalItemClick,
    handleMenuAction,
    openedFile,
    setOpenedFile,
    viewerDirty,
    setViewerDirty,
    closeViewer,
    detailsOpen,
    detailsItem,
    closeDetails,
    openDetailsPanel,
    toggleDetailsPanel,
    setDetailsItem,
    detailsRefreshKey,
    refreshDetails,
    shareTarget,
    closeShareDialog,
    handleShare,
  } = useDriveView();

  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Shared-with-me is a logical root path
  const path = [{ id: null, name: "Shared with me" }];

  /**
   * Load the "Shared with me" list from the server and normalize it
   * into the shape expected by <FileList />.
   */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fileService.listSharedWithMe(token);

      setItems(
        (data || []).map((f) => ({
          id: f.id,
          type: f.type === "folder" ? "folder" : "file",
          name: f.name,
          ownerName: f.ownerName,
          lastModified: f.lastModified,
        }))
      );
    } catch (e) {
      setError(e.message || "Failed to load shared files");
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Initial load of shared-with-me items when the component mounts
   * or when the auth token changes.
   */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await load();
      if (cancelled) return;
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [token, load]);

  /**
   * Handle clicking an item in the Shared-with-me list.
   */
  const handleClick = async (item) => {
    setSelected(item);

    // If details drawer is open, clicking updates details instead of opening viewer/navigating
    if (detailsOpen) {
      setDetailsItem(item);
      openDetailsPanel(item);
      return;
    }

    // Delegate to the global viewer hook to open the file in the modal
    await handleGlobalItemClick(item);
  };

  const handleSharedMenuAction = async (action, item) => {
    setSelected(null);
    await handleMenuAction(action, item);

    // Refresh recent list after any action
    await load();
  };

  const detailsTarget = selected || openedFile || null;

  return (
    <div className="drive-page">
      <div className="drive-panel">
        <div className="drive-body">
          <div className="drive-main">
            <div className="drive-header">
              <Breadcrumbs path={path} onNavigate={() => {}} />
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

            {!loading && (
              <FileList
                items={items}
                view={view}
                onItemClick={handleClick}
                onMenuAction={handleSharedMenuAction}
                enableDownload={true}
                compact={false}
              />
            )}

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
                      setOpenedFile(null);
                      setViewerDirty(false);
                      setSelected(null);
                      await load();
                    }}
                    onSaved={async () => {
                      await load();
                      refreshDetails();
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <DetailsDrawer
            open={detailsOpen}
            item={detailsItem}
            token={token}
            onClose={closeDetails}
            detailsRefreshKey={detailsRefreshKey}
          />

          {/* Share dialog render */}
          {shareTarget && (
            <ShareDialog
              isOpen={!!shareTarget}
              file={shareTarget}
              onClose={closeShareDialog}
              onShare={async (email, level) => {
                const res = await handleShare(email, level);
                if (res?.ok === false)
                  setError(res.error || "Failed to share file");
                else setError("");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
