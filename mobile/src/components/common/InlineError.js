import { Text, View, StyleSheet } from "react-native";
import { useMemo } from "react";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

export default function InlineError({ message }) {
  if (!message) return null;

  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    box: {
      marginTop: 10,
      marginBottom: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.dangerBorder,
      backgroundColor: c.dangerBg,
    },
    text: {
      color: c.danger,
      fontSize: 14,
    },
  });
}
