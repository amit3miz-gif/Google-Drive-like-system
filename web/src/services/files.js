const store = require('../store/files');
const { createTcpClientFromEnv } = require('../tcp/tcpClient');
const permsStore = require('../store/permissions');
const { canRead, canManage, canWrite } = require('./permissions');
const usersStore = require('../store/users');
const userTree = require('../store/userTree');

const CONTENT_PREFIX = 'b64:'; // Marks content stored as base64 so Ex2 line-based protocol won't break on newlines

function encodeContent(content) { // Encode content to single-line safe payload for Ex2
  const raw = String(content ?? '');
  const b64 = Buffer.from(raw, 'utf8').toString('base64');
  return CONTENT_PREFIX + b64;
}

function decodeContent(maybeEncoded) { // Decode content back to original text (multiline-safe) for API consumers
  if (typeof maybeEncoded !== 'string') return '';
  if (!maybeEncoded.startsWith(CONTENT_PREFIX)) return maybeEncoded;

  const b64 = maybeEncoded.slice(CONTENT_PREFIX.length);
  try {
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    // If decoding fails, return empty to avoid leaking encoded garbage
    return '';
  }
}

// Send a single TCP command to Ex2 server
async function send(command) {
  const client = createTcpClientFromEnv();
  await client.connect();
  try {
    return await client.sendCommand(command);
  } finally {
    client.close();
  }
}

// Replace parentId with effective parent (owned: real parentId, shared: UserTree parentId)
async function withEffectiveParent(userId, items) {
  const uid = String(userId);
  const out = [];

  for (const item of items) {
    if (!item) continue;

    let effectiveParentId = item.parentId ?? null;

    if (String(item.ownerId) !== uid) {
      effectiveParentId = await userTree.getUserParent(uid, item);
      effectiveParentId = effectiveParentId ?? null;
    }

    out.push({
      ...item,
      parentId: effectiveParentId,
    });
  }

  return out;
}

// GET /api/files - returns metadata (root level by default)
// supports optional parentId query parameter to list children of a folder
async function list(userId, parentId = null) {
  if (!userId) return { statusCode: 401, body: { error: "Unauthorized" } };

  // normalize pid
  let pid = parentId;
  if (
    pid === null ||
    pid === undefined ||
    String(pid).trim() === "" ||
    String(pid).trim() === "null" ||
    String(pid).trim() === "undefined"
  ) {
    pid = null;
  } else {
    pid = String(pid).trim();
  }

  const visible = [];
  const seen = new Set();

  // Logical children
  if (pid === null) {
    // ROOT: only owned items in root
    const ownedCandidates = await store.listByOwnerAndParent(userId, null);

    for (const item of ownedCandidates) {
      if (!(await canRead(userId, item))) continue;
      if (seen.has(item.id)) continue;

      seen.add(item.id);
      visible.push({ ...item, parentId: null });
    }
  } else {
    // bring ALL logical children of that folder (owned + shared),
    // then filter by permissions + effective parent
    const logicalCandidates = await store.list(pid);

    for (const item of logicalCandidates) {
      if (!(await canRead(userId, item))) continue;

      const effectiveParent = await userTree.getUserParent(userId, item);
      if ((effectiveParent ?? null) !== (pid ?? null)) continue;

      if (seen.has(item.id)) continue;

      seen.add(item.id);
      visible.push({ ...item, parentId: effectiveParent ?? null });
    }
  }

  // Per-user mapped items (UserTree)
  // (for moved shared items, or for mapping shared root)
  const mappedIds = await userTree.listFileIdsByUserAndParent(userId, pid);

  for (const fileId of mappedIds) {
    if (seen.has(fileId)) continue;

    const item = await store.get(fileId);
    if (!item) continue;
    if (!(await canRead(userId, item))) continue;

    const effectiveParent = await userTree.getUserParent(userId, item);
    if ((effectiveParent ?? null) !== (pid ?? null)) continue;

    seen.add(item.id);
    visible.push({ ...item, parentId: effectiveParent ?? null });
  }

  return { statusCode: 200, body: visible };
}

/**
 * listAll(userId)
 * Returns ALL items the user can read (root + inside folders).
 * This is needed for endpoints like /starred and /trash that must consider items anywhere.
 */
async function listAll(userId) {
  if (!userId) return { statusCode: 401, body: { error: 'Unauthorized' } };

  const all = await store.listAll();

  const readable = [];
  for (const item of all) {
    if (await canRead(userId, item)) readable.push(item);
  }

  const enriched = await withEffectiveParent(userId, readable);

  return { statusCode: 200, body: enriched };
}

