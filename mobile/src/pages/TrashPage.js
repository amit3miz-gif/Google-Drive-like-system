import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { getThemeColors } from "../styles/Theme";
import { fileService } from "../services/fileService";

import FileList from "../components/files/FileList";
import ListHeader from "../components/files/ListHeader";
import InlineError from "../components/common/InlineError";

import { handleFileMenuAction } from "../services/fileMenuActions";
import { getTrashMenuActions } from "../components/menu/menuProfiles";

import ConfirmDialog from "../components/dialog/ConfirmDialog";

// Initial state for confirmation dialog
const initialConfirm = {
  visible: false,
  actionKey: null,
  item: null,
  title: "",
  message: "",
  confirmText: "Confirm",
  danger: false,
};

export default function TrashPage() {
  const { token, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [confirm, setConfirm] = useState(initialConfirm);

  // View mode and sorting direction
  const [view, setView] = useState("list"); // "list" | "grid"
  const [nameSortDir, setNameSortDir] = useState("asc"); // "asc" | "desc"

  // Close confirmation dialog and reset its state
  const closeConfirm = useCallback(() => setConfirm(initialConfirm), []);

  // Fetch trashed items from backend
  const reload = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setError(null);

    // If user is not logged in, clear items
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const data = await fileService.getTrash(token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
      setError(e?.message || "Failed to load trash.");
    } finally {
      setLoading(false);
    }
  }, [token, authLoading]);

  // Initial load on mount
  useEffect(() => {
    reload();
  }, [reload]);

  // Reload when screen gains focus (e.g., returning from another screen)
  useFocusEffect(
    useCallback(() => {
      if (!token || authLoading) return;
      reload();
    }, [reload, token, authLoading])
  );

  // Sort items by name according to current sort direction
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

  // Trash-specific menu actions
  const getActions = useCallback(() => getTrashMenuActions(), []);

  // Execute menu action
  const runMenuAction = useCallback(
    async (actionKey, item) => {
      setError(null);

      const res = await handleFileMenuAction({
        actionKey,
        item,
        screen: "trash",
        token,
      });

      if (res?.ok === false) {
        setError(res.error || "Action failed.");
        return;
      }

      // Refresh list after successful action
      await reload();
    },
    [token, reload]
  );

  // Handle menu action selection (with confirmation if needed)
  const onMenuAction = useCallback(
    async (actionKey, item) => {
      const name = item?.name || "Item";

      // Restore action requires confirmation
      if (actionKey === "restore") {
        setConfirm({
          visible: true,
          actionKey,
          item,
          title: "Restore item?",
          message: `Restore “${name}” from Trash back to your Drive?`,
          confirmText: "Restore",
          danger: false,
        });
        return;
      }

      // Permanent delete requires confirmation
      if (actionKey === "delete_forever") {
        setConfirm({
          visible: true,
          actionKey,
          item,
          title: "Delete forever?",
          message: `“${name}” will be permanently deleted. This action cannot be undone.`,
          confirmText: "Delete Forever",
          danger: true,
        });
        return;
      }

      // Other actions run immediately
      await runMenuAction(actionKey, item);
    },
    [runMenuAction]
  );

  return (
    <View style={styles.container}>
      {/* Error message */}
      <InlineError message={error} />

      {/* Confirmation dialog for restore / delete forever */}
      <ConfirmDialog
        visible={confirm.visible}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        danger={confirm.danger}
        onCancel={closeConfirm}
        onConfirm={async () => {
          const actionKey = confirm.actionKey;
          const item = confirm.item;

          closeConfirm();
          if (!actionKey || !item) return;

          await runMenuAction(actionKey, item);
        }}
      />

      {/* Header with sort and view toggle */}
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
          <Text style={styles.muted}>
            Please log in to view your trashed files.
          </Text>
          <Pressable onPress={() => router.push("/login")} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>Go to Login</Text>
          </Pressable>
        </View>
      )}

      {/* Empty trash state */}
      {!loading && token && items.length === 0 && (
        <View style={styles.state}>
          <Text style={styles.muted}>Trash is empty</Text>
        </View>
      )}

      {/* Trash items list */}
      {!loading && token && items.length > 0 && (
        <FileList
          items={sortedItems}
          view={view}
          onItemPress={() => {}}
          showStar={false}
          menuEnabled={true}
          getActions={getActions}
          onMenuAction={onMenuAction}
        />
      )}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.pageBg },
    state: { paddingVertical: 16, paddingHorizontal: 14 },
    muted: { color: c.muted, fontSize: 14 },
    loginBtn: {
      alignSelf: "flex-start",
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.primary,
    },
    loginBtnText: { color: c.onPrimary, fontWeight: "700" },
  });
}
