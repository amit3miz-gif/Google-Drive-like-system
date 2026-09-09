import { useLayoutEffect, useMemo, useRef, useState } from "react";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("he-IL");
  } catch {
    return "—";
  }
}

export default function FileListItem({
  item,
  view = "list",
  isTrash = false,
  showMeta = true,

  onClick,
  trashActions,
  starActions,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  menuRootRef,
  onMenuAction,
  enableDownload = false,

  // MOVE support
  allowMove = false,
}) {
  const iconName = item.type === "folder" ? "folder" : "description";

  // anchor for positioning the fixed menu
  const menuBtnRef = useRef(null);

  // menu position (fixed)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useLayoutEffect(() => {
    if (!isMenuOpen) return;

    const updatePos = () => {
      const r = menuBtnRef.current?.getBoundingClientRect();
      if (!r) return;

      const top = r.bottom + 8;
      const right = window.innerWidth - r.right;

      setMenuPos({ top, right });
    };

    updatePos();
    window.addEventListener("resize", updatePos);
    return () => window.removeEventListener("resize", updatePos);
  }, [isMenuOpen]);

  const menuItems = useMemo(() => {
    const items = [];

    // Starred page actions
    if (starActions) {
      if (onMenuAction) {
        items.push({
          key: "details",
          icon: "info",
          label: "Details",
          onClick: () => onMenuAction("details", item),
        });
      }

      items.push({
        key: "unstar",
        icon: "star",
        label: "Remove from starred",
        onClick: () => starActions.onUnstar?.(item),
      });

      return items;
    }

    // Trash page actions
    if (trashActions) {
      if (onMenuAction) {
        items.push({
          key: "details",
          icon: "info",
          label: "Details",
          onClick: () => onMenuAction("details", item),
        });
      }

      items.push({
        key: "restore",
        icon: "restore_from_trash",
        label: "Restore",
        onClick: () => trashActions.onRestore?.(item),
      });

      items.push({
        key: "delete_forever",
        icon: "delete_forever",
        label: "Delete Permanently",
        danger: true,
        onClick: () => trashActions.onPermanentDelete?.(item),
      });

      return items;
    }

    // Generic actions for normal pages
    if (onMenuAction) {
      if (allowMove) {
        items.push({
          key: "move",
          icon: "drive_file_move",
          label: "Move",
          onClick: () => onMenuAction("move", item),
        });
      }

      // Download only when enabled + only for files (not folders)
      if (enableDownload && item.type !== "folder") {
        items.push({
          key: "download",
          icon: "download",
          label: "Download",
          onClick: () => onMenuAction("download", item),
        });
      }

      items.push({
        key: "rename",
        icon: "edit",
        label: "Rename",
        onClick: () => onMenuAction("rename", item),
      });

      items.push({
        key: "details",
        icon: "info",
        label: "Details",
        onClick: () => onMenuAction("details", item),
      });

      items.push({
        key: "move_to_trash",
        icon: "delete",
        label: "Move to bin",
        danger: true,
        onClick: () => onMenuAction("move_to_trash", item),
      });

      items.push({
        key: "star",
        icon: "star",
        label: "Add to starred",
        onClick: () => onMenuAction("star", item),
      });

      items.push({
        key: "share",
        icon: "person_add",
        label: "Share",
        onClick: () => onMenuAction("share", item),
      });
    }

    return items;
  }, [item, starActions, trashActions, onMenuAction, enableDownload, allowMove]);

  const dateText = isTrash
    ? formatDate(item.trashedAt)
    : formatDate(item.lastModified);

  return (
    <div className={`file-list-item ${isMenuOpen ? "file-list-item--menu-open" : ""}`}>
      <button type="button" className="file-list-item__main" onClick={onClick}>
        <span className="file-list-item__icon material-symbols-outlined" aria-hidden="true">
          {iconName}
        </span>

        <span className="file-list-item__name">{item.name}</span>

        {/* Hide metadata in compact/search mode */}
        {view === "list" && showMeta && (
          <>
            <span className="file-list-item__owner" title={item.ownerName || ""}>
              {item.ownerName || "—"}
            </span>
            <span
              className="file-list-item__modified"
              title={isTrash ? (item.trashedAt || "") : (item.lastModified || "")}
            >
              {dateText}
            </span>
          </>
        )}
      </button>

      <div className="file-menu-root" ref={menuRootRef}>
        <button
          ref={menuBtnRef}
          type="button"
          className="file-list-item__menu has-tooltip"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu?.();
          }}
          aria-label="More actions"
          aria-haspopup="menu"
          aria-expanded={!!isMenuOpen}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            more_vert
          </span>
          <span className="ui-tooltip" role="tooltip">
            More actions
          </span>
        </button>

        {isMenuOpen && menuItems.length > 0 && (
          <div
            className="file-menu file-menu--fixed"
            role="menu"
            style={{ top: menuPos.top, right: menuPos.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((mi) => (
              <button
                key={mi.key}
                type="button"
                className={`file-menu__item ${mi.danger ? "file-menu__item--danger" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseMenu?.();
                  mi.onClick();
                }}
                role="menuitem"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {mi.icon}
                </span>
                <span>{mi.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
