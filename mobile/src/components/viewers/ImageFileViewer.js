import { useEffect, useMemo, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { fileService } from "../../services/fileService";
import InlineError from "../common/InlineError";
import Spinner from "../common/Spinner";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";

export default function ImageFileViewer({ file, token }) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);
  const fileId = String(file?.id || "");
  const fileName = String(file?.name || "Untitled");

  const initialSrc = typeof file?.content === "string" ? file.content : "";

  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [originalSrc, setOriginalSrc] = useState(initialSrc);
  const [src, setSrc] = useState(initialSrc);

  const isDirty = useMemo(() => src !== originalSrc, [src, originalSrc]);
  const isBusy = loading || saving;

  useEffect(() => {
    setOriginalSrc(initialSrc);
    setSrc(initialSrc);
  }, [fileId, initialSrc]); // when file changes

  async function ensurePermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  }

  async function handleReplace() {
    if (isBusy) return;

    const ok = await ensurePermission();
    if (!ok) {
      Alert.alert("Permission required", "Please allow photo library access to pick an image.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
      base64: true,
    });

    if (res.canceled) return;

    const asset = res.assets?.[0];
    if (!asset?.base64) {
      setError("Failed to read image data.");
      return;
    }

    const mime = asset.mimeType || guessMimeFromUri(asset.uri) || "image/jpeg";
    const dataUrl = `data:${mime};base64,${asset.base64}`;

    setError("");
    setSrc(dataUrl);
  }

  async function handleSave() {
    if (!isDirty || isBusy) return;

    setSaving(true);
    setError("");

    try {
      await fileService.update(fileId, { content: src }, token);
      setOriginalSrc(src);
    } catch (e) {
      setError(e?.message || "Failed to save image");
    } finally {
      setSaving(false);
    }
  }

  function handleUndo() {
    if (isBusy || !isDirty) return;
    setSrc(originalSrc);
    setError("");
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <MaterialCommunityIcons name="image-outline" size={20} color={c.icon} />
          <Text numberOfLines={1} style={styles.title}>
            {fileName}
          </Text>
          {isDirty && <Text style={styles.dirty}>● Unsaved</Text>}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleReplace}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.iconBtn,
              isBusy && styles.disabledBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Replace image"
          >
            <MaterialCommunityIcons name="swap-horizontal" size={20} color={c.icon} />
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={!isDirty || isBusy}
            style={({ pressed }) => [
              styles.iconBtn,
              (!isDirty || isBusy) && styles.disabledBtn,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Save image"
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
            accessibilityLabel="Undo image change"
          >
            <MaterialCommunityIcons name="undo" size={20} color={c.icon} />
          </Pressable>
        </View>
      </View>

      {!!error && <InlineError message={error} />}

      {saving ? (
        <View style={styles.center}>
          <Spinner />
        </View>
      ) : !src ? (
        <View style={styles.empty}>
          <Text style={styles.muted}>No image content found.</Text>
          <Pressable onPress={handleReplace} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Pick an image</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.imageWrap}>
          <Image source={{ uri: src }} style={styles.image} resizeMode="contain" />
        </View>
      )}
    </View>
  );
}

function guessMimeFromUri(uri = "") {
  const u = String(uri).toLowerCase();
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".gif")) return "image/gif";
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
  return null;
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

  imageWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.borderSoft,
    borderRadius: 12,
    backgroundColor: c.surface,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  muted: { color: c.muted },

  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: c.primary,
  },
  primaryBtnText: { color: c.onPrimary, fontWeight: "700" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
}
