import { useCallback, useState } from "react";
import { useAuth } from "./useAuth";
import { listFiles, searchFiles } from "../services/fileService";

export function useFiles() {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (folderId = null) => {
      if (!token) {
        setItems([]);
        setError("");
        return [];
      }
      setLoading(true);
      setError("");
      try {
        const res = await listFiles(folderId, token); // returns data directly
        setItems(Array.isArray(res) ? res : []);
        return res;
      } catch (e) {
        setError(e?.message || "Failed to load files");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const search = useCallback(
    async (query) => {
      const q = String(query || "").trim();
      if (!q) return [];

      if (!token) {
        setItems([]);
        setError("");
        return [];
      }

      setLoading(true);
      setError("");
      try {
        const res = await searchFiles(q, token);
        setItems(Array.isArray(res) ? res : []);
        return res;
      } catch (e) {
        setError(e?.message || "Search failed");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );


  const resetError = useCallback(() => setError(""), []);

  return { items, loading, error, load, search, resetError, setItems };
}
