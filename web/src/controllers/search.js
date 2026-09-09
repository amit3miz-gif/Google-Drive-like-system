const searchService = require('../services/search');
const trashStore = require('../store/trashed');
const store = require('../store/files');
const userStore = require('../store/users');
const userTree = require("../store/userTree");

const { sendJson } = require('./response');

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
    // per-user parent (fallbacks to logical parent if no override)
    const pid = await userTree.getUserParent(userId, cur);
    if (!pid) break;

    if (seen.has(pid)) break;
    seen.add(pid);

    if (await trashStore.isTrashed(userId, pid)) return true;

    // walk up in Mongo
    cur = await store.get(pid);
    if (!cur) break;
  }

  return false;
}

// optional enrichment for columns (Owner / Date Modified)
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


async function search(req, res) {
  try {
    const query = String(req.params.query || '').trim();
    const userId = req.currentUser?.id;

    if (!query) return sendJson(res, 200, []);

    const results = await searchService.searchFiles(userId, query);
    const arr = Array.isArray(results) ? results : [];

    // async filtering and enrichment
    const safeResults = [];
    for (const item of arr) {
      if (await isEffectivelyTrashed(userId, item)) continue;

      const effectiveParentId = await userTree.getUserParent(userId, item);

      safeResults.push(
        await enrichListItemForUser(userId, {
          ...item,
          parentId: effectiveParentId ?? null,
        })
      );
    }

    return sendJson(res, 200, safeResults);
  } catch (err) {
    const status = err.status || 500;
    return sendJson(res, status, { error: err.message });
  }
}

module.exports = {
  search,
};
