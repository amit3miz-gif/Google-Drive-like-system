import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../src/hooks/useAuth";
import { useTheme } from "../../src/hooks/useTheme";
import { getThemeColors } from "../../src/styles/Theme";
import { fileService } from "../../src/services/fileService";
import InlineError from "../../src/components/common/InlineError";

export default function MoveScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const insets = useSafeAreaInsets();

  const { token, loading: authLoading } = useAuth();
  const params = useLocalSearchParams();

  const itemId = params?.itemId ? String(params.itemId) : "";
  const itemName = params?.itemName ? String(params.itemName) : "Item";
  const itemType = params?.itemType ? String(params.itemType) : "file";

  const sourceParentId =
    params?.sourceParentId === undefined || params?.sourceParentId === null
      ? null
      : String(params.sourceParentId || "").trim() === ""
      ? null
      : String(params.sourceParentId);

  const [navStack, setNavStack] = useState([]); // [{ id, name }]
  const currentFolderId = navStack.length
    ? String(navStack[navStack.length - 1].id)
    : null;

  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState("");

// Descendant guard (folder -> cannot move into its own subtree)
  const [destPathIds, setDestPathIds] = useState([]); // ancestor ids for currentFolderId
  const [pathLoading, setPathLoading] = useState(false);

  const destinationLabel = useMemo(() => {
    if (!currentFolderId) return "My Drive";
    const last = navStack[navStack.length - 1];
    return last?.name ? String(last.name) : "Folder";
  }, [currentFolderId, navStack]);

  const isDestinationInsideItem = useMemo(() => {
    if (itemType !== "folder") return false;
    if (!currentFolderId) return false;
    if (!itemId) return false;

    // If destination folder's ancestors include itemId => destination is inside item's subtree
    return destPathIds.some((x) => String(x) === String(itemId));
  }, [itemType, currentFolderId, itemId, destPathIds]);

  const canMoveHere = useMemo(() => {
    if (!itemId) return false;

     // Disallow moving into the same folder
    const sameAsSource =
      (sourceParentId === null && currentFolderId === null) ||
      (sourceParentId !== null &&
        currentFolderId !== null &&
        String(sourceParentId) === String(currentFolderId));

    if (sameAsSource) return false;

    // Minimal guard: a folder cannot be moved into itself
    if (
      itemType === "folder" &&
      currentFolderId &&
      String(currentFolderId) === String(itemId)
    ) {
      return false;
    }

    // Strong guard: cannot move folder into its own subtree
    if (isDestinationInsideItem) return false;

    return true;
  }, [itemId, itemType, currentFolderId, sourceParentId, isDestinationInsideItem]);

  const refetchFolders = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setError("");

    if (!token) {
      setFolders([]);
      setLoading(false);
      setError("Please log in to move items.");
      return;
    }

    try {
      const list = currentFolderId
        ? await fileService.listFilesInFolder(currentFolderId, token)
        : await fileService.listRootFiles(token);

      const arr = Array.isArray(list) ? list : [];
      const onlyFolders = arr.filter((it) => it?.type === "folder");

      
      // If moving a folder, do not show the folder itself as a destination option
      const filtered =
        itemType === "folder"
          ? onlyFolders.filter((f) => String(f?.id) !== String(itemId))
          : onlyFolders;

      setFolders(filtered);
    } catch (e) {
      setFolders([]);
      setError(e?.message || "Failed to load folders");
    } finally {
      setLoading(false);
    }
  }, [authLoading, token, currentFolderId, itemId, itemType]);

  const refetchDestinationPath = useCallback(async () => {
    if (authLoading) return;

    
    // Only needed for folder moves, and only when inside a destination folder
    if (itemType !== "folder") {
      setDestPathIds([]);
      return;
    }

    if (!token || !currentFolderId) {
      setDestPathIds([]);
      return;
    }

    setPathLoading(true);
    try {
      const res = await fileService.getPath(currentFolderId, token);

      // Be defensive about API shape:
      // - could be [{id,name}, ...]
      // - could be { path: [{id,name}, ...] }
      const pathArr = Array.isArray(res)
        ? res
        : Array.isArray(res?.path)
        ? res.path
        : Array.isArray(res?.breadcrumbs)
        ? res.breadcrumbs
        : [];

      const ids = (pathArr || [])
        .map((c) => c?.id)
        .filter(Boolean)
        .map((x) => String(x));

      setDestPathIds(ids);
    } catch {
      // If path fetch fails, do NOT block move (avoid false negatives).
      // We'll just disable the subtree protection for this destination.
      setDestPathIds([]);
    } finally {
      setPathLoading(false);
    }
  }, [authLoading, token, currentFolderId, itemType]);

  useEffect(() => {
    refetchFolders();
  }, [refetchFolders]);

  useEffect(() => {
    refetchDestinationPath();
  }, [refetchDestinationPath]);

  const enterFolder = useCallback((folder) => {
    const id = folder?.id ? String(folder.id) : "";
    if (!id) return;

    setNavStack((prev) => [
      ...prev,
      { id, name: String(folder?.name || "Folder") },
    ]);
  }, []);

  const goUp = useCallback(() => {
    setNavStack((prev) => (prev.length ? prev.slice(0, -1) : prev));
  }, []);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const handleMoveHere = useCallback(async () => {
    if (!token || !itemId) return;
    if (!canMoveHere) return;

    setMoving(true);
    setError("");

    try {
      await fileService.move(itemId, currentFolderId, token);
      router.back();
    } catch (e) {
      setError(e?.message || "Move failed");
    } finally {
      setMoving(false);
    }
  }, [token, itemId, currentFolderId, canMoveHere]);

  
  // Force correct title + make Back behave like "Up" inside folders
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Select destination",
      headerLeft: () => (
        <Pressable
          onPress={() => {
            if (navStack.length > 0) goUp();
            else router.back();
          }}
          style={({ pressed }) => [styles.headerLeftBtn, pressed && styles.pressed]}
          accessibilityLabel={navStack.length > 0 ? "Up" : "Back"}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={c.icon} />
        </Pressable>
      ),
    });
  }, [navigation, navStack.length, goUp, styles, c.icon]);

  const showEmptyInsideFolder = currentFolderId !== null && folders.length === 0;

  const moveDisabledReason = useMemo(() => {
    if (!itemId) return "Missing item";
    if (
      (sourceParentId === null && currentFolderId === null) ||
      (sourceParentId !== null &&
        currentFolderId !== null &&
        String(sourceParentId) === String(currentFolderId))
    ) {
      return "Already in this folder";
    }
    if (itemType === "folder" && currentFolderId && String(currentFolderId) === String(itemId)) {
      return "Cannot move a folder into itself";
    }
    if (itemType === "folder" && isDestinationInsideItem) {
      return "Cannot move a folder into its own subfolder";
    }
    return "";
  }, [itemId, sourceParentId, currentFolderId, itemType, isDestinationInsideItem]);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.caption} numberOfLines={1}>
          Move <Text style={styles.captionBold}>{itemName}</Text>
        </Text>

        <View style={styles.destRow}>
          <MaterialCommunityIcons name="folder-open-outline" size={18} color={c.icon} />
          <Text style={styles.destText} numberOfLines={1}>
            Destination folder: <Text style={styles.destBold}>{destinationLabel}</Text>
          </Text>
        </View>

        {!!moveDisabledReason && (
          <Text style={styles.hint} numberOfLines={2}>
            {moveDisabledReason}
          </Text>
        )}

        {pathLoading && itemType === "folder" && currentFolderId && (
          <Text style={styles.hint} numberOfLines={1}>
            Checking destination…
          </Text>
        )}
      </View>

      {!!error && <InlineError message={error} />}

      {loading ? (
        <View style={styles.state}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : !token ? (
        <View style={styles.state}>
          <Text style={styles.muted}>Please log in to move items.</Text>
        </View>
      ) : showEmptyInsideFolder ? (
        <View style={styles.stateCenter}>
          <Text style={styles.emptyTitle}>This folder is empty</Text>
        </View>
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(it) => String(it?.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 96 + insets.bottom },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => enterFolder(item)}
              style={({ pressed }) => [styles.row, pressed && styles.pressedRow]}
              accessibilityRole="button"
              accessibilityLabel={`Open folder ${String(item?.name || "Folder")}`}
            >
              <MaterialCommunityIcons name="folder-outline" size={22} color={c.icon} />
              <Text style={styles.rowText} numberOfLines={1}>
                {String(item?.name || "Folder")}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={c.icon} />
            </Pressable>
          )}
        />
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handleCancel}
          disabled={moving}
          style={({ pressed }) => [
            styles.footerBtn,
            styles.footerBtnSecondary,
            moving && styles.disabledBtn,
            pressed && styles.pressed,
          ]}
          accessibilityLabel="Cancel"
        >
          <Text style={styles.footerSecondaryText}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleMoveHere}
          disabled={!canMoveHere || moving || pathLoading}
          style={({ pressed }) => [
            styles.footerBtn,
            styles.footerBtnPrimary,
            (!canMoveHere || moving || pathLoading) && styles.disabledBtn,
            pressed && styles.pressed,
          ]}
          accessibilityLabel="Move here"
        >
          <Text style={styles.footerPrimaryText}>
            {moving ? "Moving…" : pathLoading ? "Checking…" : "Move here"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.pageBg },

    headerLeftBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    top: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, gap: 8 },

    caption: { fontSize: 13, color: c.muted },
    captionBold: { fontWeight: "400", color: c.text },

    destRow: { flexDirection: "row", alignItems: "center" },
    destText: {
      marginLeft: 8,
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
      flex: 1,
      minWidth: 0,
    },
    destBold: { fontWeight: "600" },

    hint: { fontSize: 12.5, color: c.muted },

    state: { paddingVertical: 16, paddingHorizontal: 14 },
    muted: { color: c.muted, fontSize: 14 },

    stateCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
    },
    emptyTitle: { fontSize: 20, color: c.muted, fontWeight: "500" },

    listContent: { paddingBottom: 96 },

    row: {
      height: 54,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "transparent",
    },

    rowText: { flex: 1, marginLeft: 12, fontSize: 15, color: c.text },

    separator: {
      height: 1,
      backgroundColor: c.borderSoft,
      marginLeft: 14 + 22 + 12,
    },

    pressedRow: { opacity: 0.85 },

    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: c.borderSoft,
      backgroundColor: c.surface,
    },

    footerBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },

    footerBtnSecondary: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },

    footerSecondaryText: { color: c.text, fontWeight: "700" },

    footerBtnPrimary: { backgroundColor: c.primary },
    footerPrimaryText: { color: c.onPrimary, fontWeight: "800" },

    disabledBtn: { opacity: 0.5 },
    pressed: { opacity: 0.85 },
  });
}
