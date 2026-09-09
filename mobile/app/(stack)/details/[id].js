import { useEffect, useMemo, useState, useCallback } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";

import { useTheme } from "../../../src/hooks/useTheme";
import { getThemeColors } from "../../../src/styles/Theme";
import { makeDetailsStyles } from "../../../src/styles/details.styles";

import { useAuth } from "../../../src/hooks/useAuth";
import { fileService } from "../../../src/services/fileService";
import Spinner from "../../../src/components/common/Spinner";
import InlineError from "../../../src/components/common/InlineError";

import DetailsPanel from "../../../src/components/details/DetailsPanel";
import AccessSheet from "../../../src/components/details/AccessSheet";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("he-IL");
}

function pickNewestDate(...candidates) {
  let best = null;
  let bestTime = -Infinity;

  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c);
    const t = d.getTime();
    if (Number.isNaN(t)) continue;
    if (t > bestTime) {
      bestTime = t;
      best = c;
    }
  }
  return best;
}

// Try by ID, fallback to by-username
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

function displayUserName(u) {
  return String(u?.name || u?.displayName || u?.username || "").trim() || "Unknown";
}

export default function DetailsScreen() {
  const { theme } = useTheme();
  const colors = useMemo(() => getThemeColors(theme), [theme]);
  const styles = useMemo(() => makeDetailsStyles(colors), [colors]);

  const params = useLocalSearchParams();
  const id = String(params?.id || "");
  const openAccess = String(params?.openAccess || "");
  const navigation = useNavigation();

  const { token, loading: authLoading, user } = useAuth();

  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [accessLoading, setAccessLoading] = useState(false);
  const [ownerUser, setOwnerUser] = useState(null);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [permsByUser, setPermsByUser] = useState({});

  const [accessSheetOpen, setAccessSheetOpen] = useState(false);

  // Open AccessSheet automatically if openAccess=1 (only after auth is ready)
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;
    if (openAccess === "1") setAccessSheetOpen(true);
  }, [openAccess, token, authLoading]);

  // Fetch full item
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (authLoading) return;

      if (!token) {
        setError("Please log in to view details.");
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
        setFull(data || null);
      } catch (e) {
        if (cancelled) return;
        setFull(null);
        setError(e?.message || "Failed to load details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id, token, authLoading]);

  // Set header title to the item name
  useEffect(() => {
    const title = String(full?.name || "").trim();
    if (!title) return;
    navigation.setOptions({ title });
  }, [navigation, full?.name]);

  const effectiveCreated = useMemo(() => pickNewestDate(full?.createdAt), [full?.createdAt]);

  const effectiveUpdated = useMemo(
    () => pickNewestDate(full?.updatedAt, full?.lastModified),
    [full?.updatedAt, full?.lastModified]
  );

  const refreshAccess = useCallback(async () => {
    if (authLoading) return;
    if (!token || !id) return;

    setAccessLoading(true);

    try {
      const current = full;
      const ownerId = current?.ownerId ? String(current.ownerId) : null;

      const perms = await fileService.listPermissions(id, token);

      // permsByUser MUST be keyed by userId only
      const permsMap = {};
      (perms || []).forEach((p) => {
        const uid = p?.userId ?? p?.user?.id ?? p?.user?.userId;
        if (!uid) return;
        permsMap[String(uid)] = p;
      });

      // Shared identifiers should be stable userIds
      const sharedIdentifiers = new Set(
        (perms || [])
          .map((p) => p?.userId ?? p?.user?.id ?? p?.user?.userId ?? null)
          .filter(Boolean)
          .map(String)
      );

      const owner = ownerId ? await fetchUserSmart(ownerId, token) : null;

      // Avoid duplicate if permissions also include the owner
      if (owner?.id) sharedIdentifiers.delete(String(owner.id));
      if (ownerId) sharedIdentifiers.delete(String(ownerId));

      const shared = await Promise.all(
        Array.from(sharedIdentifiers).map(async (uid) => fetchUserSmart(uid, token))
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
    }
  }, [authLoading, token, id, full]);

  // Fetch access (owner + shared)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (cancelled) return;
      if (!full?.id) return;
      await refreshAccess();
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [full?.id, refreshAccess]);

  const ownerText = useMemo(() => {
    if (accessLoading) return "Loading…";
    if (!ownerUser) return "—";
    return displayUserName(ownerUser);
  }, [accessLoading, ownerUser]);

  const accessUsers = useMemo(() => {
    const out = [];
    if (ownerUser) out.push(ownerUser);
    for (const u of sharedUsers || []) out.push(u);
    return out;
  }, [ownerUser, sharedUsers]);

  // canManage: owner OR (has manage permission)
  const canManage = useMemo(() => {
    const myId = user?.id ? String(user.id) : null;
    const ownerId = full?.ownerId ? String(full.ownerId) : null;

    if (myId && ownerId && myId === ownerId) return true;

    const myPerm = myId ? permsByUser?.[myId] : null;
    return !!myPerm?.manage;
  }, [user?.id, full?.ownerId, permsByUser]);

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
      </View>
    );
  }

  const data = full;

  return (
    <View style={styles.screen}>
      <DetailsPanel
        item={data}
        ownerText={ownerText}
        createdText={formatDate(effectiveCreated)}
        modifiedText={formatDate(effectiveUpdated)}
        accessLoading={accessLoading}
        accessUsers={accessUsers}
        onOpenAccess={() => setAccessSheetOpen(true)}
      />

      <AccessSheet
        open={accessSheetOpen}
        onClose={() => setAccessSheetOpen(false)}
        ownerUser={ownerUser}
        sharedUsers={sharedUsers}
        permsByUser={permsByUser}
        fileId={id}
        token={token}
        onChanged={refreshAccess}
        canManage={canManage}
        currentUserId={user?.id ? String(user.id) : null}
      />
    </View>
  );
}
