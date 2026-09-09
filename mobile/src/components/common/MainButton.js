import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useMemo } from "react";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

export default function MainButton({ title, onPress, disabled = false, loading = false }) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    button: {
      marginTop: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonPressed: { opacity: 0.92 },
    buttonDisabled: { opacity: 0.55 },
    buttonText: { color: c.onPrimary, fontSize: 16, fontWeight: "600" },
  });
}
