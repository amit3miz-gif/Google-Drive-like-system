const { randomUUID } = require('crypto');
const Permission = require('../models/permissions');

// Normalizes permission flags according to the hierarchy: manage > write > read
function normalize(read = false, write = false, manage = false) {
  const m = !!manage;
  const w = m || !!write;
  const r = w || !!read;
  return { read: r, write: w, manage: m };
}

// Adds a new permission
async function add({ fileId, userId, read = false, write = false, manage = false }) {
  const pId = randomUUID();
  const { read: normRead, write: normWrite, manage: normManage } = normalize(read, write, manage);

  const perm = new Permission({
    pId,
    fileId: String(fileId),
    userId: String(userId),
    read: normRead,
    write: normWrite,
    manage: normManage,
  });

  await perm.save();
  return perm.toObject();
}

// Lists all permissions for a given fileId
async function listByFileId(fileId) {
  return await Permission.find({ fileId: String(fileId) }).lean();
}

// Gets a permission by its id
async function getById(pId) {
  return await Permission.findOne({ pId: String(pId) }).lean();
}

// Finds a permission by fileId and userId
async function findByFileAndUser(fileId, userId) {
  return await Permission.findOne({ fileId: String(fileId), userId: String(userId) }).lean();
}

// Updates fields of an existing permission
async function update(pId, fields) {
  const perm = await Permission.findOne({ pId: String(pId) });
  if (!perm) return null;

  // Update only provided fields
  if (Object.prototype.hasOwnProperty.call(fields, 'read')) perm.read = !!fields.read;
  if (Object.prototype.hasOwnProperty.call(fields, 'write')) perm.write = !!fields.write;
  if (Object.prototype.hasOwnProperty.call(fields, 'manage')) perm.manage = !!fields.manage;

  // Normalize after updates
  const normalized = normalize(perm.read, perm.write, perm.manage);
  perm.read = normalized.read;
  perm.write = normalized.write;
  perm.manage = normalized.manage;

  await perm.save();
  return perm.toObject();
}

// Removes a permission by its id
async function remove(pId) {
  const result = await Permission.deleteOne({ pId: String(pId) });
  return result.deletedCount === 1;
}

// Removes all permissions for a given fileId
async function removeByFileId(fileId) {
  const result = await Permission.deleteMany({ fileId: String(fileId) });
  return result.deletedCount;
}

// Upserts a permission by fileId and userId
async function upsertByFileAndUser({ fileId, userId, read = false, write = false, manage = false }) {
  const fid = String(fileId);
  const uid = String(userId);
  const { read: normRead, write: normWrite, manage: normManage } = normalize(read, write, manage);

  const result = await Permission.findOneAndUpdate(
    { fileId: fid, userId: uid }, // filter
    {
      $set: { read: normRead, write: normWrite, manage: normManage },
      $setOnInsert: { pId: randomUUID(), fileId: fid, userId: uid },
    },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  return result;
}

// Removes a permission by fileId and userId
async function removeByFileAndUser(fileId, userId) {
  const result = await Permission.deleteOne({ fileId: String(fileId), userId: String(userId) });
  return result.deletedCount === 1;
}

module.exports = {
  normalize,
  add,
  listByFileId,
  getById,
  findByFileAndUser,
  update,
  remove,
  removeByFileId,
  upsertByFileAndUser,
  removeByFileAndUser,
};
