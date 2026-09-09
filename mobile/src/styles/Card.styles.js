import { StyleSheet } from "react-native";

const fallbackTheme = {
  colors: { surface: "#ffffff" },
  radius: { md: 14 },
  spacing: { md: 16, lg: 24 },
  shadow: {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
};

export default StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 360,
    paddingVertical: fallbackTheme.spacing.lg,
    paddingHorizontal: fallbackTheme.spacing.md,
    borderRadius: fallbackTheme.radius.md,
    backgroundColor: fallbackTheme.colors.surface,
    ...fallbackTheme.shadow.card,
  },
});
