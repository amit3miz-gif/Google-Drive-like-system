// Module for managing starred files in the database

const StarEntry = require('../models/starred');

// Check if a file is starred by a user
async function isStarred(userId, fileId) {
  if (!userId || !fileId) return false;

  const uid = String(userId);
  const fid = String(fileId);

  const row = await StarEntry.findOne({ userId: uid, fileId: fid })
    .select({ _id: 1 })
    .lean();

  return !!row;
}

// Set or unset a file as starred for a user
async function setStarred(userId, fileId, starred) {
  if (!userId || !fileId) return;

  const uid = String(userId);
  const fid = String(fileId);

  if (starred) {
    // Upsert to avoid duplicates (unique index userId+fileId)
    await StarEntry.findOneAndUpdate(
      { userId: uid, fileId: fid },
      { $setOnInsert: { userId: uid, fileId: fid } },
      { upsert: true, new: true, runValidators: true }
    ).lean();
  } else {
    await StarEntry.deleteOne({ userId: uid, fileId: fid });
  }
}

// List all starred file IDs for a user
async function listStarredIds(userId) {
  if (!userId) return [];

  const uid = String(userId);

  const rows = await StarEntry.find({ userId: uid })
    .select({ fileId: 1, _id: 0 })
    .lean();

  return rows.map(r => String(r.fileId));
}

// Clean up if a file is permanently deleted
async function removeIdEverywhere(fileId) {
  const fid = String(fileId);
  const res = await StarEntry.deleteMany({ fileId: fid });
  return res.deletedCount || 0;
}

module.exports = {
  isStarred,
  setStarred,
  listStarredIds,
  removeIdEverywhere,
};
