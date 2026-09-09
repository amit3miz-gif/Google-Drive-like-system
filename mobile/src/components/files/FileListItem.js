import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import ActionMenu from "../menu/ActionMenu";

import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("he-IL");
}

export default function FileListItem({
  item,
  view = "list",
  onPress,
  gridItemStyle = null,
  showStar = false,
  isStarred = false,
  menuEnabled = true,
  getActions = null,
  onMenuAction = null,
}) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const isGrid = view === "grid";
  const isFolder = item?.type === "folder";

  const [menuOpen, setMenuOpen] = useState(false);

  const actions = useMemo(() => (getActions ? getActions(item) || [] : []), [getActions, item]);

  const openMenu = () => {
    if (!menuEnabled) return;
    if (!actions.length) return;
    setMenuOpen(true);
  };

  return (
    <>
      <Pressable
        onPress={() => onPress?.(item)}
        style={({ pressed }) => [
          isGrid ? styles.gridCard : styles.listRow,
          isGrid ? gridItemStyle : null,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item?.name ?? "item"}`}
      >
        <MaterialCommunityIcons
          name={isFolder ? "folder-outline" : "file-outline"}
          size={22}
          color={c.icon}
          style={isGrid ? styles.gridIcon : styles.listIcon}
        />

        <View style={styles.textWrap}>
          <Text numberOfLines={isGrid ? 2 : 1} style={styles.name}>
            {item?.name ?? "Untitled"}
          </Text>

          {!isGrid && (
            <Text numberOfLines={1} style={styles.sub}>
              Date modified · {formatDate(item?.lastModified)}
            </Text>
          )}
        </View>

        <View style={styles.rightWrap}>
          {showStar && !isGrid && (
            <MaterialCommunityIcons
              name={isStarred ? "star" : "star-outline"}
              size={18}
              color={isStarred ? c.warning : c.icon}
              style={styles.star}
            />
          )}

          {menuEnabled && actions.length > 0 && (
            <Pressable
              onPress={openMenu}
              hitSlop={10}
              style={styles.moreBtn}
              accessibilityRole="button"
              accessibilityLabel={`Open menu for ${item?.name ?? "item"}`}
            >
              <MaterialCommunityIcons name="dots-horizontal" size={20} color={c.icon} />
            </Pressable>
          )}
        </View>
      </Pressable>

      <ActionMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={item?.name}
        actions={actions}
        onAction={(key) => onMenuAction?.(key, item)}
      />
    </>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    pressed: { opacity: 0.85 },

    textWrap: { flex: 1, minWidth: 0 },
    name: { fontSize: 14, fontWeight: "500", color: c.text },
    sub: { marginTop: 2, fontSize: 12.5, color: c.muted },

    rightWrap: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
    star: { marginRight: 6 },
    moreBtn: { paddingHorizontal: 6, paddingVertical: 6 },

    listRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: c.pageBg,
    },
    listIcon: { marginRight: 10 },

    gridCard: {
      marginTop: 12,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      minHeight: 92,
    },
    gridIcon: { marginBottom: 10 },
  });
}
