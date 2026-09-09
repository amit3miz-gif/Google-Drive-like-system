import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { getThemeColors } from "../styles/Theme";

import { fileService } from "../services/fileService";

import FileList from "../components/files/FileList";
import ListHeader from "../components/files/ListHeader";
import NewMenuSheet from "../components/new/NewMenuSheet";
import InlineError from "../components/common/InlineError";
import RenameDialog from "../components/dialog/RenameDialog";

import { handleFileMenuAction } from "../services/fileMenuActions";
import { getFullMenuActions } from "../components/menu/menuProfiles";

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.pageBg },

    state: { paddingVertical: 16, paddingHorizontal: 14 },
    muted: { color: c.muted, fontSize: 14 },

    loginBtn: {
      marginTop: 12,
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.primary,
    },
    loginBtnText: { color: c.onPrimary, fontWeight: "700" },

    fabWrap: { position: "absolute", right: 16, bottom: 18 },

    fab: {
      width: 56,
      height: 56,
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      alignItems: "center",
      justifyContent: "center",
      // shadow works mainly on iOS; on Android rely on elevation
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },

    fabPressed: { opacity: 0.9 },
  });
}

export default function DrivePage() {
  // Authentication state
  const { token, loading: authLoading } = useAuth();

  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  // View mode and sorting direction
  const [view, setView] = useState("list"); // "list" | "grid"
  const [nameSortDir, setNameSortDir] = useState("asc"); // "asc" | "desc"

  // Drive items data
  const [items, setItems] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rename dialog state
  const [rename, setRename] = useState({ visible: false, item: null });

  // New-item bottom sheet state
  const [newOpen, setNewOpen] = useState(false);

  // Floating Action Button (FAB) animation state
  const fabY = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;
  const lastYRef = useRef(0);
  const fabHiddenRef = useRef(false);

  // Hide FAB when user scrolls down
  const hideFab = useCallback(() => {
    if (fabHiddenRef.current) return;
    fabHiddenRef.current = true;

    Animated.parallel([
      Animated.timing(fabY, { toValue: 80, duration: 160, useNativeDriver: true }),
      Animated.timing(fabOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [fabY, fabOpacity]);

  // Show FAB when user scrolls up
  const showFab = useCallback(() => {
    if (!fabHiddenRef.current) return;
    fabHiddenRef.current = false;

    Animated.parallel([
      Animated.timing(fabY, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(fabOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [fabY, fabOpacity]);

  // Detect scroll direction to hide/show FAB
  const handleScroll = useCallback(
    (e) => {
      const y = e?.nativeEvent?.contentOffset?.y ?? 0;
      const dy = y - lastYRef.current;

      if (dy > 10) hideFab();
      else if (dy < -10) showFab();

      lastYRef.current = y;
    },
    [hideFab, showFab]
  );

  // Fetch root drive items from backend
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
      const data = await fileService.listRootFiles(token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setItems([]);
      setError(e?.message || "Failed to load files.");
    } finally {
      setLoading(false);
    }
  }, [token, authLoading]);

  // Initial load on mount
  useEffect(() => {
    reload();
  }, [reload]);

  // Reload data when screen regains focus
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
      const res = String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
        sensitivity: "base",
      });
      return nameSortDir === "asc" ? res : -res;
    });
    return copy;
  }, [items, nameSortDir]);

  // Navigate to folder or file on item press
  const handleItemPress = useCallback((item) => {
    if (!item?.id) return;

    if (item.type === "folder") {
      router.push(`/(stack)/folder/${item.id}`);
    } else {
      router.push(`/(stack)/file/${item.id}`);
    }
  }, []);

  // Build menu actions per item (folders cannot be downloaded)
  const getActions = useCallback((item) => {
    const actions = getFullMenuActions({ isStarred: !!item?.starred }) || [];

    if (item?.type === "folder") {
      return actions.filter((a) => a.key !== "download");
    }

    return actions;
  }, []);

  // Execute menu actions (rename handled via dialog)
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
        screen: "drive",
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
            screen: "drive",
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
          onToggleSort={() => setNameSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        />
      )}

      {/* Loading state */}
      {loading && (
        <View style={styles.state}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      )}

      {/* Not authenticated state */}
      {!loading && !token && (
        <View style={styles.state}>
          <Text style={styles.muted}>Please log in to view your drive.</Text>
          <Pressable onPress={() => router.push("/login")} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>Go to Login</Text>
          </Pressable>
        </View>
      )}

      {/* Empty drive state */}
      {!loading && token && items.length === 0 && (
        <View style={styles.state}>
          <Text style={styles.muted}>No files or folders</Text>
        </View>
      )}

      {/* Drive items list */}
      {!loading && token && items.length > 0 && (
        <FileList
          items={sortedItems}
          view={view}
          onItemPress={handleItemPress}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showStar={true}
          menuEnabled={true}
          getActions={getActions}
          onMenuAction={onMenuAction}
          listProps={{
            // prevents header overlap
            contentContainerStyle: { paddingTop: 2 },
          }}
        />
      )}

      {/* Floating Action Button (New) */}
      {!!token && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.fabWrap,
            {
              opacity: fabOpacity,
              transform: [{ translateY: fabY }],
            },
          ]}
        >
          <Pressable
            onPress={() => setNewOpen(true)}
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
            accessibilityRole="button"
            accessibilityLabel="New"
          >
            <MaterialCommunityIcons name="plus" size={26} color={c.primary} />
          </Pressable>
        </Animated.View>
      )}

      {/* New item creation sheet */}
      <NewMenuSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        mode="full"
        parentId={null}
        token={token}
        onDone={reload}
      />
    </View>
  );
}