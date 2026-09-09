import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

import { useAuth } from "../../src/hooks/useAuth";
import { useTheme } from "../../src/hooks/useTheme";
import { getThemeColors } from "../../src/styles/Theme";
import { fileService } from "../../src/services/fileService";
import InlineError from "../../src/components/common/InlineError";
import { ALLOWED_EXTENSIONS } from "../../src/utils/fileConstants";
import {
  normalizeCreateTextName,
  isTxtFilename,
  hasAllowedExtension,
} from "../../src/utils/fileNameUtils";

export default function CreateTextScreen() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const parentIdRaw = params?.parentId;
  const parentId =
    parentIdRaw === undefined || parentIdRaw === null || String(parentIdRaw) === ""
      ? null
      : String(parentIdRaw);

  const { token, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [text, setText] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isBusy = saving || authLoading;

  const titleLabel = useMemo(() => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return "New text file";
    const preview = normalizeCreateTextName(trimmed);
    return preview || "New text file";
  }, [name]);

  function allowedExtensionsMessage() {
    return `Unsupported file extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }

  async function handleSave() {
    if (isBusy) return;

    if (!token) {
      setError("Please log in to create files.");
      return;
    }

    const raw = String(name || "").trim() || "Untitled";
    const normalized = normalizeCreateTextName(raw);

    if (!isTxtFilename(normalized)) {
      setError("You cannot change the file extension. Only .txt is allowed.");
      return;
    }

    if (!hasAllowedExtension(normalized)) {
      setError(allowedExtensionsMessage());
      return;
    }

    setSaving(true);
    setError("");

    try {
      await fileService.createFile({ name: normalized, content: text, parentId }, token);
      router.back();
    } catch (e) {
      setError(e?.message || "Failed to create file");
    } finally {
      setSaving(false);
    }
  }

  function handleUndo() {
    if (isBusy) return;
    setName("");
    setText("");
    setError("");
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color={c.icon} />
          <Text numberOfLines={1} style={styles.title}>
            {titleLabel}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleSave}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.iconBtn,
              isBusy && styles.disabledBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Save"
          >
            <MaterialCommunityIcons name="content-save-outline" size={20} color={c.icon} />
          </Pressable>

          <Pressable
            onPress={handleUndo}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.iconBtn,
              isBusy && styles.disabledBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Undo"
          >
            <MaterialCommunityIcons name="undo" size={20} color={c.icon} />
          </Pressable>
        </View>
      </View>

      {!!error && <InlineError message={error} />}

      <View style={styles.nameRow}>
        <TextInput
          value={name}
          onChangeText={(v) => {
            setName(v);
            setError("");
          }}
          placeholder="Name"
          placeholderTextColor={c.muted}
          editable={!isBusy}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.nameInput}
        />
      </View>

      <TextInput
        value={text}
        onChangeText={(v) => {
          setText(v);
          setError("");
        }}
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
  container: { flex: 1, padding: 14, gap: 12, backgroundColor: c.pageBg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
  },

  titleWrap: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  title: { marginLeft: 8, fontSize: 15, fontWeight: "600", color: c.text, flex: 1 },

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

  nameRow: {
    borderWidth: 1,
    borderColor: c.borderSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: c.surface,
  },
  nameInput: {
    padding: 0,
    fontSize: 14,
    color: c.text,
  },

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
