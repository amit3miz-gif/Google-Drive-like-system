import { View, Text, TextInput, StyleSheet } from "react-native";
import { useMemo } from "react";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
}) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
      />
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    wrap: { marginBottom: 10 },
    label: { fontSize: 14, color: c.text, marginBottom: 6 },
    input: {
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borderSoft,
      fontSize: 15,
      backgroundColor: c.surface2,
      color: c.text,
    },
  });
}
