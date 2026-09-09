import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  TextInput,
  Alert,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fileService } from "../../services/fileService";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";
import {
  ensureExtension,
  hasAllowedExtension,
  normalizeCreateTextName,
  isTxtFilename,
  allowedExtensionsMessage,
} from "../../utils/fileNameUtils";

export default function NewMenuSheet({
  open,
  onClose,
  mode = "full",
  parentId = null,
  token = null,
  onDone,
}) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const isUploadsOnly = mode === "uploads";

  const items = useMemo(() => {
    const base = [
      {
        key: "upload_text",
        icon: "file-document-outline",
        label: "Upload text file",
        onPress: () => handleUploadText(),
      },
      {
        key: "upload_image",
        icon: "image-outline",
        label: "Upload image",
        onPress: () => handleUploadImage(),
      },
    ];

    if (isUploadsOnly) return base;

    return [
      ...base,
      { key: "sep1", separator: true },
      {
        key: "new_text",
        icon: "plus-box-outline",
        label: "New text file",
        onPress: () => openCreateText(),
      },
      {
        key: "new_folder",
        icon: "folder-plus-outline",
        label: "Create folder",
        onPress: () => openCreateFolder(),
      },
    ];
  }, [isUploadsOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  function requireTokenOrAlert() {
    if (token) return true;
    Alert.alert("Login required", "Please log in to create or upload files.");
    return false;
  }

  function closeAll() {
    setNameDialogOpen(false);
    setNameValue("");
    onClose?.();
  }

  async function run(action) {
    if (busy) return;

    try {
      setBusy(true);

      const successMsg = await action();

      // refresh parent list (best effort)
      try {
        await onDone?.();
      } catch {}

      closeAll();

      if (typeof successMsg === "string" && successMsg.trim()) {
        Alert.alert("Success", successMsg);
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function openCreateFolder() {
    if (!requireTokenOrAlert()) return;
    setNameValue("");
    setNameDialogOpen(true);
  }

  function openCreateText() {
    if (!requireTokenOrAlert()) return;

    router.push({
      pathname: "/(stack)/createText",
      params: {
        parentId: parentId ?? "",
      },
    });

    onClose?.();
  }

  async function handleCreateFolderFromDialog() {
    const raw = String(nameValue || "").trim();
    if (!raw) return;

    await run(async () => {
      await fileService.createFolder({ name: raw, parentId: parentId ?? null }, token);
      return "Folder created";
    });
  }

  async function readPickedTextFile(asset) {
    if (Platform.OS === "web") {
      if (asset?.file?.text) return await asset.file.text();
      if (asset?.uri) return await (await fetch(asset.uri)).text();
      throw new Error("Failed to read selected file.");
    }

    if (!asset?.uri) throw new Error("Failed to read selected file.");
    const textEncoding = FileSystem?.EncodingType?.UTF8 || "utf8";
    return await FileSystem.readAsStringAsync(asset.uri, {
      encoding: textEncoding,
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image data."));
      reader.onload = () => {
        const result = String(reader.result || "");
        const idx = result.indexOf("base64,");
        if (idx === -1) return reject(new Error("Failed to read image data."));
        resolve(result.slice(idx + "base64,".length));
      };
      reader.readAsDataURL(blob);
    });
  }

  async function readPickedImageAsDataUrl(asset) {
    if (asset?.base64) {
      const mime = asset.mimeType || guessMimeFromUri(asset.uri) || "image/jpeg";
      return `data:${mime};base64,${asset.base64}`;
    }

    const uri = asset?.uri;
    if (!uri) throw new Error("Failed to read image data.");

    if (Platform.OS === "web") {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const mime = blob.type || asset.mimeType || guessMimeFromUri(uri) || "image/jpeg";
      const b64 = await blobToBase64(blob);
      return `data:${mime};base64,${b64}`;
    }

    const base64Encoding = FileSystem?.EncodingType?.Base64 || "base64";
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: base64Encoding,
    });
    const mime = asset.mimeType || guessMimeFromUri(uri) || "image/jpeg";
    return `data:${mime};base64,${b64}`;
  }

  async function handleUploadText() {
    if (!requireTokenOrAlert()) return;

    await run(async () => {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "text/*"],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (res.canceled) return "";

      const asset = res.assets?.[0];
      const rawName = String(asset?.name || "").trim() || "untitled.txt";

      if (!isTxtFilename(rawName)) {
        throw new Error(allowedExtensionsMessage());
      }

      const finalName = normalizeCreateTextName(rawName);

      if (!hasAllowedExtension(finalName)) {
        throw new Error(allowedExtensionsMessage());
      }

      const content = await readPickedTextFile(asset);

      // allow duplicates: always create new file with the same name
      await fileService.createFile(
        { name: finalName, content, parentId: parentId ?? null },
        token
      );

      return "Text file uploaded";
    });
  }

  async function handleUploadImage() {
    if (!requireTokenOrAlert()) return;

    await run(async () => {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (perm.status !== "granted") {
        throw new Error("Please allow photo library access to pick an image.");
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });

      if (res.canceled) return "";

      const asset = res.assets?.[0];
      const dataUrl = await readPickedImageAsDataUrl(asset);

      const mime = asset.mimeType || guessMimeFromUri(asset.uri) || "image/jpeg";
      const candidateBase = asset.fileName || `image_${Date.now()}`;
      const finalName = ensureExtension(candidateBase, mime);

      if (!hasAllowedExtension(finalName)) {
        throw new Error(allowedExtensionsMessage());
      }

      await fileService.createFile(
        { name: finalName, content: dataUrl, parentId: parentId ?? null },
        token
      );

      return "Image uploaded";
    });
  }

  if (!open) return null;

  const sheetBottomPad = Math.max(10, insets.bottom + 6);

  return (
    <>
      <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={busy ? undefined : onClose} />

          <View style={[styles.sheet, { paddingBottom: sheetBottomPad }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New</Text>

              <Pressable
                onPress={onClose}
                disabled={busy}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Close new menu"
                hitSlop={10}
              >
                <MaterialCommunityIcons name="close" size={20} color={c.icon} />
              </Pressable>
            </View>

            {items.map((it) => {
              if (it.separator) return <View key={it.key} style={styles.separator} />;

              return (
                <Pressable
                  key={it.key}
                  disabled={busy}
                  onPress={it.onPress}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.pressedRow,
                    busy && styles.disabledRow,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={it.label}
                >
                  <MaterialCommunityIcons name={it.icon} size={22} color={c.icon} />
                  <Text style={styles.rowText}>{it.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {nameDialogOpen && (
            <View style={overlayStyles.dialogOverlay}>
              <Pressable
                style={styles.backdrop}
                onPress={busy ? undefined : () => setNameDialogOpen(false)}
              />

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={overlayStyles.dialogAvoider}
              >
                <View style={styles.dialog}>
                  <Text style={styles.dialogTitle}>Create folder</Text>

                  <TextInput
                    value={nameValue}
                    onChangeText={setNameValue}
                    placeholder="Folder name"
                    placeholderTextColor={c.muted}
                    editable={!busy}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.dialogInput}
                  />

                  <View style={styles.dialogActions}>
                    <Pressable
                      onPress={() => setNameDialogOpen(false)}
                      disabled={busy}
                      style={({ pressed }) => [
                        styles.dialogBtn,
                        pressed && styles.pressed,
                        busy && styles.disabledRow,
                      ]}
                    >
                      <Text style={styles.dialogBtnText}>Cancel</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleCreateFolderFromDialog}
                      disabled={busy || !String(nameValue || "").trim()}
                      style={({ pressed }) => [
                        styles.dialogBtnPrimary,
                        pressed && styles.pressed,
                        (busy || !String(nameValue || "").trim()) &&
                          styles.disabledPrimary,
                      ]}
                    >
                      <Text style={styles.dialogBtnPrimaryText}>Create</Text>
                    </Pressable>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const overlayStyles = StyleSheet.create({
  dialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  dialogAvoider: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 14,
  },
});

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
    modalRoot: { flex: 1, justifyContent: "flex-end" },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },

    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 10,
      borderTopWidth: 1,
      borderColor: c.borderSoft,
    },

    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 8,
    },

    sheetTitle: { fontSize: 16, fontWeight: "700", color: c.text },

    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    separator: {
      height: 1,
      backgroundColor: c.borderSoft,
      marginVertical: 6,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 12,
    },

    rowText: { fontSize: 15, color: c.text, fontWeight: "500" },

    pressedRow: { opacity: 0.75 },
    disabledRow: { opacity: 0.6 },

    pressed: { opacity: 0.85 },

    dialog: {
      alignSelf: "center",
      width: "92%",
      maxWidth: 420,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },

    dialogTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: c.text,
      marginBottom: 10,
    },

    dialogInput: {
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: c.text,
      backgroundColor: c.surface2,
    },

    dialogActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 12,
    },

    dialogBtn: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borderSoft,
      backgroundColor: c.surface2,
    },
    dialogBtnText: { color: c.text, fontWeight: "700" },

    dialogBtnPrimary: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.primary,
    },
    dialogBtnPrimaryText: { color: c.onPrimary, fontWeight: "800" },
    disabledPrimary: { opacity: 0.5 },
  });
}
