import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useLocalSearchParams, useNavigation, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../../../src/hooks/useAuth";
import { useTheme } from "../../../src/hooks/useTheme";
import { getThemeColors } from "../../../src/styles/Theme";
import { fileService } from "../../../src/services/fileService";
import FileViewer from "../../../src/components/viewers/FileViewer";
import Spinner from "../../../src/components/common/Spinner";
import InlineError from "../../../src/components/common/InlineError";

export default function FileScreen() {
  const { id } = useLocalSearchParams();
  const fileId = String(id || "");

  const { token, loading: authLoading } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);

  function handleClose() {
    const canGoBack =
      typeof router.canGoBack === "function" ? router.canGoBack() : false;

    if (canGoBack) router.back();
    else router.replace("/(tabs)/drive");
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerTitle: "",
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          onPress={handleClose}
          hitSlop={10}
          style={{ paddingHorizontal: 14 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <MaterialCommunityIcons name="close" size={24} color={c.icon} />
        </Pressable>
      ),
    });
  }, [navigation, c.icon]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Wait until auth init finishes
      if (authLoading) return;

      setLoading(true);
      setError("");

      if (!fileId) {
        setLoading(false);
        setError("Missing file id");
        return;
      }

      if (!token) {
        setLoading(false);
        setError("Please log in to open files.");
        return;
      }

      try {
        const data = await fileService.getById(fileId, token);
        if (cancelled) return;
        setFile(data || null);
        if (!data) setError("File not found");
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Failed to load file");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fileId, token, authLoading]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Spinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <InlineError message={error} />
        {!token && (
          <Pressable
            onPress={() => router.push("/login")}
            style={styles.loginBtn}
          >
            <Text style={styles.loginBtnText}>Go to Login</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (!file) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>File not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FileViewer file={file} token={token} />
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 14, gap: 12, backgroundColor: c.pageBg },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    muted: { color: c.muted },

    loginBtn: {
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.primary,
    },
    loginBtnText: { color: c.onPrimary, fontWeight: "700" },
  });
}