// GET /api/files/:id - validates existence via TCP only for files
async function get(userId, id) {
  const item = await store.get(id);
  if (!item) {
    return { statusCode: 404, body: { error: 'File not found' } };
  }
  if (!(await canRead(userId, item))) {
    return { statusCode: 403, body: { error: 'Forbidden' } };
  }

  // Compute effective parentId (owned: real parentId, shared: UserTree parentId)
  let effectiveParentId = item.parentId ?? null;
  if (String(item.ownerId) !== String(userId)) {
    effectiveParentId = await userTree.getUserParent(userId, item);
    effectiveParentId = effectiveParentId ?? null;
  }

  const enrichedItem = {
    ...item,
    parentId: effectiveParentId,
  };

  // Folder: return metadata only
  if (enrichedItem.type === 'folder') {
    return { statusCode: 200, body: enrichedItem };
  }

  // File: fetch content from Ex2 TCP server
  try {
    const resp = await send(`get ${enrichedItem.id}`);

    if (resp.statusCode === 200) {
      const rawContent = (resp.bodyLines && resp.bodyLines.length)
        ? resp.bodyLines.join('\n')
        : '';

      const content = decodeContent(rawContent);

      return { statusCode: 200, body: { ...enrichedItem, content } };
    }
    if (resp.statusCode === 404) {
      return { statusCode: 404, body: { error: 'File not found' } };
    }
    if (resp.statusCode === 400) {
      return { statusCode: 400, body: { error: 'Bad request' } };
    }

    return { statusCode: 500, body: { error: 'Internal server error' } };
  } catch {
    return { statusCode: 500, body: { error: 'Internal server error' } };
  }
}

// POST /api/files - creates a new file/folder
async function create({ name, type = 'file', content, parentId = null, ownerId = null }) {
  if (!ownerId) {
    return { statusCode: 401, body: { error: 'Unauthorized' } };
  }

  // Validate parent if provided
  if (parentId !== null && parentId !== undefined) {
    const pid = String(parentId).trim();
    if (!pid) {
      return { statusCode: 400, body: { error: 'Invalid parentId' } };
    }
    const parent = await store.get(pid);
    if (!parent) {
      return { statusCode: 404, body: { error: 'Parent folder not found' } };
    }
    if (parent.type !== 'folder') {
      return { statusCode: 400, body: { error: 'Parent must be a folder' } };
    }
    if (!(await canWrite(ownerId, parent))) {
      return { statusCode: 403, body: { error: 'Forbidden' } };
    }
    parentId = pid;
  } else {
    parentId = null;
  }

  // Create folder metadata in MongoDB only
  if (type === 'folder') {
    const created = await store.add({ name, type: 'folder', parentId, ownerId });

    // Inherit permissions from parent
    if (parentId) {
      const parentPerms = await permsStore.listByFileId(parentId);
      for (const p of parentPerms) {
        await permsStore.upsertByFileAndUser({
          fileId: created.id,
          userId: p.userId,
          read: !!p.read,
          write: !!p.write,
          manage: !!p.manage,
        });
      }
    }

    return { statusCode: 201, body: created };
  }

  // Create file: metadata first, then content in Ex2
  const created = await store.add({ name, type: 'file', parentId, ownerId });

  try {
    const safeContent = encodeContent(content);
    const resp = await send(`post ${created.id} ${safeContent}`);

    if (resp.statusCode === 201) {
      // Inherit permissions from parent
      if (parentId) {
        const parentPerms = await permsStore.listByFileId(parentId);
        for (const p of parentPerms) {
          await permsStore.upsertByFileAndUser({
            fileId: created.id,
            userId: p.userId,
            read: !!p.read,
            write: !!p.write,
            manage: !!p.manage,
          });
        }
      }
      return { statusCode: 201, body: created };
    }

    // Rollback metadata on Ex2 failure
    await store.remove(created.id);

    if (resp.statusCode === 400) {
      return { statusCode: 400, body: { error: 'Bad request' } };
    }
    if (resp.statusCode === 404) {
      return { statusCode: 404, body: { error: 'Not found' } };
    }

    return { statusCode: 500, body: { error: 'Internal server error' } };
  } catch {
    // Rollback metadata on any error
    await store.remove(created.id);
    return { statusCode: 500, body: { error: 'Internal server error' } };
  }
}

