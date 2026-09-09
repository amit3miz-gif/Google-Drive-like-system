import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";

import FileList from "../components/files/FileList";
import ListHeader from "../components/files/ListHeader";
import InlineError from "../components/common/InlineError";
import RenameDialog from "../components/dialog/RenameDialog";
import { getFullMenuActions } from "../components/menu/menuProfiles";
import { handleFileMenuAction } from "../services/fileMenuActions";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { getThemeColors } from "../styles/Theme";
import { fileService } from "../services/fileService";

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.pageBg },
    state: { padding: 14, gap: 12 },
    muted: { color: c.muted },
    loginBtn: {
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.primary,
    },
    loginBtnText: { color: c.onPrimary, fontWeight: "700" },
  });
}

export default function SharedWithMePage() {
  // Authentication state
  const { token, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  // Shared items data
  const [items, setItems] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rename dialog state
  const [rename, setRename] = useState({ visible: false, item: null });

  // View mode and sorting direction
  const [view, setView] = useState("list"); // "list" | "grid"
  const [nameSortDir, setNameSortDir] = useState("asc"); // "asc" | "desc"

  // Fetch items shared with the current user
  const reload = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setError(null);

    // If user is not authenticated, clear items
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const data = await fileService.listSharedWithMe(token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
      setError(e?.message || "Failed to load shared files.");
    } finally {
      setLoading(false);
    }
  }, [token, authLoading]);

  // Initial load on mount
  useEffect(() => {
    reload();
  }, [reload]);

  // Reload when the screen is focused (returning from another page)
  useFocusEffect(
    useCallback(() => {
      if (!token || authLoading) return;
      reload();
    }, [reload, token, authLoading])
  );

  // Sort items by name according to sort direction
  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const res = String(a?.name || "").localeCompare(
        String(b?.name || ""),
        undefined,
        { sensitivity: "base" }
      );
      return nameSortDir === "asc" ? res : -res;
    });
    return copy;
  }, [items, nameSortDir]);

  // Build menu actions list for each item with shared-items policy restrictions
  const getActions = useCallback((item) => {
    const actions = getFullMenuActions({ isStarred: !!item?.starred }) || [];

    // Shared items are read-only in some aspects: block delete/move/share
    const blocked = new Set(["delete", "move", "share"]);
    const filtered = actions.filter((a) => !blocked.has(a.key));

    // Folders do not support download
    if (item?.type === "folder") {
      return filtered.filter((a) => a.key !== "download");
    }

    return filtered;
  }, []);

  // Execute menu action (rename handled via dialog)
  const onMenuAction = useCallback(
    async (actionKey, item) => {
      setError(null);

      // Rename requires user input
      if (actionKey === "rename") {
        setRename({ visible: true, item });
        return;
      }

      const res = await handleFileMenuAction({
        actionKey,
        item,
        screen: "shared",
        token,
      });

      if (res?.ok === false) {
        setError(res.error || "Action failed.");
        return;
      }

      // Avoid unnecessary reloads for pure navigation actions
      if (actionKey === "details" || actionKey === "move") return;

      await reload();
    },
    [token, reload]
  );

  // Navigate to folder or file details on item press
  const handleItemPress = useCallback((item) => {
    if (!item?.id) return;

    if (item.type === "folder") {
      router.push(`/(stack)/folder/${item.id}`);
    } else {
      router.push(`/(stack)/file/${item.id}`);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Error message */}
      <InlineError message={error} />

      {/* Rename dialog */}
      <RenameDialog
        visible={rename.visible}
        title="Rename"
        initialValue={rename.item?.name || ""}
        confirmText="Rename"
        onCancel={() => setRename({ visible: false, item: null })}
        onConfirm={async (newName) => {
          const curItem = rename.item;
          setRename({ visible: false, item: null });

          const res = await handleFileMenuAction({
            actionKey: "rename",
            item: curItem,
            screen: "shared",
            token,
            payload: { name: newName },
          });

          if (res?.ok === false) {
            setError(res.error || "Failed to rename item.");
            return;
          }

          await reload();
        }}
      />

      {/* Header with sorting and view toggle */}
      {!loading && token && items.length > 0 && (
        <ListHeader
          title="Name"
          view={view}
          sortDir={nameSortDir}
          onToggleView={() => setView((v) => (v === "list" ? "grid" : "list"))}
          onToggleSort={() =>
            setNameSortDir((d) => (d === "asc" ? "desc" : "asc"))
          }
        />
      )}

      {/* Loading state */}
      {loading && (
        <View style={styles.state}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      )}

      {/* Not logged in state */}
      {!loading && !token && (
        <View style={styles.state}>
          <Text style={styles.muted}>Please log in to view your shared files.</Text>
          <Pressable onPress={() => router.push("/login")} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>Go to Login</Text>
          </Pressable>
        </View>
      )}

      {/* Empty state */}
      {!loading && token && sortedItems.length === 0 && (
        <View style={styles.state}>
          <Text style={styles.muted}>No shared items</Text>
        </View>
      )}

      {/* Shared items list */}
      {!loading && token && sortedItems.length > 0 && (
        <FileList
          items={sortedItems}
          view={view}
          onItemPress={handleItemPress}
          showStar={true}
          menuEnabled={true}
          getActions={getActions}
          onMenuAction={onMenuAction}
        />
      )}
    </View>
  );
}