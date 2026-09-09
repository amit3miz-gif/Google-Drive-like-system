import { useEffect, useState } from "react";
import { listFiles } from "../services/fileService";

/**
 * useDriveBrowser
 * Main page browsing files logic: folder navigation, selection and breadcrumbs.
 *
 * options:
 *  - token: auth token used for API calls
 *  - rootName: display name of the root folder (e.g., "My Drive")
 *  - initialFolderId: starting folder id (null means root)
 *  - initialPath: optional precomputed breadcrumb path (used when deep-linking)
 */
export function useDriveBrowser({ token, rootName, initialFolderId = null, initialPath = null }) {
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [path, setPath] = useState(() =>
    initialPath && initialPath.length
      ? initialPath
      : [{ id: initialFolderId, name: rootName }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentFolderId = path[path.length - 1].id;
  
   // Reset path when initialFolderId changes
  useEffect(() => {
    if (initialPath && initialPath.length) { 
      setPath(initialPath);
    } else {
      setPath([{ id: initialFolderId, name: rootName }]);
    }
    setSelected(null);
  }, [initialFolderId, rootName, initialPath]);

  // Load files whenever current folder or token change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setSelected(null);

    listFiles(currentFolderId, token)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load files");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentFolderId, token]);

  // Handle item click 
  const handleItemClick = (item) => {
    setSelected(item);

    if (item.type === "folder") {
      const current = path[path.length - 1];
      if (current?.id === item.id) return;

      setPath([...path, { id: item.id, name: item.name }]);
      setSelected(null);
    }
  };
  
  // Handle breadcrumb navigation
  const handleNavigate = (_crumb, index) => {
    setPath(path.slice(0, index + 1));
    setSelected(null);
  };

  return {
    view,
    setView,
    selected,
    items,
    path,
    loading,
    error,
    currentFolderId,
    handleItemClick,
    handleNavigate,
    setSelected,
    setItems,
    setError,
    setLoading,
  };
}
