import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useDriveBrowser } from "../hooks/useDriveBrowser";
import { useDriveView } from "../context/DriveViewContext";
import { fileService, listFiles } from "../services/fileService";

import FileToolbar from "../components/files/FileToolbar";
import Breadcrumbs from "../components/files/Breadcrumbs";
import FileList from "../components/files/FileList";
import Spinner from "../components/common/Spinner";
import NewMenu from "../components/layout/NewMenu";
import FileViewer from "../components/viewers/FileViewer";
import InlineError from "../components/common/inLineError";
import DetailsDrawer from "../components/files/DetailsDrawer";
import ShareDialog from "../components/layout/ShareDialog";
import MoveDialog from "../components/layout/MoveDialog";
import NameDialog from "../components/layout/NameDialog";
import { ALLOWED_EXTENSIONS } from "../utils/fileConstants";

import "./DrivePage.css";

/**
 * DrivePage
 * Main page for browsing "My Drive" files and folders.
 */
export default function DrivePage() {
  const { token } = useAuth();
  const location = useLocation();

  const initialFolderId = location.state?.initialFolderId ?? null;
  const initialPath = location.state?.initialPath ?? null;

  const [isNewOpen, setIsNewOpen] = useState(false);
  const newMenuRef = useRef(null);

  // Dialog state for "create file/folder"
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);

  const {
    view,
    setView,
    selected,
    items,
    path,
    loading,
    error,
    currentFolderId,
    handleItemClick: handleItemClickFromBrowser,
    handleNavigate,
    setSelected,
    setItems,
    setError,
    setLoading,
  } = useDriveBrowser({
    token,
    rootName: "My Drive",
    initialFolderId,
    initialPath,
  });

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

  // MOVE: source item to move
  const [moveSource, setMoveSource] = useState(null);

  function getUniqueName(name, existingItems) {
    const dot = name.lastIndexOf(".");
    const base = dot !== -1 ? name.slice(0, dot) : name;
    const ext = dot !== -1 ? name.slice(dot) : "";

    let i = 1;
    let candidate = `${base} (${i})${ext}`;
    const names = new Set(existingItems.map((i) => i.name));

    while (names.has(candidate)) {
      i += 1;
      candidate = `${base} (${i})${ext}`;
    }
    return candidate;
  }

  // Read file as Data URL (for images)
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Upload text file
  async function handleUploadText(file) {
    if (!token) return;

    try {
      setError("");
      setLoading(true);

      const existing = items.find(
        (i) => i.type === "file" && i.name === file.name
      );

      // Replace or keep both
      if (existing) {
        const replace = window.confirm("Replace existing file?");
        if (replace) {
          const content = await file.text();
          await fileService.update(existing.id, { content }, token);
          const refreshed = await listFiles(currentFolderId, token);
          setItems(refreshed);
          return;
        }
      }

      const name = existing ? getUniqueName(file.name, items) : file.name;

      await fileService.createFile(
        { name, parentId: currentFolderId ?? null, content: "" },
        token
      );

      const afterCreate = await listFiles(currentFolderId, token);
      const created = afterCreate.find((i) => i.name === name);
      if (!created) return;

      const content = await file.text();
      await fileService.update(created.id, { content }, token);

      const finalList = await listFiles(currentFolderId, token);
      setItems(finalList);
    } catch (e) {
      setError(e?.message || "Failed to upload text file");
    } finally {
      setLoading(false);
    }
  }

  // Upload image file
  async function handleUploadImage(file) {
    if (!token) return;

    try {
      setError("");
      setLoading(true);

      const existing = items.find(
        (i) => i.type === "file" && i.name === file.name
      );

      // Replace or keep both
      if (existing) {
        const replace = window.confirm("Replace existing file?");
        if (replace) {
          const content = await readFileAsDataUrl(file);
          await fileService.update(existing.id, { content }, token);
          const refreshed = await listFiles(currentFolderId, token);
          setItems(refreshed);
          return;
        }
      }

      const name = existing ? getUniqueName(file.name, items) : file.name;

      await fileService.createFile(
        { name, parentId: currentFolderId ?? null, content: "" },
        token
      );

      const afterCreate = await listFiles(currentFolderId, token);
      const created = afterCreate.find((i) => i.name === name);
      if (!created) return;

      const content = await readFileAsDataUrl(file);
      await fileService.update(created.id, { content }, token);

      const finalList = await listFiles(currentFolderId, token);
      setItems(finalList);
    } catch (e) {
      setError(e?.message || "Failed to upload image");
    } finally {
      setLoading(false);
    }
  }

  // Close the "New" menu on click outside + ESC
  useEffect(() => {
    if (!isNewOpen) return;

    function onMouseDown(e) {
      if (!newMenuRef.current) return;
      if (!newMenuRef.current.contains(e.target)) {
        setIsNewOpen(false);
      }
    }

    function onKeyDown(e) {
      if (e.key === "Escape") {
        setIsNewOpen(false);
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isNewOpen]);

  // Handle item click: folders -> navigate, files -> open viewer
  const handleItemClick = (item) => {
    setSelected(item);

    // If details drawer is open, clicking updates details instead of opening viewer/navigating
    if (detailsOpen) {
      setDetailsItem(item);
      openDetailsPanel(item);
      return; // keep your behavior as-is
    }

    if (item.type === "folder") {
      handleItemClickFromBrowser(item);
      setOpenedFile(null);
      setViewerDirty(false);
    } else {
      handleGlobalItemClick(item);
    }
  };

  function hasAllowedExtension(fileName) {
    const lower = fileName.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }

  // Create new file using dialog value
  async function handleCreateFile(nameFromDialog) {
    setSelected(null);

    let finalName = nameFromDialog.trim();
    if (!finalName) return false;

    if (!finalName.includes(".")) {
      finalName += ".txt";
    } else if (finalName.endsWith(".")) {
      finalName += "txt";
    }

    if (!hasAllowedExtension(finalName)) {
      setError(
        "Unsupported file extension. Allowed: .jpeg, .jpg, .png, .gif, .webp, .svg, .txt"
      );
      return true;
    }

    try {
      setError("");
      setLoading(true);

      await fileService.createFile(
        { name: finalName, parentId: currentFolderId ?? null, content: "" },
        token
      );

      const refreshed = await listFiles(currentFolderId, token);
      setItems(refreshed);
      return true;
    } catch (e) {
      setError(e?.message || "Failed to create file");
      return false;
    } finally {
      setLoading(false);
    }
  }

  // Create new folder using dialog value
  async function handleCreateFolder(nameFromDialog) {
    setSelected(null);

    const name = nameFromDialog.trim();
    if (!name) return false;

    try {
      setError("");
      setLoading(true);

      await fileService.createFolder(
        { name: name.trim(), parentId: currentFolderId ?? null },
        token
      );

      const refreshed = await listFiles(currentFolderId, token);
      setItems(refreshed);
      return true;
    } catch (e) {
      setError(e?.message || "Failed to create folder");
      return false;
    } finally {
      setLoading(false);
    }
  }

  // Move item to another folder 
  async function handleMoveItem(item, targetFolderId) {
    try {
      setError("");
      setLoading(true);

      await fileService.move(item.id, targetFolderId || null, token);

      const refreshed = await listFiles(currentFolderId, token);
      setItems(refreshed);
    } catch (e) {
      setError(e?.message || "Failed to move item");
    } finally {
      setLoading(false);
    }
  }

  // Shared menu action handler that refreshes file list after action
  const handleSharedMenuAction = async (action, item) => {
    setSelected(null);

    // MOVE: intercept before handleMenuAction
    if (action === "move") {
      setMoveSource(item);
      return;
    }

    await handleMenuAction(action, item);

    // Refresh file list after action
    listFiles(currentFolderId, token).then(setItems).catch(() => {});
  };

  // ===== toolbar details target =====
  const detailsTarget = selected || openedFile || null;

  return (
    <div className="drive-page">
      <div className="drive-panel">
        <div className="drive-body">
          <div className="drive-main">
            <div className="drive-header">
              <Breadcrumbs path={path} onNavigate={handleNavigate} />

              <div className="drive-actions">
                <div className="drive-new-wrapper" ref={newMenuRef}>
                  <button
                    type="button"
                    className="new-btn new-btn--toolbar"
                    onClick={() => setIsNewOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={isNewOpen || undefined}
                    aria-label="Create new"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      add
                    </span>
                    New
                  </button>

                  {isNewOpen && (
                    <NewMenu
                      onNewFile={() => {
                        setSelected(null);
                        setFileDialogOpen(true);
                      }}
                      onNewFolder={() => {
                        setSelected(null);
                        setFolderDialogOpen(true);
                      }}
                      onUploadText={handleUploadText}
                      onUploadImage={handleUploadImage}
                      onClose={() => setIsNewOpen(false)}
                    />
                  )}
                </div>

                <FileToolbar
                  view={view}
                  onChangeView={setView}
                  onViewDetails={() => toggleDetailsPanel(detailsTarget)}
                  canViewDetails={true}
                />
              </div>
            </div>

            {selected && (
              <div className="drive-selected">
                Selected: <strong>{selected.name}</strong>
              </div>
            )}

            {loading && <Spinner />}
            {!loading && <InlineError message={error} />}

            {!loading && items.length === 0 && (
              <div className="drive-empty">No files or folders</div>
            )}

            {!loading && items.length > 0 && (
              <FileList
                items={items}
                view={view}
                onItemClick={handleItemClick}
                onMenuAction={handleSharedMenuAction}
                enableDownload={true}
                compact={false}
                allowMove={true}
              />
            )}
          </div>

          {/* ===== drawer as flex sibling ===== */}
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
            <div className="drive-modal" onMouseDown={(e) => e.stopPropagation()}>
              <FileViewer
                fileId={openedFile.id}
                fileName={openedFile.name}
                token={token}
                onClose={closeViewer}
                onDirtyChange={setViewerDirty}
                onDeleted={() => {
                  setOpenedFile(null);
                  setViewerDirty(false);
                  setSelected(null);

                  listFiles(currentFolderId, token)
                    .then(setItems)
                    .catch(() => {});
                }}
                onSaved={() => {
                  listFiles(currentFolderId, token)
                    .then(setItems)
                    .catch(() => {});
                  refreshDetails(); // re-fetch details so Updated is fresh
                }}
              />
            </div>
          </div>
        )}

        {shareTarget && (
          <ShareDialog
            isOpen={!!shareTarget}
            file={shareTarget}
            onClose={closeShareDialog}
            onShare={async (email, level) => {
              const res = await handleShare(email, level);
              if (res?.ok === false) setError(res.error || "Failed to share file");
              else setError("");
            }}
          />
        )}

        {/* MOVE dialog */}
        {moveSource && (
          <MoveDialog
            token={token}
            sourceItem={moveSource}
            onClose={() => setMoveSource(null)}
            onMove={handleMoveItem}
          />
        )}

        {/* Name dialogs for file/folder creation */}
        <NameDialog
          isOpen={fileDialogOpen}
          title="Create new file"
          label="File name"
          confirmText="Create file"
          onConfirm={async (name) => {
            const ok = await handleCreateFile(name);
            if (ok) {
              setFileDialogOpen(false);
              setIsNewOpen(false);
            }
          }}
          onCancel={() => {
            setFileDialogOpen(false);
            setIsNewOpen(false);
          }}
        />

        <NameDialog
          isOpen={folderDialogOpen}
          title="Create new folder"
          label="Folder name"
          confirmText="Create folder"
          onConfirm={async (name) => {
            const ok = await handleCreateFolder(name);
            if (ok) {
              setFolderDialogOpen(false);
              setIsNewOpen(false);
            }
          }}
          onCancel={() => {
            setFolderDialogOpen(false);
            setIsNewOpen(false);
          }}
        />
      </div>
    </div>
  );
}
