import { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

export default function RenameDialog({
  visible,
  title = "Rename",
  initialValue = "",
  confirmText = "Rename",
  cancelText = "Cancel",
  onCancel,
  onConfirm,
}) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue || "");
  }, [visible, initialValue]);

  if (!visible) return null;

  const trimmed = value.trim();
  const disabled = trimmed.length === 0;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            autoFocus
            placeholder="Enter new name"
            placeholderTextColor={c.muted}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (!disabled) onConfirm?.(trimmed);
            }}
          />

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
              <Text style={styles.btnText}>{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={() => onConfirm?.(trimmed)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.btn,
                styles.confirmBtn,
                disabled && styles.disabledBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.btnText, styles.confirmText, disabled && styles.disabledText]}>
                {confirmText}
              </Text>
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
    title: { fontSize: 16, fontWeight: "800", color: c.text, marginBottom: 10 },
    input: {
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: c.text,
      marginBottom: 14,
      backgroundColor: c.surface2,
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
    disabledBtn: { opacity: 0.6 },
    btnText: { fontWeight: "800", color: c.text },
    confirmText: { color: c.onPrimary },
    disabledText: { color: "rgba(255,255,255,0.85)" },
    pressed: { opacity: 0.85 },
  });
}
