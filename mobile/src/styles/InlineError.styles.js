import { StyleSheet } from "react-native";

const fallbackTheme = {
  spacing: { sm: 8 },
  radius: { md: 12 },
  colors: {
    dangerBorder: "#f5c2c7",
    dangerBg: "#f8d7da",
    danger: "#842029",
  },
};

export default StyleSheet.create({
  box: {
    marginTop: fallbackTheme.spacing.sm,
    marginBottom: fallbackTheme.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: fallbackTheme.radius.md,
    borderWidth: 1,
    borderColor: fallbackTheme.colors.dangerBorder,
    backgroundColor: fallbackTheme.colors.dangerBg,
  },
  text: {
    color: fallbackTheme.colors.danger,
    fontSize: 14,
    lineHeight: 18,
  },
});
