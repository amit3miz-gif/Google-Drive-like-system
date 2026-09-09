import { useEffect, useMemo, useState } from "react";
import { View, Text, Image, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";

import { useAuth } from "../hooks/useAuth";
import { ThemeContext } from "../context/ThemeContext";
import { validateLoginForm } from "../utils/validators";
import { authService } from "../services/authService";

import Card from "../components/common/Card";
import TextField from "../components/common/TextField";
import MainButton from "../components/common/MainButton";
import InlineError from "../components/common/InlineError";
import Spinner from "../components/common/Spinner";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // SHOW "session expired" once when arriving to login
  useEffect(() => {
    let mounted = true;

    (async () => {
      const reason = await authService.popLogoutReason();
      if (!mounted || !reason) return;

      if (reason === "SESSION_EXPIRED") {
        setErr("Your session has expired. Please log in again.");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit() {
    setErr("");

    const msg = validateLoginForm({ username, password });
    if (msg) {
      setErr(msg);
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace("/(tabs)/drive");
    } catch (e) {
      setErr(e?.message || "Login failed");
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
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={{ width: "100%", maxWidth: 420 }}>
            <Card>
              {/* App Icon */}
              <View
                style={{
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Image
                  source={require("../../assets/icon.jpeg")}
                  style={{
                    width: 200,
                    height: 150,
                    borderRadius: 28,
                  }}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "600",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Login
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
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {loading ? (
                <Spinner />
              ) : (
                <MainButton title="Login" onPress={onSubmit} />
              )}

              <MainButton
                title="Go Register"
                onPress={() => router.push("/register")}
                disabled={loading}
              />
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemeContext.Provider>
  );
}
