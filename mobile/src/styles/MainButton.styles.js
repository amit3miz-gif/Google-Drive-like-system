import { StyleSheet } from "react-native";

const fallbackTheme = {
  spacing: { sm: 8 },
  radius: { sm: 8 },
  colors: {
    primary: "#1a73e8",
    onPrimary: "#fff",
  },
};

export default StyleSheet.create({
  button: {
    marginTop: fallbackTheme.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: fallbackTheme.radius.sm,
    backgroundColor: fallbackTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: fallbackTheme.colors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
