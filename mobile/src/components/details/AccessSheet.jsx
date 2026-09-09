// src/components/details/AccessSheet.jsx
import { useMemo, useState, useCallback } from "react";
import { Modal, View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../hooks/useTheme";
import { getThemeColors } from "../../styles/Theme";
import { makeAccessSheetStyles } from "../../styles/details.styles";

import InlineError from "../common/InlineError";
import TextField from "../common/TextField";
import MainButton from "../common/MainButton";
import Spinner from "../common/Spinner";

import { fileService } from "../../services/fileService";

function displayUserName(u) {
  return String(u?.name || u?.displayName || u?.username || "").trim() || "Unknown";
}

function getAvatarSrc(u) {
  const pic = u?.pictureData;
  const ct = u?.pictureContentType;
  if (!pic || !ct) return "";
  return `data:${ct};base64,${pic}`;
}

function roleFromPerm(p) {
  if (!p) return "Viewer";
  if (p.manage) return "Manager";
  if (p.write) return "Editor";
  if (p.read) return "Viewer";
  return "Viewer";
}

function getPermId(p) {
  return p?.pId ?? p?.id ?? p?._id ?? null;
}

function keyForUser(u, idx) {
  return String(u?.id || u?.username || u?.email || idx);
}

function permPayloadFor(role, userId) {
  const base = { userId: String(userId) };
  switch (role) {
    case "viewer":
      return { ...base, read: true };
    case "editor":
      return { ...base, read: true, write: true };
    case "manager":
      return { ...base, read: true, write: true, manage: true };
    default:
      return { ...base, read: true };
  }
}

export default function AccessSheet({
  open,
  onClose,
  ownerUser,
  sharedUsers,
  permsByUser, // userId -> permission
  fileId,
  token,
  onChanged,
  canManage = false,
  currentUserId = null,
  onSelfRemoved, // () => void
  variant = "modal", // "modal" | "page"
}) {
  if (!open) return null;

  const insets = useSafeAreaInsets();
  const modalBottomPad = variant === "modal" ? insets.bottom : 0;

  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeAccessSheetStyles(c), [c]);
  const pageStyles = useMemo(() => makePageStyles(c), [c]);

  const shared = Array.isArray(sharedUsers) ? sharedUsers : [];
  const ownerName = ownerUser ? displayUserName(ownerUser) : "Unknown";

  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [pendingUser, setPendingUser] = useState(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const trimmed = useMemo(() => String(username || "").trim(), [username]);

  const openRolePickerFor = useCallback(async () => {
    if (!canManage) return;

    if (!token || !fileId) {
      setErr("Missing token or file id");
      return;
    }

    const uName = trimmed.toLowerCase();
    if (!uName) {
      setErr("Please enter a username");
      return;
    }

    setBusy(true);
    setErr("");

    try {
      const user = await fileService.getUserByUsername(uName, token);
      const targetUserId = user?.id ? String(user.id) : null;
      if (!targetUserId) throw new Error("User not found");

      const ownerId = ownerUser?.id ? String(ownerUser.id) : null;
      if (ownerId && ownerId === targetUserId) throw new Error("Owner already has access");

      setPendingUser(user);
      setRolePickerOpen(true);
    } catch (e) {
      setPendingUser(null);
      setRolePickerOpen(false);
      setErr(e?.message || "Failed to find user");
    } finally {
      setBusy(false);
    }
  }, [canManage, token, fileId, trimmed, ownerUser?.id]);

  const grantRole = useCallback(
    async (roleKey) => {
      if (!canManage) return;

      if (!token || !fileId) {
        setErr("Missing token or file id");
        return;
      }

      if (!pendingUser?.id) {
        setErr("Missing selected user");
        return;
      }

      setBusy(true);
      setErr("");

      try {
        const payload = permPayloadFor(roleKey, pendingUser.id);
        await fileService.createPermission(String(fileId), payload, token);

        setUsername("");
        setPendingUser(null);
        setRolePickerOpen(false);

        await onChanged?.();
      } catch (e) {
        setErr(e?.message || "Failed to share");
      } finally {
        setBusy(false);
      }
    },
    [canManage, token, fileId, pendingUser?.id, onChanged]
  );

  const removeUser = useCallback(
    async (u) => {
      if (!token || !fileId) {
        setErr("Missing token or file id");
        return;
      }

      const uid = u?.id ? String(u.id) : null;
      if (!uid) {
        setErr("Cannot remove: missing user id");
        return;
      }

      const isSelf = !!currentUserId && String(currentUserId) === uid;

      // allow self-remove even if !canManage
      if (!canManage && !isSelf) return;

      const p = permsByUser?.[uid];
      const permId = getPermId(p);
      if (!permId) {
        setErr("Permission not found");
        return;
      }

      setBusy(true);
      setErr("");

      try {
        await fileService.deletePermission(String(fileId), String(permId), token);

        if (isSelf) {
          onSelfRemoved?.();
          return;
        }

        await onChanged?.();
      } catch (e) {
        setErr(e?.message || "Failed to remove access");
      } finally {
        setBusy(false);
      }
    },
    [canManage, currentUserId, token, fileId, permsByUser, onChanged, onSelfRemoved]
  );

  const content = (
    <View style={variant === "page" ? pageStyles.pageRoot : null}>
      <View
        style={[
          styles.sheet,
          variant === "page" ? pageStyles.pageSheet : null,
          modalBottomPad ? { paddingBottom: 13 + modalBottomPad } : null,
        ]}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>People with access</Text>
        </View>

        {canManage ? (
          <View style={{ paddingBottom: 10, gap: 10 }}>
            <InlineError message={err} />

            <TextField
              label="Add by email"
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. Israeli@gmail.com"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <MainButton title={busy ? "Loading…" : "Next"} onPress={openRolePickerFor} disabled={busy} />
          </View>
        ) : (
          <View style={{ paddingBottom: 8 }}>
            <InlineError message={err} />
          </View>
        )}

        <View style={styles.list}>
          {ownerUser ? (
            <UserRow
              user={ownerUser}
              subtitle={ownerUser?.email || ownerUser?.username || ""}
              rightLabel="Owner"
              c={c}
              styles={styles}
            />
          ) : (
            <UserRowPlaceholder name={ownerName} subtitle="Owner" styles={styles} />
          )}

          {shared.map((u, idx) => {
            const safeKey = keyForUser(u, idx);

            const uid = u?.id ? String(u.id) : null;
            const p = uid ? permsByUser?.[uid] : null;
            const role = roleFromPerm(p);

            const isSelf = !!currentUserId && uid && String(currentUserId) === uid;
            const showRemove = canManage || isSelf;

            return (
              <UserRow
                key={safeKey}
                user={u}
                subtitle={u?.username || u?.email || ""}
                rightLabel={role}
                showRemove={showRemove}
                removing={busy}
                onRemove={() => removeUser(u)}
                c={c}
                styles={styles}
              />
            );
          })}

          {busy ? (
            <View style={{ paddingTop: 10 }}>
              <Spinner />
            </View>
          ) : null}

          {!ownerUser && shared.length === 0 ? <Text style={styles.muted}>—</Text> : null}
        </View>
      </View>

        <RolePickerSheet
        open={rolePickerOpen}
        user={pendingUser}
        onClose={() => {
          if (busy) return;
          setRolePickerOpen(false);
          setPendingUser(null);
        }}
        onPick={grantRole}
        disabled={busy}
        c={c}
        pageStyles={pageStyles}
      />
    </View>
  );

  if (variant === "page") return content;

  return (
    <Modal transparent animationType="fade" visible={open} onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        {content}
      </View>
    </Modal>
  );
}

function RolePickerSheet({ open, user, onClose, onPick, disabled, c, pageStyles }) {
  if (!open) return null;

  const title = user ? displayUserName(user) : "Select user";

  return (
    <Modal transparent animationType="fade" visible={open} onRequestClose={onClose}>
      <View style={pageStyles.roleModalRoot}>
        <Pressable style={pageStyles.roleBackdrop} onPress={onClose} disabled={disabled} />

        <View style={pageStyles.roleSheet}>
          <Text style={pageStyles.roleTitle}>Share with {title}</Text>

          <View style={{ height: 10 }} />

          <RoleRow label="Viewer" sub="Can view" onPress={() => onPick("viewer")} disabled={disabled} c={c} />
          <RoleRow label="Editor" sub="Can edit" onPress={() => onPick("editor")} disabled={disabled} c={c} />
          <RoleRow label="Manager" sub="Full access" onPress={() => onPick("manager")} disabled={disabled} c={c} />
        </View>
      </View>
    </Modal>
  );
}

function RoleRow({ label, sub, onPress, disabled, c }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.borderSoft },
        pressed ? { opacity: 0.85 } : null,
        disabled ? { opacity: 0.6 } : null,
      ]}
    >
      <Text style={{ fontSize: 14, fontWeight: "700", color: c.text }}>{label}</Text>
      <Text style={{ marginTop: 2, fontSize: 12.5, color: c.muted }}>{sub}</Text>
    </Pressable>
  );
}

