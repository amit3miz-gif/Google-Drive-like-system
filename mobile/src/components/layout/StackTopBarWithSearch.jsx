import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, I18nManager } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

const EXTRA_TOP_PADDING = 2;
const BASE_HEIGHT = 56;

/**
 * A compact Stack header:
 * - Left: Close (X)
 * - Center: Title
 * - Right: Search icon (opens Search screen)
 */
export default function StackTopBarWithSearch({
  title = "",
  initialQuery = "",
  onSearchPress,
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  // If we can go back, go back ,otherwise, ensure we land on a safe screen (tabs home)
  const handleClose = () => {
    const canGoBack =
      typeof router.canGoBack === "function" ? router.canGoBack() : false;

    if (canGoBack) router.back();
    else router.replace("/(tabs)/drive/index");
  };

  // Open Search as a modal-like screen, or use custom handler if provided.
  const handleSearch = () => {
    if (typeof onSearchPress === "function") {
      onSearchPress();
      return;
    }

    router.push({
      pathname: "/(stack)/search",
      params: { q: initialQuery || "" },
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + EXTRA_TOP_PADDING,
          minHeight: BASE_HEIGHT + insets.top + EXTRA_TOP_PADDING,
        },
      ]}
    >
      {/* Left: Close */}
      <Pressable
        style={styles.iconBtn}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={10}
      >
        <MaterialCommunityIcons name="close" size={24} color={c.icon} />
      </Pressable>

      {/* Center: Title */}
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      {/* Right: Search */}
      <Pressable
        style={styles.iconBtn}
        onPress={handleSearch}
        accessibilityRole="button"
        accessibilityLabel="Search"
        hitSlop={10}
      >
        <MaterialCommunityIcons name="magnify" size={24} color={c.icon} />
      </Pressable>
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
    iconBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      color: c.text,
      textAlign: "center",
      writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
    },
  });
}
