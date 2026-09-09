import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Modal, Pressable, Text } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";

import { useAuth } from "../../../src/hooks/useAuth";
import { useTheme } from "../../../src/hooks/useTheme";
import { getThemeColors } from "../../../src/styles/Theme";
import { fileService } from "../../../src/services/fileService";

import Spinner from "../../../src/components/common/Spinner";
import InlineError from "../../../src/components/common/InlineError";
import AccessSheet from "../../../src/components/details/AccessSheet";

function displayTitle(item) {
  const name = String(item?.name || "").trim();
  return name ? `Share • ${name}` : "Share";
}

async function fetchUserSmart(idOrUsername, token) {
  if (!idOrUsername) return null;

  try {
    const u = await fileService.getUserById(idOrUsername, token);
    if (u?.id) return u;
  } catch {}

  try {
    const u = await fileService.getUserByUsername(String(idOrUsername), token);
    if (u?.id) return u;
  } catch {}

  return null;
}

function PermissionBlockedDialog({ open, onClose, c }) {
  if (!open) return null;

  return (
    <Modal transparent animationType="fade" visible={open} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: c.overlay,
          }}
        />

        <View
          style={{
            width: "86%",
            maxWidth: 420,
            backgroundColor: c.surface,
            borderRadius: 14,
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 10,
            borderWidth: 1,
            borderColor: c.borderSoft,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: c.text }}>
            Share
          </Text>

          <Text style={{ marginTop: 10, fontSize: 14, color: c.text, lineHeight: 20 }}>
            You don't have permission to share the file. You can ask the owner to change the
            sharing settings.
          </Text>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              { alignSelf: "flex-start", marginTop: 16, paddingVertical: 10, paddingHorizontal: 6 },
              pressed ? { opacity: 0.75 } : null,
            ]}
          >
            <Text style={{ color: c.primary, fontSize: 14, fontWeight: "700" }}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ShareScreen() {
  const params = useLocalSearchParams();
  const id = String(params?.id || "");
  const navigation = useNavigation();

  const { token, loading: authLoading, user } = useAuth();
  const { theme } = useTheme();
  const c = useMemo(() => getThemeColors(theme), [theme]);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [accessLoading, setAccessLoading] = useState(false);
  const [accessLoaded, setAccessLoaded] = useState(false);

  const [ownerUser, setOwnerUser] = useState(null);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [permsByUser, setPermsByUser] = useState({}); // userId -> permission

  const [blockedOpen, setBlockedOpen] = useState(false);

  const [closingAfterSelfRemove, setClosingAfterSelfRemove] = useState(false);

  const canManage = useMemo(() => {
    const myId = user?.id ? String(user.id) : null;
    const ownerId = item?.ownerId ? String(item.ownerId) : null;

    if (myId && ownerId && myId === ownerId) return true;

    const myPerm = myId ? permsByUser?.[myId] : null;
    return !!myPerm?.manage;
  }, [item?.ownerId, user?.id, permsByUser]);

  const refreshAccess = useCallback(async () => {
    if (authLoading) return;
    if (!token || !id) return;

    setAccessLoading(true);
    setAccessLoaded(false);

    try {
      const current = item;
      const ownerId = current?.ownerId ? String(current.ownerId) : null;

      const perms = await fileService.listPermissions(id, token);

      // key by userId only
      const permsMap = {};
      (perms || []).forEach((p) => {
        const uid = p?.userId ?? p?.user?.id ?? p?.user?.userId;
        if (!uid) return;
        permsMap[String(uid)] = p;
      });

      const sharedIdentifiers = new Set(
        (perms || [])
          .map((p) => p?.userId ?? p?.user?.id ?? p?.user?.userId ?? null)
          .filter(Boolean)
          .map(String)
      );

      const owner = ownerId ? await fetchUserSmart(ownerId, token) : null;

      if (owner?.id) sharedIdentifiers.delete(String(owner.id));
      if (ownerId) sharedIdentifiers.delete(String(ownerId));

      const shared = await Promise.all(
        Array.from(sharedIdentifiers).map(async (uid) => {
          const u = await fetchUserSmart(uid, token);
          return u;
        })
      );

      setOwnerUser(owner);
      setSharedUsers((shared || []).filter(Boolean));
      setPermsByUser(permsMap);
    } catch {
      setOwnerUser(null);
      setSharedUsers([]);
      setPermsByUser({});
    } finally {
      setAccessLoading(false);
      setAccessLoaded(true);
    }
  }, [authLoading, token, id, item]);

  // fetch item
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (authLoading) return;

      if (!token) {
        setError("Please log in to share files.");
        setLoading(false);
        return;
      }

      if (!id) {
        setError("Missing id");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fileService.getById(id, token);
        if (cancelled) return;
        setItem(data || null);
      } catch (e) {
        if (cancelled) return;
        setItem(null);
        setError(e?.message || "Failed to load item");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id, token, authLoading]);

  // title
  useEffect(() => {
    navigation.setOptions({ title: displayTitle(item) });
  }, [navigation, item]);

  // access
  useEffect(() => {
    if (!item?.id) return;
    refreshAccess();
  }, [item?.id, refreshAccess]);

  // show blocked dialog only when permissions decision is truly ready
  useEffect(() => {
    if (closingAfterSelfRemove) return; 
    if (loading || error) return;
    if (!item?.id) return;
    if (!accessLoaded) return;

    // If permissions now allow manage -> ensure dialog is closed
    if (canManage) {
      if (blockedOpen) setBlockedOpen(false);
      return;
    }

    // Don't show "no permission" until we have a reliable signal for current user
    const myId = user?.id ? String(user.id) : null;
    const ownerId = item?.ownerId ? String(item.ownerId) : null;

    const hasMyPermEntry =
      !!myId &&
      permsByUser &&
      Object.prototype.hasOwnProperty.call(permsByUser, myId);

    const ownershipKnown = !!ownerId;

    if ((ownershipKnown || hasMyPermEntry) && !canManage) {
      setBlockedOpen(true);
    }
  }, [
    closingAfterSelfRemove,
    loading,
    error,
    item?.id,
    accessLoaded,
    canManage,
    blockedOpen,
    permsByUser,
    user?.id,
    item?.ownerId,
  ]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.pageBg }}>
        <Spinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ padding: 14, backgroundColor: c.pageBg }}>
        <InlineError message={error} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.pageBg }}>
      <PermissionBlockedDialog
        open={blockedOpen}
        onClose={() => {
          setBlockedOpen(false);
          navigation.goBack();
        }}
        c={c}
      />

      {!blockedOpen ? (
        <AccessSheet
          open={true}
          variant="page"
          onClose={() => navigation.goBack()}
          ownerUser={ownerUser}
          sharedUsers={sharedUsers}
          permsByUser={permsByUser}
          fileId={id}
          token={token}
          onChanged={refreshAccess}
          canManage={canManage}
          currentUserId={user?.id ? String(user.id) : null}
          onSelfRemoved={() => {
            navigation.goBack();
          }}
        />
      ) : null}
    </View>
  );
}