function UserRow({ user, subtitle, rightLabel, showRemove, removing, onRemove, c, styles }) {
  const src = getAvatarSrc(user);

  return (
    <View style={styles.userRow}>
      <View style={styles.avatarWrap}>{!!src && <Image source={{ uri: src }} style={styles.avatarImg} />}</View>

      <View style={styles.userText}>
        <Text style={styles.userName} numberOfLines={1}>
          {displayUserName(user)}
        </Text>
        {!!subtitle && (
          <Text style={styles.userSub} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Text style={styles.role} numberOfLines={1}>
          {rightLabel}
        </Text>

        {showRemove ? (
          <Pressable
            onPress={onRemove}
            disabled={removing}
            style={({ pressed }) => [
              {
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: c.borderSoft,
              },
              pressed ? { opacity: 0.85 } : null,
              removing ? { opacity: 0.6 } : null,
            ]}
          >
            <Text style={{ fontSize: 12, color: c.text }}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function UserRowPlaceholder({ name, subtitle, styles }) {
  return (
    <View style={styles.userRow}>
      <View style={styles.avatarWrap} />
      <View style={styles.userText}>
        <Text style={styles.userName} numberOfLines={1}>
          {name}
        </Text>
        {!!subtitle && (
          <Text style={styles.userSub} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={styles.role}>Owner</Text>
    </View>
  );
}

function makePageStyles(c) {
  return StyleSheet.create({
    pageRoot: { flex: 1, backgroundColor: c.pageBg },
    pageSheet: {
      flex: 1,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },

    roleModalRoot: { flex: 1, justifyContent: "flex-end" },
    roleBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },
    roleSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderColor: c.borderSoft,
    },
    roleTitle: { fontSize: 15, fontWeight: "700", color: c.text },
  });
}