// PATCH /api/files/:id - updates metadata and/or content of a file/folder
async function update(userId, id, fields) {
  const item = await store.get(id);
  if (!item) {
    return { statusCode: 404, body: { error: 'File not found' } };
  }

  const hasName = Object.prototype.hasOwnProperty.call(fields, 'name');
  const hasContent = Object.prototype.hasOwnProperty.call(fields, 'content');
  const hasParent = Object.prototype.hasOwnProperty.call(fields, 'parentId');

  if (!hasName && !hasContent && !hasParent) {
    return { statusCode: 400, body: { error: 'Nothing to update' } };
  }
  // Requires write permission if changing name or content
  if (hasName || hasContent) {
    if (!(await canWrite(userId, item))) {
      return { statusCode: 403, body: { error: 'Forbidden' } };
    }
  } else {
    // Only changing parentId (move) - need read permission
    if (!(await canRead(userId, item))) {
      return { statusCode: 403, body: { error: 'Forbidden' } };
    }
  }

  let pendingName = null;
  if (hasName) {
    pendingName = String(fields.name ?? '').trim();
    if (!pendingName) {
      return { statusCode: 400, body: { error: 'Invalid name' } };
    }
  }

  // Handle move (change parentId or per-user mapping)
  if (hasParent) {
    let newParentId = fields.parentId;
    if (
      newParentId === null ||
      newParentId === undefined ||
      String(newParentId).trim() === '' ||
      String(newParentId).trim() === 'null' ||
      String(newParentId).trim() === 'undefined'
    ) {
      newParentId = null;
    } else {
      newParentId = String(newParentId).trim();
    }

    // If target is not root, validate parent folder
    if (newParentId !== null) {
      const parent = await store.get(newParentId);
      if (!parent) {
        return { statusCode: 404, body: { error: 'Parent folder not found' } };
      }
      if (parent.type !== 'folder') {
        return { statusCode: 400, body: { error: 'Parent must be a folder' } };
      }
      // User must be able to write into the target folder
      if (!(await canWrite(userId, parent))) {
        return { statusCode: 403, body: { error: 'Forbidden' } };
      }

      // Prevent moving a folder into one of its descendants
      if (item.type === 'folder') {
        const descendants = await store.getDescendants(item.id);
        const descendantIds = new Set(descendants.map((d) => d.id));
        if (descendantIds.has(newParentId)) {
          return {
            statusCode: 400,
            body: { error: 'Cannot move folder into its own descendant' },
          };
        }
      }
    }

    // Owner moves: change logical parentId in MongoDB
    if (String(userId) === String(item.ownerId)) {
      await store.update(id, { parentId: newParentId });
    } else {
      // Shared user moves: per-user mapping only
      await userTree.setUserParent(userId, item.id, newParentId);
    }
  }

  // Folder: only name can change (no content)
  if (item.type === 'folder') {
    if (hasContent && fields.content !== undefined) {
      return { statusCode: 400, body: { error: 'Cannot update content for folder' } };
    }
    if (pendingName) {
      await store.update(id, { name: pendingName });
    }
    return { statusCode: 204, body: null };
  }

  // File: handle content update via Ex2
  if (hasContent && fields.content !== undefined) {
    const newContent = String(fields.content);
    const safeContent = encodeContent(newContent);

    try {
      // Delete old content then post new
      const delResp = await send(`delete ${item.id}`);
      if (delResp.statusCode === 404) {
        return { statusCode: 404, body: { error: 'File not found' } };
      }
      if (delResp.statusCode !== 204) {
        return { statusCode: 500, body: { error: 'Internal server error' } };
      }

      const postResp = await send(`post ${item.id} ${safeContent}`);
      if (postResp.statusCode !== 201) {
        return { statusCode: 500, body: { error: 'Internal server error' } };
      }

      // Update metadata if name changed, otherwise touch timestamps
      if (pendingName) {
        await store.update(id, { name: pendingName });
      } else {
        await store.touch(id);
      }

      return { statusCode: 204, body: null };
    } catch {
      return { statusCode: 500, body: { error: 'Internal server error' } };
    }
  }

  // Only name changes for file metadata
  if (pendingName) {
    await store.update(id, { name: pendingName });
  }
  return { statusCode: 204, body: null };
}

