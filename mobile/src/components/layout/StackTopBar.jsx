import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EXTRA_TOP_PADDING = 6;

export default function StackTopBar({ title = "" }) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const insets = useSafeAreaInsets();
  const handleClose = () => {  
    const canGoBack = typeof router.canGoBack === "function" ? router.canGoBack() : false;

    if (canGoBack) router.back();
    else router.replace("/(tabs)/drive/index");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + EXTRA_TOP_PADDING }]}>
      <Pressable style={styles.iconBtn} onPress={handleClose}>
        <MaterialCommunityIcons name="close" size={24} color={c.icon} />
      </Pressable>

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      {/* spacer to keep title centered */}
      <View style={styles.rightSpacer} />
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
      paddingHorizontal: 8,
    },
    rightSpacer: {
      width: 44,
    },
  });
}
