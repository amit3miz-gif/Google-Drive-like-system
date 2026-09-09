// src/styles/details.styles.js
import { StyleSheet } from "react-native";

// Default palette
const defaultColors = {
  pageBg: "#f6f7f8",
  surface: "#ffffff",
  borderSoft: "rgba(0,0,0,0.10)",
  text: "#202124",
  textMuted: "#5f6368",
  muted: "#5f6368",
  cardMuted: "rgba(0,0,0,0.08)",
  overlay: "rgba(0,0,0,0.35)",
};

export function makeDetailsStyles(c = defaultColors) {
  const muted = c.muted || c.textMuted || "#5f6368";
  const cardMuted = c.cardMuted || c.surface2 || "rgba(0,0,0,0.08)";

  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.pageBg },

    container: { padding: 14, paddingBottom: 24 },

    center: { flex: 1, alignItems: "center", justifyContent: "center" },

    panel: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.borderSoft,
      overflow: "hidden",
    },

    row: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: c.borderSoft,
    },

    label: { fontSize: 12.5, color: muted, marginBottom: 6 },

    value: { fontSize: 14, fontWeight: "600", color: c.text },

    avatarsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 2 },

    avatarWrap: {
      width: 36,
      height: 36,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: cardMuted,
    },

    avatarImg: { width: "100%", height: "100%" },
  });
}

export function makeAccessSheetStyles(c = defaultColors) {
  const muted = c.muted || c.textMuted || "#5f6368";
  const cardMuted = c.cardMuted || c.surface2 || "rgba(0,0,0,0.08)";

  return StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },

    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },

    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderColor: c.borderSoft,
    },

    sheetHeader: { paddingBottom: 10 },
    sheetTitle: { fontSize: 15, fontWeight: "700", color: c.text },

    list: { gap: 10 },
    muted: { color: muted },

    userRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },

    avatarWrap: {
      width: 36,
      height: 36,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: cardMuted,
    },

    avatarImg: { width: "100%", height: "100%" },

    userText: { flex: 1, minWidth: 0 },
    userName: { fontSize: 14, fontWeight: "700", color: c.text },
    userSub: { marginTop: 2, fontSize: 12.5, color: muted },

    role: { fontSize: 12.5, color: muted, fontWeight: "700" },
  });
}

// Backwards-compatible exports
export const detailsStyles = makeDetailsStyles(defaultColors);
export const accessSheetStyles = makeAccessSheetStyles(defaultColors);
