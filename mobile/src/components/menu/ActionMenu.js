import { Modal, Text, Pressable, View, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useMemo } from "react";

import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";
import { makeActionMenuStyles } from "../../styles/actionMenuStyles";

// 3 Dot Action Menu component
export default function ActionMenu({ visible, onClose, title, actions, onAction }) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeActionMenuStyles(c), [c]);

  if (!visible) return null;

  const handlePress = async (key) => {
    try {
      if (key === "rename" || key === "restore" || key === "delete_forever") {
        // Close the menu first so the rename modal can open reliably.
        onClose?.();
        setTimeout(() => onAction?.(key), 0);
        return;
      }

      const res = await onAction?.(key);
      if (res && res.ok === false) {
        Alert.alert("Error", res.error || "Action failed");
        return;
      }
      onClose?.();
    } catch (e) {
      Alert.alert("Error", e?.message || "Action failed");
    }
  };


  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />

        <View style={styles.menu}>
          <Text style={styles.title} numberOfLines={1}>
            {title ?? "Item"}
          </Text>

          <View style={styles.divider} />

          {(actions || []).map((a) => {
            const isDanger = a.variant === "danger";
            return (
              <Pressable
                key={a.key}
                style={styles.row}
                onPress={() => handlePress(a.key)}
              >
                <MaterialIcons
                  name={a.icon}
                  size={22}
                  style={[styles.icon, isDanger && styles.danger]}
                />
                <Text style={[styles.rowText, isDanger && styles.danger]}>
                  {a.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
