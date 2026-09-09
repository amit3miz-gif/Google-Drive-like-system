import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, BackHandler } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../../src/hooks/useAuth";
import { useTheme } from "../../src/hooks/useTheme";
import { getThemeColors } from "../../src/styles/Theme";
import { fileService } from "../../src/services/fileService";

import FileList from "../../src/components/files/FileList";
import Spinner from "../../src/components/common/Spinner";
import InlineError from "../../src/components/common/InlineError";

// Debounce any changing value (search query)
function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export default function SearchScreen() {
  const { token, loading: authLoading } = useAuth();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const initial = String(params?.q || "").trim();
    if (initial) setQuery(initial);
  }, [params?.q]);

  const debouncedQuery = useDebouncedValue(query, 300);
  const trimmed = useMemo(() => String(debouncedQuery || "").trim(), [debouncedQuery]);

  const goBack = useCallback(() => {
    router.back();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        goBack();
        return true;
      };

      const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
      return () => sub.remove();
    }, [goBack])
  );

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setItems([]);
      setLoading(false);
      setError("");
      return;
    }

    if (!trimmed) {
      setItems([]);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fileService
      .search(trimmed, token)
      .then((res) => {
        if (cancelled) return;
        setItems(Array.isArray(res) ? res : []);
      })
      .catch((e) => {
        if (cancelled) return;
        setItems([]);
        setError(e?.message || "Search failed");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trimmed, token, authLoading]);

  const handleItemPress = useCallback((item) => {
    if (!item?.id) return;

    if (item.type === "folder") router.push(`/(stack)/folder/${item.id}`);
    else router.push(`/(stack)/file/${item.id}`);
  }, []);

  const canSearch = !!token && !authLoading;
  const showClear = query.trim().length > 0;

  const handleClear = useCallback(() => {
    setQuery("");
    setItems([]);
    setError("");
    setLoading(false);
  }, []);

  const searchTopPad = insets.top;

  return (
    <View style={styles.container}>
      <View style={[styles.searchRow, { paddingTop: 2 + searchTopPad }]}>
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={c.icon} />
        </Pressable>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color={c.icon} />

          <TextInput
            autoFocus
            value={query}
            onChangeText={(v) => {
              setQuery(v);
              setError("");
            }}
            placeholder="Search in Drive"
            placeholderTextColor={c.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            editable={canSearch}
            style={styles.searchInput}
            underlineColorAndroid="transparent"
            selectionColor={c.primary}
          />

          {showClear && (
            <Pressable
              onPress={handleClear}
              style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={10}
            >
              <MaterialCommunityIcons name="close" size={18} color={c.icon} />
            </Pressable>
          )}
        </View>
      </View>

      {!token && !authLoading && (
        <View style={styles.state}>
          <Text style={styles.muted}>Please log in to search.</Text>
        </View>
      )}

      {authLoading && (
        <View style={styles.state}>
          <Spinner />
        </View>
      )}

      {!!error && !authLoading && (
        <View style={styles.state}>
          <InlineError message={error} />
        </View>
      )}

      {canSearch && !authLoading && !error && query.trim().length === 0 && (
        <View style={styles.state}>
          <Text style={styles.muted}>Type to search files and folders</Text>
        </View>
      )}

      {canSearch && !authLoading && !error && query.trim().length > 0 && loading && (
        <View style={styles.state}>
          <Spinner />
        </View>
      )}

      {canSearch &&
        !authLoading &&
        !error &&
        query.trim().length > 0 &&
        !loading &&
        items.length === 0 && (
          <View style={styles.state}>
            <Text style={styles.muted}>No results</Text>
          </View>
        )}

      {canSearch && !authLoading && !error && items.length > 0 && (
        <FileList
          items={items}
          view="list"
          onItemPress={handleItemPress}
          showStar={true}
          menuEnabled={false}
          listProps={{ keyboardShouldPersistTaps: "handled" }}
        />
      )}
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.pageBg },

    searchRow: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },

    searchBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: c.searchBg,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },

    searchInput: {
      flex: 1,
      padding: 0,
      fontSize: 14,
      color: c.text,
      outlineStyle: "none", // RN-web
      borderWidth: 0,
    },

    clearBtn: {
      width: 28,
      height: 28,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },

    pressed: { opacity: 0.85 },

    state: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    muted: { color: c.muted, fontSize: 14 },
  });
}
