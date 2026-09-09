import { useMemo, useRef, useState, useCallback } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";
import AccountMenuPopover from "./AccountMenuPopover";

const EXTRA_TOP_PADDING = 6;

export default function TopBar({
  value = "",
  onSearchPress,
  onMenuPress,
  onAvatarPress,
}) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);

  const [accountOpen, setAccountOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const avatarWrapRef = useRef(null);

  const styles = useMemo(() => makeStyles(c), [c]);
  const insets = useSafeAreaInsets();

  const avatarUri = useMemo(() => {
    const data = user?.pictureData;
    const ct = user?.pictureContentType;
    if (!data || !ct) return null;
    return `data:${ct};base64,${data}`;
  }, [user?.pictureData, user?.pictureContentType]);

  const openAccountMenu = useCallback(() => {
    onAvatarPress?.();

    const node = avatarWrapRef.current;

    if (node && typeof node.measureInWindow === "function") {
      node.measureInWindow((x, y, width, height) => {
        setAnchorRect({ x, y, width, height });
        setAccountOpen(true);
      });
      return;
    }

    setAnchorRect(null);
    setAccountOpen(true);
  }, [onAvatarPress]);

  const doLogout = useCallback(async () => {
    setAccountOpen(false);
    try {
      await logout("LOGGED_OUT");
    } finally {
      router.replace("/login");
    }
  }, [logout]);

  const label = useMemo(() => {
    const t = String(value || "").trim();
    return t ? t : "Search in Drive";
  }, [value]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + EXTRA_TOP_PADDING }]}>
      {/* Left: Side menu */}
      <View style={styles.left}>
        <Pressable style={styles.iconBtn} onPress={() => onMenuPress?.()}>
          <MaterialCommunityIcons name="menu" size={24} color={c.icon} />
        </Pressable>
      </View>

      {/* Center: Search */}
      <View style={styles.center}>
        <Pressable
          onPress={() => onSearchPress?.()}
          style={({ pressed }) => [styles.searchBox, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open search"
        >
          <MaterialCommunityIcons name="magnify" size={18} color={c.icon} />
          <Text style={styles.searchText} numberOfLines={1}>
            {label}
          </Text>
        </Pressable>
      </View>

      {/* Right: Avatar */}
      <View ref={avatarWrapRef} collapsible={false}>
        <Pressable style={styles.avatarBtn} onPress={openAccountMenu}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={34} color={c.icon} />
          )}
        </Pressable>
      </View>

      <AccountMenuPopover
        open={accountOpen}
        anchorRect={anchorRect}
        user={user}
        avatarUri={avatarUri}
        onClose={() => setAccountOpen(false)}
        onLogout={doLogout}
      />
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: {
      minHeight: 56,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingBottom: 6,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSoft,
    },
    left: { width: 52, alignItems: "flex-start" },
    center: { flex: 1 },
    iconBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 10,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.searchBg,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },
    searchText: {
      flex: 1,
      color: c.muted,
      fontSize: 14,
    },
    avatarBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
    },
    avatarImg: { width: 34, height: 34, borderRadius: 17 },
    pressed: { opacity: 0.85 },
  });
}
