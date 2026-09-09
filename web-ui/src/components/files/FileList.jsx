import "../../styles/files.css";
import { useEffect, useRef, useState } from "react";
import FileListItem from "./FileListItem";

/**
 * FileList
 * - normal pages: show header + metadata columns in list view
 * - search modal: hide header + hide metadata columns
 */
export default function FileList({
  items = [],
  view = "list",
  onItemClick,
  trashActions,
  starActions,
  onMenuAction,
  enableDownload = false,

  // use this for search modal
  compact = false, // when true: no header + no owner/date columns

  // MOVE support (context menu action)
  allowMove = false,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRootRef = useRef(null);

  const isTrash = !!trashActions;

  // close on click outside
  useEffect(() => {
    function onDown(e) {
      if (!openMenuId) return;
      if (menuRootRef.current && !menuRootRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [openMenuId]);

  // close on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpenMenuId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!items.length) {
    return <div className="file-empty">No files or folders</div>;
  }

  const showHeader = view === "list" && !compact;
  const showMeta = view === "list" && !compact; // owner/date columns

  return (
    <div className={`file-list file-list--${view} ${compact ? "file-list--compact" : ""}`}>
      {showHeader && (
        <div className="file-list-header" role="row">
          <div className="file-list-header__name">Name</div>
          <div className="file-list-header__owner">Owner</div>
          <div className="file-list-header__modified">
            {isTrash ? "Date trashed" : "Date modified"}
          </div>
          <div className="file-list-header__menu" aria-hidden="true" />
        </div>
      )}

      {items.map((item) => {
        const isMenuOpen = openMenuId === item.id;

        return (
          <FileListItem
            key={item.id}
            item={item}
            view={view}
            isTrash={isTrash}
            showMeta={showMeta}
            onClick={() => onItemClick?.(item)}
            trashActions={trashActions}
            starActions={starActions}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() =>
              setOpenMenuId((prev) => (prev === item.id ? null : item.id))
            }
            onCloseMenu={() => setOpenMenuId(null)}
            menuRootRef={isMenuOpen ? menuRootRef : null}
            onMenuAction={onMenuAction}
            enableDownload={enableDownload}
            allowMove={allowMove}
          />
        );
      })}
    </div>
  );
}
