import { useEffect, useMemo, useState } from "react";
import { fileService } from "../../services/fileService";

export default function DetailsDrawer({
  open,
  item,
  token,
  onClose,
  detailsRefreshKey = 0,
}) {
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(false);

  const [accessLoading, setAccessLoading] = useState(false);
  const [accessUsers, setAccessUsers] = useState([]); // includes owner + shared

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
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

  // Fetch full item
  useEffect(() => {
    if (!open || !item?.id || !token) {
      setFull(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fileService
      .getById(item.id, token)
      .then((data) => {
        if (!cancelled) setFull(data);
      })
      .catch(() => {
        if (!cancelled) setFull(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, item?.id, token, detailsRefreshKey]);

  const data = full || item;

  const effectiveCreated = pickNewestDate(
    data?.createdAt,
    item?.createdAt,
    full?.createdAt
  );

  const effectiveUpdated = pickNewestDate(
    data?.updatedAt,
    item?.updatedAt,
    full?.updatedAt,
    data?.lastModified,
    item?.lastModified,
    full?.lastModified
  );

  // Smart user fetch: try by ID, fallback to by-username
  async function fetchUserSmart(idOrUsername) {
    if (!idOrUsername) return null;

    try {
      const u = await fileService.getUserById(idOrUsername, token);
      if (u?.id) return u;
    } catch {
      // ignore
    }

    try {
      const u = await fileService.getUserByUsername(String(idOrUsername), token);
      if (u?.id) return u;
    } catch {
      // ignore
    }

    return null;
  }

  function letter(u) {
    const base = String(u?.name || u?.username || "?").trim();
    return base[0]?.toUpperCase() || "?";
  }

  function getAvatarSrc(u) {
    const pic = u?.pictureData;
    const ct = u?.pictureContentType;
    if (!pic || !ct) return "";
    return `data:${ct};base64,${pic}`;
  }

  // Fetch "Who has access" (owner + shared)
  useEffect(() => {
    if (!open || !item?.id || !token) {
      setAccessUsers([]);
      setAccessLoading(false);
      return;
    }

    let cancelled = false;
    setAccessLoading(true);

    (async () => {
      try {
        const current = full || item;
        const ownerId = current?.ownerId ? String(current.ownerId) : null;

        const perms = await fileService.listPermissions(item.id, token);

        const sharedIdentifiers = new Set(
          (perms || [])
            .map((p) => p?.userId ?? p?.user ?? p?.username ?? p?.email ?? null)
            .filter(Boolean)
            .map(String)
        );

        const ownerUser = ownerId ? await fetchUserSmart(ownerId) : null;

        if (ownerUser?.id) sharedIdentifiers.delete(String(ownerUser.id));
        if (ownerId) sharedIdentifiers.delete(String(ownerId));

        const sharedUsers = await Promise.all(
          Array.from(sharedIdentifiers).map(async (idOrUsername) => {
            const u = await fetchUserSmart(idOrUsername);
            return (
              u || {
                id: String(idOrUsername),
                name: "Unknown",
                username: String(idOrUsername),
              }
            );
          })
        );

        if (cancelled) return;

        const finalUsers = ownerUser ? [ownerUser, ...sharedUsers] : sharedUsers;
        setAccessUsers(finalUsers);
      } finally {
        if (!cancelled) setAccessLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };

  }, [open, item?.id, token, detailsRefreshKey, full?.ownerId]);

  const rows = useMemo(() => {
    if (!data) return [];

    const out = [];
    out.push(["Type", data.type ?? "-"]);
    out.push(["ID", data.id ?? "-"]);
    if ("parentId" in data) out.push(["Parent ID", data.parentId ?? "-"]);
    if (effectiveCreated) out.push(["Created", formatDate(effectiveCreated)]);
    if (effectiveUpdated) out.push(["Last modified", formatDate(effectiveUpdated)]);
    return out;
  }, [data, effectiveCreated, effectiveUpdated]);

  if (!open) return null;

  const ownerId = data?.ownerId ? String(data.ownerId) : null;

  return (
    <aside className="details-drawer" aria-label="Details panel">
      <div className="details-drawer__header">
        <div className="details-drawer__title">
          <span className="material-symbols-outlined" aria-hidden="true">
            info
          </span>
          <span>Details</span>
        </div>

        <button
          type="button"
          className="icon-btn ui-icon-btn has-tooltip"
          onClick={onClose}
          aria-label="Close details"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
          <span className="ui-tooltip ui-tooltip--right" role="tooltip">
            Close
          </span>
        </button>
      </div>

      <div className="details-drawer__body">
        {!item?.id && (
          <div className="details-drawer__empty">
            <div className="details-drawer__empty-icon" aria-hidden="true">
              <span className="material-symbols-outlined">folder</span>
            </div>
            <div className="details-drawer__empty-text">
              Select an item to see the details
            </div>
          </div>
        )}

        {item?.id &&
          (loading ? (
            <div className="details-drawer__muted">Loading...</div>
          ) : (
            <>
              <div className="details-drawer__name">{data?.name || "—"}</div>

              {/* Who has access */}
              <div className="details-drawer__section">
                <div className="details-drawer__section-title">Who has access</div>

                {accessLoading ? (
                  <div className="details-drawer__muted">Loading...</div>
                ) : accessUsers.length ? (
                  <div className="details-drawer__access">
                    {accessUsers.map((u) => {
                      const isOwner =
                        ownerId &&
                        (String(u?.id) === ownerId || String(u?.username) === ownerId);

                      const tooltipText = `${u?.name || "Unknown"}${
                        u?.username ? ` (${u.username})` : ""
                      }${isOwner ? " (Owner)" : ""}`;

                      const avatarSrc = getAvatarSrc(u);

                      return (
                        <div
                          key={String(u.id)}
                          className="details-avatar has-tooltip"
                          aria-label={tooltipText}
                        >
                          <div className="details-avatar__inner">
                            {avatarSrc ? (
                              <img className="details-avatar__img" src={avatarSrc} alt="" />
                            ) : (
                              <span className="details-avatar__fallback">{letter(u)}</span>
                            )}
                          </div>

                          <span className="ui-tooltip ui-tooltip--right" role="tooltip">
                            {tooltipText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="details-drawer__muted">—</div>
                )}
              </div>

              {/* Details rows */}
              <div className="details-drawer__section">
                <div className="details-drawer__section-title">Details</div>
                {rows.map(([k, v]) => (
                  <div className="details-drawer__row" key={k}>
                    <div className="details-drawer__key">{k}</div>
                    <div className="details-drawer__val" title={String(v)}>
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ))}
      </div>
    </aside>
  );
}
