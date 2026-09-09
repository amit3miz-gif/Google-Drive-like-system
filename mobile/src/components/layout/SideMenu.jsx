import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Modal, Pressable, View, Text, Animated, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

const PANEL_WIDTH = 280;

export default function SideMenu({ open, onClose, onGoRecent, onGoTrash }) {
  const { theme, toggleTheme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);

  const x = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      // mount before animating in
      setMounted(true);

      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      // animate out, then unmount
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.timing(x, { toValue: -PANEL_WIDTH, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [open, mounted, x, backdrop]);

  const onToggleTheme = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      {/* Wrapper (no background here) */}
      <View style={{ flex: 1 }}>
        {/* Backdrop (click outside closes) */}
        <Animated.View pointerEvents="none" style={[styles.backdrop, { opacity: backdrop }]} />
        <Pressable onPress={onClose} style={[StyleSheet.absoluteFillObject, { left: PANEL_WIDTH }]} />

        {/* Slide-in panel (NOT inside Pressable) */}
        <Animated.View
          style={[
            styles.panel,
            {
              width: PANEL_WIDTH,
              paddingTop: 18 + insets.top,
              transform: [{ translateX: x }],
            },
          ]}
        >
          <Text style={styles.title}>Drive</Text>

          <MenuItem c={c} icon="clock-outline" label="Recent" onPress={onGoRecent} />
          <MenuItem c={c} icon="trash-can-outline" label="Trash" onPress={onGoTrash} />

          <View style={styles.divider} />

          <MenuItem
            c={c}
            icon={theme === "dark" ? "weather-night" : "white-balance-sunny"}
            label={theme === "dark" ? "Dark mode: On" : "Dark mode: Off"}
            onPress={onToggleTheme}
          />

          <View style={{ height: 14 }} />

          <MenuItem
            c={c}
            icon="cloud-upload-outline"
            label="Uploads"
            onPress={() => {
              onClose?.();
              router.push("/(stack)/uploads");
            }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function MenuItem({ c, icon, label, onPress, disabled = false }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: pressed ? c.surfaceHover : "transparent",
        opacity: disabled ? 0.45 : 1,
      })}
    >
      <MaterialCommunityIcons name={icon} size={22} color={c.icon} />
      <Text style={{ fontSize: 15, color: c.text }}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },
    panel: {
      height: "100%",
      backgroundColor: c.surface,
      paddingTop: 18,
      paddingHorizontal: 14,
      borderRightWidth: 1,
      borderRightColor: c.borderSoft,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 12,
      color: c.text,
    },
    divider: {
      height: 1,
      backgroundColor: c.borderSoft,
      marginVertical: 10,
      opacity: 0.9,
    },
  });
}
