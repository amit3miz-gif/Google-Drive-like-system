const fileService = require('../services/files');
const userStore = require('../store/users');
const starredStore = require('../store/starred');
const trashStore = require('../store/trashed');

const { sendJson } = require('./response');
const store = require('../store/files');
const userTree = require('../store/userTree');

/**
 * Treat item as "in trash" if:
 * - item itself is trashed for this user, OR
 * - any of its EFFECTIVE parents (per userTree) is trashed (recursive)
 */
async function isEffectivelyTrashed(userId, item) {
  if (!userId || !item) return false;
  if (await trashStore.isTrashed(userId, item.id)) return true;

  const seen = new Set();
  let cur = item;

  while (true) {
    const pid = await userTree.getUserParent(userId, cur); // per-user parent
    if (!pid) break;
    if (seen.has(pid)) break;
    seen.add(pid);

    if (await trashStore.isTrashed(userId, pid)) return true;

    cur = await store.get(pid);
    if (!cur) break;
  }

  return false;
}

// Async helper: keep only items that are NOT effectively trashed
async function filterNotTrashed(userId, items) {
  const out = [];
  for (const it of items) {
    if (!(await isEffectivelyTrashed(userId, it))) out.push(it);
  }
  return out;
}

// helper: add ownerName + lastModified (for list columns)
async function enrichListItemForUser(userId, it) {
  const owner = it.ownerId ? await userStore.getUserById(String(it.ownerId)) : null;

  const ownerLabel = owner
    ? (String(owner.id) === String(userId)
        ? 'Me'
        : (owner.displayName || owner.name || owner.username || 'Unknown'))
    : 'Unknown';

  return {
    ...it,
    ownerName: ownerLabel,
    lastModified: it.updatedAt || it.createdAt || null,
  };
}

// Add `starred` boolean per item for current user
async function attachStarred(userId, items) {
  if (!userId) return (items || []).map(it => ({ ...it, starred: false }));

  const starredIds = new Set(await starredStore.listStarredIds(userId));

  return (items || []).map(it => ({
    ...it,
    starred: starredIds.has(String(it.id)),
  }));
}



// GET /api/files?parentId=...  (root if parentId omitted)
// optional: GET /api/files?q=...  (local name filtering on listAll)
async function listFiles(req, res, next) {
  try {
    const userId = req.currentUser?.id;

    const qRaw = req.query?.q;
    const q = typeof qRaw === "string" ? qRaw.trim().toLowerCase() : "";

    // Normalize parentId: treat undefined / null / "" / "null" / "undefined" as root (null)
    const parentIdRaw = req.query?.parentId;
    let parentId = null;

    if (
      parentIdRaw !== undefined &&
      parentIdRaw !== null &&
      String(parentIdRaw).trim() !== "" &&
      String(parentIdRaw).trim() !== "null" &&
      String(parentIdRaw).trim() !== "undefined"
    ) {
      parentId = String(parentIdRaw).trim();
    }

    const result = q
      ? await fileService.listAll(userId)
      : await fileService.list(userId, parentId);

    if (result.statusCode !== 200) {
      return sendJson(res, result.statusCode, result.body);
    }

    const allItems = Array.isArray(result.body) ? result.body : [];

    // hide items that are effectively trashed (self or parent)
    let visible = await filterNotTrashed(userId, allItems);

    // optional name filter
    if (q) {
      visible = visible.filter(item =>
        String(item.name || "").toLowerCase().includes(q)
      );
    }

    // enrich ownerName + lastModified (for list columns)
    const enriched = await Promise.all(
      visible.map(it => enrichListItemForUser(userId, it))
    );

    const withStarred = await attachStarred(userId, enriched);
    return sendJson(res, 200, withStarred);
  } catch (err) {
    return next(err);
  }
}

// GET /api/files/:id
async function getFileById(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return sendJson(res, 400, { error: 'Invalid id' });

    const userId = req.currentUser?.id;

    // first: verify exists & permissions via service
    const result = await fileService.get(userId, id);
    if (result.statusCode !== 200) {
      return sendJson(res, result.statusCode, result.body);
    }

    // then: hide existence if effectively trashed
    if (await isEffectivelyTrashed(userId, result.body)) {
      return sendJson(res, 404, { error: 'File not found' });
    }

    const starred = await starredStore.isStarred(userId, id);
    return sendJson(res, 200, { ...result.body, starred });
  } catch (err) {
    return next(err);
  }
}

