const UserTree = require('../models/userTree');

// Get effective parent for user (fallback to logical parent)
async function getUserParent(userId, file) {
  if (!file) return null;
  if (!userId) return file.parentId ?? null;

  const mapping = await UserTree.findOne({
    userId: String(userId),
    fileId: String(file.id),
  })
    .select({ parentId: 1, _id: 0 })
    .lean();

  // if mapping exists, return mapping.parentId even if it's null (root)
  if (mapping) return mapping.parentId ?? null;

  return file.parentId ?? null;
}


// Set / override parent for a user (upsert due to unique index)
async function setUserParent(userId, fileId, parentId) {
  let normalized = parentId;

  if (
    normalized === null ||
    normalized === undefined ||
    String(normalized).trim() === '' ||
    String(normalized).trim() === 'null' ||
    String(normalized).trim() === 'undefined'
  ) {
    normalized = null;
  } else {
    normalized = String(normalized).trim();
  }

  const result = await UserTree.findOneAndUpdate(
    { userId: String(userId), fileId: String(fileId) },
    {
      $set: { parentId: normalized },
      $setOnInsert: { userId: String(userId), fileId: String(fileId) },
    },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  return result;
}

// Remove mapping (e.g. on unshare / delete)
async function clearUserParent(userId, fileId) {
  const result = await UserTree.deleteOne({
    userId: String(userId),
    fileId: String(fileId),
  });
  return result.deletedCount === 1;
}

// Remove file from all users
async function clearFileEverywhere(fileId) {
  const result = await UserTree.deleteMany({ fileId: String(fileId) });
  return result.deletedCount;
}

// Remove folder tree from all users
async function clearFolderTreeEverywhere(rootId, descendantIds = []) {
  const allIds = [String(rootId), ...descendantIds.map((id) => String(id))];
  const result = await UserTree.deleteMany({ fileId: { $in: allIds } });
  return result.deletedCount;
}

// List fileIds that this user mapped directly under a given parentId (including null/root)
async function listFileIdsByUserAndParent(userId, parentId) {
  const uid = String(userId);

  let pid = parentId;
  if (
    pid === null ||
    pid === undefined ||
    String(pid).trim() === '' ||
    String(pid).trim() === 'null' ||
    String(pid).trim() === 'undefined'
  ) {
    pid = null;
  } else {
    pid = String(pid).trim();
  }

  const rows = await UserTree.find({ userId: uid, parentId: pid })
    .select({ fileId: 1, _id: 0 })
    .lean();

  return rows.map((r) => String(r.fileId));
}


module.exports = {
  getUserParent,
  setUserParent,
  clearUserParent,
  clearFileEverywhere,
  clearFolderTreeEverywhere,
  listFileIdsByUserAndParent,
};