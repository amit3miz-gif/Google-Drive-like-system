import { StyleSheet } from "react-native";

const fallbackTheme = {
  spacing: { sm: 8 },
  radius: { sm: 8 },
  font: { md: 16 },
  colors: {
    text: "#111",
    border: "#ccc",
    surface: "#fff",
  },
};

export default StyleSheet.create({
  wrap: {
    marginBottom: fallbackTheme.spacing.sm,
  },
  label: {
    fontSize: 14,
    color: fallbackTheme.colors.text,
    marginBottom: 6,
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: fallbackTheme.radius.sm,
    borderWidth: 1,
    borderColor: fallbackTheme.colors.border,
    fontSize: fallbackTheme.font.md,
    backgroundColor: fallbackTheme.colors.surface,
    color: fallbackTheme.colors.text,
  },
});