// DELETE /api/files/:id - deletes a file/folder or just current user's access
async function remove(userId, id) {
  const item = await store.get(id);
  if (!item) {
    return { statusCode: 404, body: { error: 'File not found' } };
  }

  const isOwner = String(userId) === String(item.ownerId);

  // Non-owner - "delete" means: remove this user's access only
  if (!isOwner) {
    if (!(await canRead(userId, item))) {
      return { statusCode: 403, body: { error: 'Forbidden' } };
    }

    // For folders: remove access from this user for all descendants as well
    const targets =
      item.type === 'folder'
        ? [item.id, ...(await store.getDescendants(item.id)).map((c) => c.id)]
        : [item.id];

    for (const fileId of targets) {
      await permsStore.removeByFileAndUser(fileId, userId);
      await userTree.clearUserParent(userId, fileId);
    }

    return { statusCode: 204, body: null };
  }

  // Owner - perform real deletion
  if (!(await canManage(userId, item))) {
    return { statusCode: 403, body: { error: 'Forbidden' } };
  }

  // Folder: recursive delete
  if (item.type === 'folder') {
    const descendants = await store.getDescendants(id);

    // Delete all descendant files from Ex2
    for (const child of descendants) {
      if (child.type === 'file') {
        try {
          const resp = await send(`delete ${child.id}`);
          if (resp.statusCode !== 204) {
            return { statusCode: 500, body: { error: 'Internal server error' } };
          }
        } catch {
          return { statusCode: 500, body: { error: 'Internal server error' } };
        }
      }
    }

    // Remove permissions for descendants + folder
    for (const child of descendants) await permsStore.removeByFileId(child.id);
    await permsStore.removeByFileId(id);

    // Remove from MongoDB: descendants first, then folder
    for (const child of descendants) await store.remove(child.id);
    await store.remove(id);

    // Clear per-user parent mappings
    for (const child of descendants) await userTree.clearFileEverywhere(child.id);
    await userTree.clearFileEverywhere(id);

    return { statusCode: 204, body: null };
  }

  // File: delete from Ex2 then MongoDB + permissions
  try {
    const resp = await send(`delete ${item.id}`);

    if (resp.statusCode === 204) {
      await store.remove(id);
      await permsStore.removeByFileId(id);
      await userTree.clearFileEverywhere(id);
      return { statusCode: 204, body: null };
    }
    if (resp.statusCode === 404) {
      return { statusCode: 404, body: { error: 'File not found' } };
    }
    if (resp.statusCode === 400) {
      return { statusCode: 400, body: { error: 'Bad request' } };
    }
    return { statusCode: 500, body: { error: 'Internal server error' } };
  } catch {
    return { statusCode: 500, body: { error: 'Internal server error' } };
  }
}

// GET /api/files/shared-with-me - lists files shared with the user
async function listSharedWithMe(userId) {
  if (!userId) {
    return { statusCode: 401, body: { error: 'Unauthorized' } };
  }

  const allFiles = await store.listAll();

  const shared = [];
  for (const file of allFiles) {
    if (String(file.ownerId) === String(userId)) continue;
    if (await canRead(userId, file)) shared.push(file);
  }

  const withParent = await withEffectiveParent(userId, shared);

  const enriched = await Promise.all(
    withParent.map(async (file) => {
      const owner = file.ownerId
        ? await usersStore.getUserById(String(file.ownerId))
        : null;

      return {
        ...file,
        ownerName: owner
          ? (owner.displayName || owner.name || owner.username || 'Unknown')
          : 'Unknown',
        lastModified: file.updatedAt || file.createdAt || null,
      };
    })
  );

  return { statusCode: 200, body: enriched };
}


// GET /api/files/recent - files recently modified
async function listRecent(userId) {
  if (!userId) {
    return { statusCode: 401, body: { error: 'Unauthorized' } };
  }

  const all = await store.listAll();

  const readableFiles = [];
  for (const file of all) {
    if (file.type !== 'file') continue;
    if (await canRead(userId, file)) readableFiles.push(file);
  }

  const withParent = await withEffectiveParent(userId, readableFiles);

  const sorted = withParent.sort((a, b) => {
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tb - ta;
  });

  const limited = sorted.slice(0, 50);

  return { statusCode: 200, body: limited };
}

// GET /api/files/:id/path - per-user path (respects userTree)
async function getPath(userId, id) {
  if (!userId) return { statusCode: 401, body: { error: 'Unauthorized' } };

  const start = await store.get(id);
  if (!start) {
    return { statusCode: 404, body: { error: 'File not found' } };
  }
  if (!(await canRead(userId, start))) {
    return { statusCode: 403, body: { error: 'Forbidden' } };
  }

  const path = [];
  const seen = new Set();
  let current = start;

  while (current) {
    if (seen.has(current.id)) break;
    seen.add(current.id);

    const effectiveParentId = await userTree.getUserParent(userId, current);

    path.push({
      id: current.id,
      name: current.name,
      parentId: effectiveParentId ?? null,
    });

    if (!effectiveParentId) break;

    const next = await store.get(effectiveParentId);
    if (!next) break;
    if (!(await canRead(userId, next))) break;

    current = next;
  }

  return { statusCode: 200, body: path.reverse() };
}

module.exports = {
  list,
  listAll,
  get,
  create,
  update,
  remove,
  listSharedWithMe,
  listRecent,
  getPath,
};
