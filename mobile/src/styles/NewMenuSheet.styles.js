import { StyleSheet } from "react-native";

export default StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },

  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#202124" },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginVertical: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  rowText: { fontSize: 15, color: "#202124", fontWeight: "500" },

  pressedRow: { opacity: 0.75 },
  disabledRow: { opacity: 0.6 },

  pressed: { opacity: 0.85 },

  dialog: {
    alignSelf: "center",
    width: "92%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    marginBottom: 120,
  },

  dialogTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#202124",
    marginBottom: 10,
  },

  dialogInput: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#202124",
    backgroundColor: "#fff",
  },

  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },

  dialogBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "#fff",
  },
  dialogBtnText: { color: "#202124", fontWeight: "700" },

  dialogBtnPrimary: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1a73e8",
  },
  dialogBtnPrimaryText: { color: "#fff", fontWeight: "800" },
  disabledPrimary: { opacity: 0.5 },
});
