import { StyleSheet } from "react-native";

export const topBarStyles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 6,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e6e6e6",
  },

  left: {
    width: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  center: {
    flex: 1,
    paddingHorizontal: 8,
  },

  searchBox: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f1f3f4",
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#202124",
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  iconBtn: {
    padding: 8,
    borderRadius: 10,
  },

  avatarBtn: {
    padding: 2,
  },

  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dadce0",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarLetter: {
    fontWeight: "700",
    color: "#202124",
  },
});
