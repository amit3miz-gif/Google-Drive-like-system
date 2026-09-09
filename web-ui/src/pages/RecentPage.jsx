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
 * RecentPage
 * Page for browsing recently edited files.
 * Uses the same global file viewer behavior as DrivePage.
 */
export default function RecentPage() {
  const { token } = useAuth();

  // Global viewer state and handlers from context
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
    toggleDetails,
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

  // Static breadcrumb path for the Recent page
  const path = [{ id: null, name: "Recent" }];

  /**
   * Load recent files from the server and normalize them into
   * the shape expected by <FileList />.
   */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fileService.listRecent(token);

      setItems(
        (data || []).map((f) => ({
          id: f.id,
          type: "file", // Recent list only contains files, no folders
          name: f.name,
          lastModified: f.updatedAt || f.createdAt,
          ownerName: f.ownerName,
        }))
      );
    } catch (e) {
      setError(e.message || "Failed to load recent files");
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Initial load of recent files when the component mounts
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
   * Handle clicking an item in the Recent list.
   * All items here are files, so clicking opens the global viewer.
   */
  const handleClick = async (item) => {
    setSelected(item);

    // If details drawer is open, clicking updates details instead of opening viewer
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
  );
}
