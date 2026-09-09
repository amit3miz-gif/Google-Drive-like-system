import { useEffect, useLayoutEffect, useMemo, useState, useCallback, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useLocalSearchParams, useNavigation, router, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../../../src/hooks/useAuth";
import { useTheme } from "../../../src/hooks/useTheme";
import { getThemeColors } from "../../../src/styles/Theme";
import { fileService } from "../../../src/services/fileService";
import FileList from "../../../src/components/files/FileList";
import Spinner from "../../../src/components/common/Spinner";
import InlineError from "../../../src/components/common/InlineError";

import { getFullMenuActions } from "../../../src/components/menu/menuProfiles";
import { handleFileMenuAction } from "../../../src/services/fileMenuActions";

import NewMenuSheet from "../../../src/components/new/NewMenuSheet";
import RenameDialog from "../../../src/components/dialog/RenameDialog";

export default function FolderScreen() {
  const { id } = useLocalSearchParams();
  const folderId = String(id || "");

  const { token, loading: authLoading } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const [folder, setFolder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI controls
  const [view, setView] = useState("list"); // "list" | "grid"
  const [nameSortDir, setNameSortDir] = useState("asc"); // "asc" | "desc"

  // Rename dialog
  const [rename, setRename] = useState({ visible: false, item: null });

  // New menu
  const [newOpen, setNewOpen] = useState(false);

  // FAB hide-on-scroll
  const fabY = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(1)).current;
  const lastYRef = useRef(0);
  const fabHiddenRef = useRef(false);

  const hideFab = useCallback(() => {
    if (fabHiddenRef.current) return;
    fabHiddenRef.current = true;

    Animated.parallel([
      Animated.timing(fabY, { toValue: 80, duration: 160, useNativeDriver: true }),
      Animated.timing(fabOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [fabY, fabOpacity]);

  const showFab = useCallback(() => {
    if (!fabHiddenRef.current) return;
    fabHiddenRef.current = false;

    Animated.parallel([
      Animated.timing(fabY, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(fabOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [fabY, fabOpacity]);

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

  const reload = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setError("");

    if (!folderId) {
      setLoading(false);
      setError("Missing folder id");
      return;
    }

    if (!token) {
      setLoading(false);
      setError("Please log in to open folders.");
      return;
    }

    try {
      const [folderData, list] = await Promise.all([
        fileService.getById(folderId, token),
        fileService.listFilesInFolder(folderId, token),
      ]);

      setFolder(folderData || null);
      setItems(Array.isArray(list) ? list : []);
      if (!folderData) setError("Folder not found");
    } catch (e) {
      setError(e?.message || "Failed to load folder");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [folderId, token, authLoading]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: folder?.name ? String(folder.name) : "Folder",
    });
  }, [navigation, folder?.name]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Refresh when returning to this screen (e.g., after editing / details / move)
  useFocusEffect(
    useCallback(() => {
      if (!token || authLoading) return;
      reload();
    }, [reload, token, authLoading])
  );

  const getActions = useCallback(
    (item) => getFullMenuActions({ isStarred: !!item?.starred }),
    []
  );

  const onMenuAction = useCallback(
    async (actionKey, item) => {
      setError("");

      if (actionKey === "rename") {
        setRename({ visible: true, item });
        return;
      }

      const res = await handleFileMenuAction({
        actionKey,
        item,
        screen: "folder",
        token,
      });

      if (res?.ok === false) {
        setError(res.error || "Action failed.");
        return;
      }

      // Avoid reload spam on pure navigation actions
      if (actionKey === "details" || actionKey === "move") return;

      await reload();
    },
    [token, reload]
  );

  const toggleIcon = view === "list" ? "view-grid-outline" : "view-list-outline";

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

  const sortArrowIcon = nameSortDir === "asc" ? "arrow-up" : "arrow-down";

  function handleItemPress(item) {
    if (!item?.id) return;

    if (item.type === "folder") {
      router.push(`/(stack)/folder/${item.id}`);
    } else {
      router.push(`/(stack)/file/${item.id}`);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Spinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <InlineError message={error} />
        {!token && (
          <Pressable onPress={() => router.push("/login")} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>Go to Login</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <InlineError message={error} />

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
            screen: "folder",
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

      {sortedItems.length > 0 && (
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <Text style={styles.title}>Name</Text>

            <Pressable
              onPress={() => setNameSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              style={({ pressed }) => [styles.sortCircleBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Toggle name sort direction"
              hitSlop={8}
            >
              <MaterialCommunityIcons name={sortArrowIcon} size={16} color={c.icon} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => setView((prev) => (prev === "list" ? "grid" : "list"))}
            style={styles.toggleBtn}
            accessibilityRole="button"
            accessibilityLabel="Toggle view"
          >
            <MaterialCommunityIcons name={toggleIcon} size={22} color={c.icon} />
          </Pressable>
        </View>
      )}

      {sortedItems.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.muted}>This folder is empty</Text>
        </View>
      ) : (
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
        />
      )}

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

      <NewMenuSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        mode="full"
        parentId={folderId}
        token={token}
        existingItems={items}
        onDone={reload}
      />
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.pageBg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    height: 46,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leftHeader: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 15, fontWeight: "600", color: c.text },

  sortCircleBtn: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.borderSoft,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: { opacity: 0.85 },

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
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  fabPressed: { opacity: 0.9 },
});
}
