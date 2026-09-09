import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fileService } from "../services/fileService";
import { handleRenameItem } from "../utils/renameHelpers";

export function useGlobalDriveView({ token }) {
  const navigate = useNavigate();
  const location = useLocation(); // used to reset details item on page change

  // Viewer state shared across all Drive pages
  const [openedFile, setOpenedFile] = useState(null); // { id, name } | null
  const [viewerDirty, setViewerDirty] = useState(false);

  // Details drawer state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);

  // force refresh details fetch when data changes (e.g., after save)
  const [detailsRefreshKey, setDetailsRefreshKey] = useState(0);

  const refreshDetails = () => {
    setDetailsRefreshKey((k) => k + 1);
  };

  // Share dialog state
  const [shareTarget, setShareTarget] = useState(null); // { id, name } | null

  // Close viewer with unsaved-changes confirmation
  const closeViewer = () => {
    if (viewerDirty) {
      const ok = window.confirm("You have unsaved changes. Close anyway?");
      if (!ok) return;
    }
    setOpenedFile(null);
    setViewerDirty(false);
  };

  // Details helpers
  const closeDetails = () => {
    setDetailsOpen(false);
  };

  // open panel even if item is null
  const openDetailsPanel = (itemOrNull) => {
    setDetailsItem(itemOrNull?.id ? itemOrNull : null);
    setDetailsOpen(true);
  };

  // toolbar behavior like Drive
  const toggleDetailsPanel = (itemOrNull) => {
    setDetailsOpen((prev) => {
      if (prev) return false; // close if already open
      setDetailsItem(itemOrNull?.id ? itemOrNull : null);
      return true;
    });
  };

  // optional toggle behavior for "Details" menu item
  const toggleDetails = (item) => {
    if (!item?.id) {
      openDetailsPanel(null);
      return;
    }

    setDetailsItem((prevItem) => {
      const isSame = prevItem?.id === item.id;

      setDetailsOpen((prevOpen) => !(prevOpen && isSame));

      return item;
    });
  };

  // Keep drawer open across pages, but reset the item to avoid stale cross-page details
  useEffect(() => {
    setDetailsItem(null);
  }, [location.pathname]);

  // Close viewer on Escape key
  useEffect(() => {
    if (!openedFile?.id) return;

    function onKeyDown(e) {
      if (e.key === "Escape") closeViewer();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openedFile?.id, viewerDirty]);

  // Close details on Escape key
  useEffect(() => {
    if (!detailsOpen) return;

    function onKeyDown(e) {
      if (e.key === "Escape") {
        closeDetails();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailsOpen]);

  // Item click (folder navigation / file open)
  const handleItemClick = async (item) => {
    if (item.type === "folder") {
      try {
        const rawPath = await fileService.getPath(item.id, token);
        const fullPath = [{ id: null, name: "My Drive" }, ...rawPath];

        navigate("/app/my-drive", {
          state: { initialFolderId: item.id, initialPath: fullPath },
        });

        return { ok: true };
      } catch (e) {
        return { ok: false, error: e?.message || "Failed to open folder" };
      }
    }

    // File: open in viewer
    setOpenedFile({ id: item.id, name: item.name });
    setViewerDirty(false);
    return { ok: true };
  };

  // Share dialog helpers
  const openShareDialog = (item) => {
    setShareTarget({ id: item.id, name: item.name });
  };

  const closeShareDialog = () => {
    setShareTarget(null);
  };

  // Called from ShareDialog component
  const handleShare = async (email, level) => {
    // permission mapping
    const read = true;
    const write = level === "write" || level === "manage";
    const manage = level === "manage";

    try {
      if (!shareTarget?.id) {
        return { ok: false, error: "No file selected for sharing" };
      }

      const user = await fileService.getUserByUsername(email, token);
      const userId = user.id;

      // Check if permission already exists
      const perms = await fileService.listPermissions(shareTarget.id, token);
      const existing = perms.find((p) => p.userId === userId && p.pId != null);

      if (existing) {
        // Update existing permission
        await fileService.patchPermission(
          shareTarget.id,
          existing.pId,
          { read, write, manage },
          token
        );
      } else {
        // Create new permission
        await fileService.createPermission(
          shareTarget.id,
          { userId, read, write, manage },
          token
        );
      }

      closeShareDialog();
      return { ok: true };
    } catch (err) {
      const status = err?.status || err?.response?.status;
      if (status === 404) {
        return { ok: false, error: "User with this email was not found" };
      }

      const msg =
        err?.data?.error ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to share file";

      return { ok: false, error: msg };
    }
  };

  // Shared menu actions
  // Only actions that are global and not page-specific:
  //  - move file to trash
  //  - set star on item
  //  - open share dialog for item
  //  - toggle star on file
  //  - toggle details drawer
  //  - open share dialog
  const handleMenuAction = async (action, item) => {
    try {
      switch (action) {
        case "download":
          await fileService.downloadSingleItem(item.id, token);
          return { ok: true };

        case "rename":
          // Rename item
          await handleRenameItem(item, token, fileService);
          return { ok: true };

        case "move_to_trash":
          // Move file to trash
          await fileService.moveToTrash(item.id, token);
          return { ok: true };

        case "star":
          await fileService.setStarred(item.id, true, token);
          return { ok: true };

        case "share":
          openShareDialog(item);
          return { ok: true };

        // Details action
        case "details":
          toggleDetails(item);
          return { ok: true };

        default:
          return { ok: true };
      }
    } catch (e) {
      return { ok: false, error: e?.message || "Action failed" };
    }
  };

  return {
    // navigation + click
    handleItemClick,

    // shared menu actions
    handleMenuAction,

    // viewer state + helpers
    openedFile,
    setOpenedFile,
    viewerDirty,
    setViewerDirty,
    closeViewer,

    // sharing
    shareTarget,
    closeShareDialog,
    handleShare,

    // Details drawer state and handlers
    detailsOpen,
    detailsItem,
    setDetailsItem,
    openDetailsPanel,
    toggleDetailsPanel,
    closeDetails,
    toggleDetails,
    detailsRefreshKey,
    refreshDetails,
  };
}
