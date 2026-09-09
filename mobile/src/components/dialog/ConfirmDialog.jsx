import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useMemo } from "react";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

export default function ConfirmDialog({
  visible,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
              <Text style={styles.btnText}>{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                styles.confirmBtn,
                danger && styles.dangerBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.btnText, styles.confirmText]}>{confirmText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.overlay,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      borderRadius: 14,
      backgroundColor: c.surface,
      padding: 16,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },
    title: {
      fontSize: 16,
      fontWeight: "800",
      color: c.text,
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      color: c.muted,
      lineHeight: 20,
      marginBottom: 16,
    },
    actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
    btn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.surface2,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },
    confirmBtn: { backgroundColor: c.primary, borderColor: c.primary },
    dangerBtn: { backgroundColor: c.danger, borderColor: c.danger },
    btnText: { fontWeight: "800", color: c.text },
    confirmText: { color: c.onPrimary },
    pressed: { opacity: 0.85 },
  });
}
