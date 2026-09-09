// Module for managing trashed files in the database

const TrashEntry = require('../models/trashed');

// Check if a file is trashed by a user
async function isTrashed(userId, fileId) {
  if (!userId || !fileId) return false;

  const uid = String(userId);
  const fid = String(fileId);

  const row = await TrashEntry.findOne({ userId: uid, fileId: fid })
    .select({ _id: 1 })
    .lean();

  return !!row;
}

// Get the timestamp  when item was trashed, or null
async function getTrashedAt(userId, fileId) {
  if (!userId || !fileId) return null;

  const uid = String(userId);
  const fid = String(fileId);

  const row = await TrashEntry.findOne({ userId: uid, fileId: fid })
    .select({ trashedAt: 1, _id: 0 })
    .lean();

  return row && typeof row.trashedAt === 'number' ? row.trashedAt : null;
}

// Set or unset a file as trashed for a user
async function setTrashed(userId, fileId, trashed) {
  if (!userId || !fileId) return;

  const uid = String(userId);
  const fid = String(fileId);

  if (trashed) {
    // Keep original trashedAt (do not overwrite) using $setOnInsert
    await TrashEntry.findOneAndUpdate(
      { userId: uid, fileId: fid },
      { $setOnInsert: { userId: uid, fileId: fid, trashedAt: Date.now() } },
      { upsert: true, new: true, runValidators: true }
    ).lean();
  } else {
    await TrashEntry.deleteOne({ userId: uid, fileId: fid });
  }
}

// List all trashed file IDs for a user
async function listTrashedIds(userId) {
  if (!userId) return [];

  const uid = String(userId);

  const rows = await TrashEntry.find({ userId: uid })
    .select({ fileId: 1, _id: 0 })
    .lean();

  return rows.map(r => String(r.fileId));
}

// list [ { id, trashedAt } ... ]
async function listTrashedEntries(userId) {
  if (!userId) return [];

  const uid = String(userId);

  const rows = await TrashEntry.find({ userId: uid })
    .select({ fileId: 1, trashedAt: 1, _id: 0 })
    .lean();

  return rows.map(r => ({ id: String(r.fileId), trashedAt: r.trashedAt }));
}

// Clean up if a file is permanently deleted
async function removeIdEverywhere(fileId) {
  const fid = String(fileId);
  const res = await TrashEntry.deleteMany({ fileId: fid });
  return res.deletedCount || 0;
}

module.exports = {
  isTrashed,
  getTrashedAt,
  setTrashed,
  listTrashedIds,
  listTrashedEntries,
  removeIdEverywhere,
};
