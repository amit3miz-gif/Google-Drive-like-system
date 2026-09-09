import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { fileService } from "../../services/fileService";
import InlineError from "../common/InlineError";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

export default function TextFileViewer({ file, token }) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);
  const fileId = String(file?.id || "");
  const fileName = String(file?.name || "Untitled");

  const initialContent = typeof file?.content === "string" ? file.content : "";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [originalText, setOriginalText] = useState(initialContent);
  const [text, setText] = useState(initialContent);

  const isDirty = useMemo(() => text !== originalText, [text, originalText]);
  const isBusy = loading || saving;

  // If screen is opened with "file" already loaded, we still may want
  // to refresh content from API to be safe. Keep minimal: no auto-refresh.
  useEffect(() => {
    setOriginalText(initialContent);
    setText(initialContent);
  }, [fileId, initialContent]); // only when file changes

  async function handleSave() {
    if (!isDirty || isBusy) return;

    setSaving(true);
    setError("");

    try {
      await fileService.update(fileId, { content: text }, token);
      setOriginalText(text);
    } catch (e) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleUndo() {
    if (isBusy || !isDirty) return;
    setText(originalText);
    setError("");
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color={c.icon} />
          <Text numberOfLines={1} style={styles.title}>
            {fileName}
          </Text>
          {isDirty && <Text style={styles.dirty}>● Unsaved</Text>}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleSave}
            disabled={!isDirty || isBusy}
            style={({ pressed }) => [
              styles.iconBtn,
              (!isDirty || isBusy) && styles.disabledBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Save"
          >
            <MaterialCommunityIcons name="content-save-outline" size={20} color={c.icon} />
          </Pressable>

          <Pressable
            onPress={handleUndo}
            disabled={!isDirty || isBusy}
            style={({ pressed }) => [
              styles.iconBtn,
              (!isDirty || isBusy) && styles.disabledBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Undo"
          >
            <MaterialCommunityIcons name="undo" size={20} color={c.icon} />
          </Pressable>
        </View>
      </View>

      {!!error && <InlineError message={error} />}

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Start typing…"
        multiline
        editable={!isBusy}
        style={styles.input}
        placeholderTextColor={c.muted}
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.pageBg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },

  titleWrap: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  title: { marginLeft: 8, fontSize: 15, fontWeight: "600", color: c.text, flex: 1 },
  dirty: { marginLeft: 10, color: c.danger, fontSize: 12, fontWeight: "600" },

  actions: { flexDirection: "row", alignItems: "center", gap: 6 },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.borderSoft,
    backgroundColor: c.surface,
  },
  disabledBtn: { opacity: 0.5 },
  pressed: { opacity: 0.85 },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.borderSoft,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: c.text,
    backgroundColor: c.surface,
  },
});
}