// POST /api/files
async function createFile(req, res, next) {
  try {
    const { name, content, type, parentId } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendJson(res, 400, { error: 'Name is required' });
    }

    const fileType = type || 'file';
    if (fileType !== 'file' && fileType !== 'folder') {
      return sendJson(res, 400, { error: 'Invalid type' });
    }

    if (fileType === 'file' && typeof content !== 'string') {
      return sendJson(res, 400, { error: 'Content is required' });
    }

    const ownerId = req.currentUser?.id;

    // Normalize parentId: treat undefined / null / "" / "null" / "undefined" as no parent
    let normalizedParentId = null;

    if (
      parentId !== undefined &&
      parentId !== null &&
      String(parentId).trim() !== "" &&
      String(parentId).trim() !== "null" &&
      String(parentId).trim() !== "undefined"
    ) {
      normalizedParentId = String(parentId).trim();
    }

    if (normalizedParentId !== null) {
      // verify parent exists + permissions
      const pRes = await fileService.get(ownerId, normalizedParentId);
      if (pRes.statusCode !== 200) {
        return sendJson(res, 404, { error: "Parent not found" });
      }

      const parentItem = pRes.body;
      if (parentItem?.type !== "folder") {
        return sendJson(res, 400, { error: "Parent must be a folder" });
      }

      // block creating inside trashed folder (directly trashed or parent trashed)
      if (await isEffectivelyTrashed(ownerId, parentItem)) {
        return sendJson(res, 409, { error: 'Cannot create inside a trashed folder' });
      }
    }

    const result = await fileService.create({
      name: name.trim(),
      type: fileType,
      content,
      parentId: normalizedParentId || null,
      ownerId,
    });

    if (result.statusCode === 201) {
      if (result.body?.id) res.location(`/api/files/${result.body.id}`);
      return res.status(201).end();
    }

    return sendJson(res, result.statusCode, result.body);
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/files/:id
async function updateFileById(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return sendJson(res, 400, { error: 'Invalid id' });

    const { name, content, parentId } = req.body || {};

    const hasName = name !== undefined;
    const hasContent = content !== undefined;
    const hasParent = parentId !== undefined;

    if (!hasName && !hasContent && !hasParent) {
      return sendJson(res, 400, { error: 'Nothing to update' });
    }

    if (hasName && (typeof name !== 'string' || !name.trim())) {
      return sendJson(res, 400, { error: 'Invalid name' });
    }
    if (hasContent && typeof content !== 'string') {
      return sendJson(res, 400, { error: 'Invalid content' });
    }

    // Normalize parentId
    let normalizedParentId = parentId;
    if (hasParent) {
      if (
        parentId === null ||
        parentId === undefined ||
        String(parentId).trim() === '' ||
        String(parentId).trim() === 'null' ||
        String(parentId).trim() === 'undefined'
      ) {
        normalizedParentId = null;
      } else {
        normalizedParentId = String(parentId).trim();
      }

      // prevent moving folder into itself
      if (normalizedParentId !== null && normalizedParentId === id) {
        return sendJson(res, 400, { error: "Cannot move folder into itself" });
      }
    }

    const userId = req.currentUser?.id;

    // Parent exists + not trashed (effective)
    if (hasParent && normalizedParentId !== null) {
      const pRes = await fileService.get(userId, normalizedParentId);
      if (pRes.statusCode !== 200) {
        return sendJson(res, 404, { error: "Parent not found" });
      }

      const parentItem = pRes.body;
      if (await isEffectivelyTrashed(userId, parentItem)) {
        return sendJson(res, 409, { error: "Cannot move into a trashed folder" });
      }
    }

    const fields = {};
    if (hasName) fields.name = name.trim();
    if (hasContent) fields.content = content;
    if (hasParent) fields.parentId = normalizedParentId;

    const result = await fileService.update(userId, id, fields);

    if (result.statusCode === 204) return res.status(204).end();
    return sendJson(res, result.statusCode, result.body);
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/files/:id  (permanent)
async function deleteFileById(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return sendJson(res, 400, { error: 'Invalid id' });

    const userId = req.currentUser?.id;

    // Fetch item before deletion to know if owner and whether it's a folder
    const item = await store.get(id);
    if (!item) return sendJson(res, 404, { error: 'File not found' });

    const isOwner = String(userId) === String(item.ownerId);

    // Determine cleanup targets (folder - include descendants)
    const targets =
      item.type === 'folder'
        ? [id, ...(await store.getDescendants(id)).map((c) => c.id)]
        : [id];

    const result = await fileService.remove(userId, id);

    if (result.statusCode === 204) {
      if (isOwner) {
        // Real deletion: remove Star/Trash for everyone
        for (const fid of targets) {
          await trashStore.removeIdEverywhere(fid);
          await starredStore.removeIdEverywhere(fid);
        }
      } else {
        // Access removed only for this user: remove Star/Trash only for this user
        for (const fid of targets) {
          await trashStore.setTrashed(userId, fid, false);
          await starredStore.setStarred(userId, fid, false);
        }
      }

      return res.status(204).end();
    }

    return sendJson(res, result.statusCode, result.body);
  } catch (err) {
    return next(err);
  }
}

// GET /api/files/shared-with-me
async function listSharedWithMe(req, res, next) {
  try {
    const userId = req.currentUser?.id;
    const result = await fileService.listSharedWithMe(userId);

    if (result.statusCode !== 200) {
      return sendJson(res, result.statusCode, result.body);
    }

    const items = Array.isArray(result.body) ? result.body : [];
    const visible = await filterNotTrashed(userId, items);

    const enriched = await Promise.all(
      visible.map(it => enrichListItemForUser(userId, it))
    );

    const withStarred = await attachStarred(userId, enriched);
    return sendJson(res, 200, withStarred);
  } catch (err) {
    return next(err);
  }
}


// GET /api/files/recent
async function listRecentFiles(req, res, next) {
  try {
    const userId = req.currentUser?.id;
    const result = await fileService.listRecent(userId);

    if (result.statusCode !== 200) {
      return sendJson(res, result.statusCode, result.body);
    }

    const items = Array.isArray(result.body) ? result.body : [];
    const visible = await filterNotTrashed(userId, items);

    const enriched = await Promise.all(
      visible.map(it => enrichListItemForUser(userId, it))
    );

    const withStarred = await attachStarred(userId, enriched);
    return sendJson(res, 200, withStarred);
  } catch (err) {
    return next(err);
  }
}

// GET /api/files/starred
async function listStarredFiles(req, res, next) {
  try {
    const userId = req.currentUser?.id;
    if (!userId) return sendJson(res, 401, { error: 'Unauthorized' });

    const result = await fileService.listAll(userId);

    if (result.statusCode !== 200) {
      return sendJson(res, result.statusCode, result.body);
    }

    const allItems = Array.isArray(result.body) ? result.body : [];
    const starredIds = new Set(await starredStore.listStarredIds(userId));

    const candidates = allItems.filter(item => starredIds.has(String(item.id)));
    const visible = await filterNotTrashed(userId, candidates);
    const starredItems = await Promise.all(
      visible.map(it => enrichListItemForUser(userId, it))
    );

    const withStarred = (starredItems || []).map(it => ({ ...it, starred: true }));
    return sendJson(res, 200, withStarred);
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/files/:id/star
async function setStarForFile(req, res, next) {
  try {
    const userId = req.currentUser?.id;
    if (!userId) return sendJson(res, 401, { error: 'Unauthorized' });

    const id = String(req.params.id || '').trim();
    if (!id) return sendJson(res, 400, { error: 'Invalid id' });

    const { starred } = req.body || {};
    if (typeof starred !== 'boolean') {
      return sendJson(res, 400, { error: 'starred must be boolean' });
    }

    // verify exists & user can access it
    const getRes = await fileService.get(userId, id);
    if (getRes.statusCode !== 200) {
      return sendJson(res, getRes.statusCode, getRes.body);
    }

    // block changing star status while in trash (including parent)
    if (await isEffectivelyTrashed(userId, getRes.body)) {
      return sendJson(res, 409, { error: 'Cannot change star status while in trash' });
    }

    await starredStore.setStarred(userId, id, starred);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

// GET /api/files/trash
async function listTrashFiles(req, res, next) {
  try {
    const userId = req.currentUser?.id;
    if (!userId) return sendJson(res, 401, { error: 'Unauthorized' });

    const result = await fileService.listAll(userId);
    if (result.statusCode !== 200) {
      return sendJson(res, result.statusCode, result.body);
    }

    const allItems = Array.isArray(result.body) ? result.body : [];
    const trashedIds = new Set(await trashStore.listTrashedIds(userId));

    // show only items directly trashed by the user
    const trashedItems = [];
    for (const it of allItems) {
      if (!trashedIds.has(String(it.id))) continue;

      const base = await enrichListItemForUser(userId, it);
      const trashedAt = await trashStore.getTrashedAt(userId, it.id);

      trashedItems.push({ ...base, trashedAt });
    }

    return sendJson(res, 200, trashedItems);
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/files/:id/trash
async function setTrashForFile(req, res, next) {
  try {
    const userId = req.currentUser?.id;
    if (!userId) return sendJson(res, 401, { error: 'Unauthorized' });

    const id = String(req.params.id || '').trim();
    if (!id) return sendJson(res, 400, { error: 'Invalid id' });

    const { trashed } = req.body || {};
    if (typeof trashed !== 'boolean') {
      return sendJson(res, 400, { error: 'trashed must be boolean' });
    }

    // verify exists & user can access it
    const getRes = await fileService.get(userId, id);
    if (getRes.statusCode !== 200) {
      return sendJson(res, getRes.statusCode, getRes.body);
    }

    // prevent restoring child while parent is trashed (per-user, using userTree)
    if (trashed === false) {
      const effectiveParentId = await userTree.getUserParent(userId, getRes.body);

      if (effectiveParentId) {
        const parentItem = await store.get(effectiveParentId);

        if (parentItem && (await isEffectivelyTrashed(userId, parentItem))) {
          return sendJson(res, 409, {
            error: 'Cannot restore while parent folder is in trash',
          });
        }
      }
    }

    await trashStore.setTrashed(userId, id, trashed);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

// GET /api/files/:id/path
async function getFilePath(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return sendJson(res, 400, { error: "Invalid id" });

    const userId = req.currentUser?.id;
    const result = await fileService.getPath(userId, id);

    return sendJson(res, result.statusCode, result.body);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listFiles,
  getFileById,
  createFile,
  updateFileById,
  deleteFileById,
  listSharedWithMe,
  listRecentFiles,
  listStarredFiles,
  setStarForFile,
  listTrashFiles,
  setTrashForFile,
  getFilePath,
};
