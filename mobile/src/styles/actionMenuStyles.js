import { StyleSheet } from "react-native";

/**
 * IMPORTANT:
 * We export a factory so styles can react to theme colors (dark/light).
 */
export function makeActionMenuStyles(c) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
      position: "relative",
    },

    backdropPress: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },

    menu: {
      width: "100%",
      maxWidth: 380,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      paddingVertical: 10,
      paddingHorizontal: 10,
    },

    title: {
      fontSize: 14,
      fontWeight: "800",
      color: c.text,
      paddingHorizontal: 6,
      paddingBottom: 8,
    },

    divider: {
      height: 1,
      backgroundColor: c.borderSoft,
      marginBottom: 6,
      opacity: 0.9,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
    },

    icon: {
      color: c.icon,
    },

    rowText: {
      fontSize: 14,
      color: c.text,
      fontWeight: "600",
    },

    danger: {
      color: c.danger,
    },
  });
}