import { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { getTheme, getThemeColors } from "../../styles/Theme";

const MENU_WIDTH = 280;
const EDGE_MARGIN = 12;

export default function AccountMenuPopover({
  open = false,
  anchorRect = null,
  user = null,
  avatarUri = null,
  onClose,
  onLogout,
}) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const t = useMemo(() => getTheme(theme), [theme]);
  const styles = useMemo(() => makeStyles(c, t), [c, t]);

  const pos = useMemo(() => {
    const rect =
      anchorRect || {
        x: screenW - EDGE_MARGIN - 44,
        y: 44,
        width: 44,
        height: 44,
      };

    const top = Math.min(
      screenH - EDGE_MARGIN - 220,
      rect.y + rect.height + 8
    );

    const idealLeft = rect.x + rect.width - MENU_WIDTH;
    const left = Math.max(
      EDGE_MARGIN,
      Math.min(idealLeft, screenW - EDGE_MARGIN - MENU_WIDTH)
    );

    return { top, left };
  }, [anchorRect, screenW, screenH]);

  const displayName = String(user?.name || "").trim();
  const displayEmail = String(user?.username || "").trim();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.menu, { top: pos.top, left: pos.left }]}
          onPress={() => {}}
        >
          <View style={styles.header}>
            <View style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <MaterialCommunityIcons
                  name="account-circle"
                  size={56}
                  color={c.muted}
                />
              )}
            </View>

            <View style={styles.headerText}>
              {!!displayName && (
                <Text numberOfLines={1} style={styles.name}>
                  {displayName}
                </Text>
              )}
              {!!displayEmail && (
                <Text numberOfLines={1} style={styles.email}>
                  {displayEmail}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && styles.pressed,
            ]}
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel="Logout"
          >
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={c.text}
            />
            <Text style={styles.actionText}>Logout</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(c, t) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.overlay,
    },

    menu: {
      position: "absolute",
      width: MENU_WIDTH,
      backgroundColor: c.surface,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: c.borderSoft,
      ...t.shadow.card,
      overflow: "hidden",
    },

    header: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    avatarWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surface2,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },

    avatarImg: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },

    headerText: {
      flex: 1,
      minWidth: 0,
    },

    name: {
      fontSize: 16,
      fontWeight: "800",
      color: c.text,
    },

    email: {
      marginTop: 2,
      fontSize: 13,
      color: c.muted,
    },

    divider: {
      height: 1,
      backgroundColor: c.borderSoft,
    },

    actionBtn: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    actionText: {
      fontSize: 14,
      fontWeight: "700",
      color: c.text,
    },

    pressed: {
      opacity: 0.85,
    },
  });
}
