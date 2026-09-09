import { useMemo, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";

import { validateRegisterForm } from "../utils/validators";
import { authService } from "../services/authService";
import { ThemeContext } from "../context/ThemeContext";

import Card from "../components/common/Card";
import TextField from "../components/common/TextField";
import MainButton from "../components/common/MainButton";
import InlineError from "../components/common/InlineError";
import Spinner from "../components/common/Spinner";

// support gallery pick (base64) because backend needs pictureData + pictureContentType
import * as ImagePicker from "expo-image-picker";

import { AVATARS } from "../../assets/avatarsBase64";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // picture = { data: base64, contentType: "image/..." }
  const [picture, setPicture] = useState(null);

  // track selected preset avatar for UI highlight
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);

  // preview for gallery-picked image (web/mobile)
  const [pickedPreviewUri, setPickedPreviewUri] = useState(null);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // pick from gallery and convert to base64 using expo-image-picker
  async function pickAvatarFromGallery() {
    setErr("");

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErr("Permission to access gallery is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const picked = result.assets?.[0];
    if (!picked?.base64) {
      setErr("Failed to read image data");
      return;
    }

    // if user chose from gallery, clear preset selection
    setSelectedAvatarId(null);

    // show preview in the avatars row
    setPickedPreviewUri(picked.uri);

    // what backend expects (authService.register maps -> pictureData/pictureContentType)
    setPicture({
      data: picked.base64,
      contentType: picked.mimeType || "image/jpeg",
    });
  }

  function pickPresetAvatar(a) {
    setErr("");
    setSelectedAvatarId(a.id);

    // show preview like the other avatars (data-uri)
    setPickedPreviewUri(`data:${a.contentType};base64,${a.data}`);

    setPicture({
      data: a.data,
      contentType: a.contentType,
    });
  }

  async function onSubmit() {
    setErr("");

    const msg = validateRegisterForm({
      username,
      name,
      password,
      password2,
      picture,
    });
    if (msg) {
      setErr(msg);
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        username: username.trim(),
        password,
        name: name.trim(),
        picture,
      });

      router.replace("/login");
    } catch (e) {
      setErr(e?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  }

  const lightThemeValue = useMemo(
    () => ({
      theme: "light",
      ready: true,
      toggleTheme: () => {},
      setTheme: () => {},
    }),
    []
  );
  
  return (
    <ThemeContext.Provider value={lightThemeValue}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fff" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
            backgroundColor: "#fff",
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={{ width: "100%", maxWidth: 420 }}>
            <Card>
              <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 12 }}>
                Register
              </Text>

              {!!err && <InlineError message={err} />}

              <TextField
                label="Email"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextField
                label="Full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TextField
                label="Confirm password"
                value={password2}
                onChangeText={setPassword2}
                secureTextEntry
              />

              <Text style={{ marginTop: 10, marginBottom: 6 }}>
                Choose an avatar
              </Text>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                {AVATARS.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => pickPresetAvatar(a)}
                    disabled={loading}
                    style={{
                      borderWidth: selectedAvatarId === a.id ? 2 : 1,
                      borderColor: selectedAvatarId === a.id ? "#1d4ed8" : "#ddd",
                      borderRadius: 999,
                      padding: 2,
                    }}
                  >
                    <Image
                      source={{ uri: `data:${a.contentType};base64,${a.data}` }}
                      style={{ width: 56, height: 56, borderRadius: 999 }}
                    />
                  </Pressable>
                ))}

                {pickedPreviewUri && !selectedAvatarId && (
                  <View
                    style={{
                      borderWidth: 2,
                      borderColor: "#1d4ed8",
                      borderRadius: 999,
                      padding: 2,
                    }}
                  >
                    <Image
                      source={{ uri: pickedPreviewUri }}
                      style={{ width: 56, height: 56, borderRadius: 999 }}
                    />
                  </View>
                )}
              </View>

              {!!picture && (
                <Text style={{ marginTop: -6, marginBottom: 12, color: "#1d4ed8" }}>
                  Picture selected
                </Text>
              )}

              <MainButton
                title="Upload your own picture"
                onPress={pickAvatarFromGallery}
                disabled={loading}
              />

              {loading ? (
                <Spinner />
              ) : (
                <MainButton title="Register" onPress={onSubmit} />
              )}

              <MainButton
                title="Back to Login"
                onPress={() => router.replace("/login")}
                disabled={loading}
              />
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemeContext.Provider>
  );

}
