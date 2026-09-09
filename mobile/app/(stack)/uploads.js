import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { useAuth } from "../../src/hooks/useAuth";
import { useTheme } from "../../src/hooks/useTheme";
import { getThemeColors } from "../../src/styles/Theme";
import NewMenuSheet from "../../src/components/new/NewMenuSheet";

export default function UploadsScreen() {
  const { token, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeStyles(c), [c]);
  const [open, setOpen] = useState(false);

  const isBusy = authLoading;

  return (
    <View style={styles.container}>
      {!token && !isBusy ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Please log in to upload files.</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.title}>Uploads</Text>

          <Pressable
            onPress={() => setOpen(true)}
            disabled={isBusy || !token}
            style={({ pressed }) => [
              styles.primaryBtn,
              (isBusy || !token) && styles.disabledBtn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Upload files"
          >
            <Text style={styles.primaryBtnText}>Upload files</Text>
          </Pressable>
        </View>
      )}

      <NewMenuSheet
        open={open}
        onClose={() => setOpen(false)}
        mode="uploads"
        parentId={null}
        token={token}
        onDone={() => Promise.resolve()}
      />
    </View>
  );
}

function makeStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, padding: 14, backgroundColor: c.pageBg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    title: { fontSize: 18, fontWeight: "800", color: c.text },
    muted: { color: c.muted },

    primaryBtn: {
      marginTop: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.primary,
    },
    primaryBtnText: { color: c.onPrimary, fontWeight: "800" },

    disabledBtn: { opacity: 0.6 },
    pressed: { opacity: 0.85 },
  });
}
