import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useDriveView } from "../context/DriveViewContext";
import { fileService } from "../services/fileService";

import FileToolbar from "../components/files/FileToolbar";
import Breadcrumbs from "../components/files/Breadcrumbs";
import Spinner from "../components/common/Spinner";
import FileList from "../components/files/FileList";
import InlineError from "../components/common/inLineError";
import DetailsDrawer from "../components/files/DetailsDrawer";

import "./DrivePage.css";

export default function TrashPage() {
  const { token } = useAuth();

  // details from global context
  const { detailsOpen, detailsItem, toggleDetailsPanel, closeDetails, setDetailsItem } = useDriveView();

  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const path = [{ id: null, name: "Bin" }];

  // Load trash items
  const loadTrash = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const data = await fileService.getTrash(token);

      const normalized = (Array.isArray(data) ? data : []).map((f) => ({
        id: f.id,
        type: f.type || "file",
        name: f.name,
        ownerName: f.ownerName,
        createdAt: f.createdAt ?? null,
        updatedAt: f.updatedAt ?? null,
        lastModified: f.updatedAt || f.createdAt || f.trashedAt || null,
        // trash-specific
        trashedAt: f.trashedAt ?? null,
        size: f.size ?? null,
        mimeType: f.mimeType ?? null,
      }));

      setItems(normalized);
    } catch (e) {
      setError(e?.message || "Failed to load bin");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestore = async (item) => {
    const ok = window.confirm(`Restore "${item.name}"?`);
    if (!ok) return;

    setError(""); // clear previous error

    // optimistic UI: remove item immediately
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    try {
      await fileService.restoreFromTrash(item.id, token);
      setSelected(null);
      closeDetails();
      if (detailsItem?.id === item.id) {
        setDetailsItem(null);
      }
    } catch (err) {
      // rollback
      setItems((prev) => [item, ...prev]);
      setError(err?.message || "Failed to restore");
    }
  };

  const handlePermanentDelete = async (item) => {
    const ok = window.confirm(
      `Permanently delete "${item.name}"? This cannot be undone.`
    );
    if (!ok) return;

    setError(""); // clear previous error

    // optimistic UI
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    try {
      await fileService.permanentlyDelete(item.id, token);
      setSelected(null);
      closeDetails();
      if (detailsItem?.id === item.id) {
        setDetailsItem(null);
      }
    } catch (err) {
      // rollback
      setItems((prev) => [item, ...prev]);
      setError(err?.message || "Failed to delete permanently");
    }
  };

  // Click on an item: keep your behavior (click => restore with confirm)
  const handleItemClick = async (item) => {
    setSelected(item);
    if (detailsOpen) {
      setDetailsItem(item);
    }
    await handleRestore(item);
  };

  // toolbar details target
  const detailsTarget = selected || null;

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
                // allow opening/closing the panel even when no item is selected
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

            {/* show error banner, but DO NOT hide the list */}
            {!loading && <InlineError message={error} />}

            {/* empty state */}
            {!loading && items.length === 0 && (
              <div className="drive-empty">Trash is empty</div>
            )}

            {/* list shows if there are items, even when error exists */}
            {!loading && items.length > 0 && (
              <FileList
                items={items}
                view={view}
                onItemClick={handleItemClick}
                trashActions={{
                  onRestore: handleRestore,
                  onPermanentDelete: handlePermanentDelete,
                }}
              />
            )}
          </div>

          <DetailsDrawer
            open={detailsOpen}
            item={detailsItem}
            token={token}
            onClose={closeDetails}
          />
        </div>
      </div>
    </div>
  );
}
