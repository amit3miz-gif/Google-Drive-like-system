// src/components/details/DetailsPanel.jsx
import { useMemo } from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";
import { makeDetailsStyles } from "../../styles/details.styles";

function getAvatarSrc(u) {
  const pic = u?.pictureData;
  const ct = u?.pictureContentType;
  if (!pic || !ct) return "";
  return `data:${ct};base64,${pic}`;
}

export default function DetailsPanel({
  item,
  ownerText,
  createdText,
  modifiedText,
  accessLoading,
  accessUsers,
  onOpenAccess,
}) {
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeDetailsStyles(c), [c]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.panel}>
        <InfoRow styles={styles} label="Type" value={String(item?.type || "—")} />
        <InfoRow styles={styles} label="Owner" value={ownerText} />
        <InfoRow styles={styles} label="Created" value={createdText} />
        <InfoRow styles={styles} label="Modified" value={modifiedText} />

        <AccessRow
          styles={styles}
          label="Who has access"
          loading={accessLoading}
          users={accessUsers}
          onPress={onOpenAccess}
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ styles, label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

function AccessRow({ styles, label, loading, users, onPress }) {
  const disabled = loading || !users?.length;

  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.row}>
      <Text style={styles.label}>{label}</Text>

      {loading ? (
        <Text style={styles.value}>Loading…</Text>
      ) : users?.length ? (
        <View style={styles.avatarsRow}>
          {users.map((u, idx) => {
            const src = getAvatarSrc(u);
            if (!src) return null;

            const key = String(u?.id || u?.username || u?.email || idx);

            return (
              <View key={key} style={styles.avatarWrap}>
                <Image source={{ uri: src }} style={styles.avatarImg} />
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.value}>—</Text>
      )}
    </Pressable>
  );
}
