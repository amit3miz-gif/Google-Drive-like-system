const filesStore = require('../store/files');
const usersStore = require('../store/users');
const permsStore = require('../store/permissions');
const userTree = require('../store/userTree');

// Helper functions to check permissions
async function canRead(userId, file) {
  if (!userId || !file) return false;
  if (String(file.ownerId) === String(userId)) return true;
  const p = await permsStore.findByFileAndUser(file.id, userId);
  return !!(p && (p.read || p.write || p.manage));
}

async function canWrite(userId, file) {
  if (!userId || !file) return false;
  if (String(file.ownerId) === String(userId)) return true;
  const p = await permsStore.findByFileAndUser(file.id, userId);
  return !!(p && (p.write || p.manage));
}

async function canManage(userId, file) {
  if (!userId || !file) return false;
  if (String(file.ownerId) === String(userId)) return true;
  const p = await permsStore.findByFileAndUser(file.id, userId);
  return !!(p && p.manage);
}

// Returns [fileId, ...allDescendantsIds]
async function getTargetsForPropagation(file) {
  const descendants = await filesStore.getDescendants(file.id);
  return [file.id, ...descendants.map(x => x.id)];
}

// GET /api/files/:id/permissions - lists all permissions for a file/folder
async function listFilePermissions(currentUserId, fileId) {
  const file = await filesStore.get(fileId);
  if (!file) return { statusCode: 404, body: { error: 'File not found' } };

  if (!(await canRead(currentUserId, file))) {
    return { statusCode: 403, body: { error: 'Forbidden' } };
  }

  // Include owner entry
  const ownerEntry = {
    pId: null,
    fileId,
    userId: file.ownerId,
    read: true,
    write: true,
    manage: true,
    role: 'owner',
  };

  // Only managers/owners see all permissions
  if (await canManage(currentUserId, file)) {
    const shared = await permsStore.listByFileId(fileId);
    return { statusCode: 200, body: [ownerEntry, ...shared] };
  }

  // regular readers see only their own permission (if any) + owner entry
  const myPerm = await permsStore.findByFileAndUser(fileId, currentUserId);
  return { statusCode: 200, body: myPerm ? [ownerEntry, myPerm] : [ownerEntry] };
}

// POST /api/files/:id/permissions - creates a new permission for a file/folder
async function addPermission(currentUserId, fileId, payload) {
  const file = await filesStore.get(fileId);
  if (!file) return { statusCode: 404, body: { error: 'File not found' } };

  if (!(await canManage(currentUserId, file))) {
    return { statusCode: 403, body: { error: 'Forbidden' } };
  }

  const { userId, read, write, manage } = payload || {};
  if (typeof userId !== 'string' || !userId.trim()) {
    return { statusCode: 400, body: { error: 'Invalid userId' } };
  }

  const targetUser = await usersStore.getUserById(userId.trim());
  if (!targetUser) {
    return { statusCode: 404, body: { error: 'User not found' } };
  }

  if (userId.trim() === file.ownerId) {
    return { statusCode: 400, body: { error: 'Owner already has full permissions' } };
  }

  if (!(read || write || manage)) {
    return { statusCode: 400, body: { error: 'At least one permission flag is required' } };
  }

  // Check for existing permission
  const existing = await permsStore.findByFileAndUser(fileId, userId.trim());
  if (existing) {
    return { statusCode: 400, body: { error: 'Permission already exists for this user' } };
  }

  // 1) add permission to the specific file
  const created = await permsStore.add({
    fileId,
    userId: userId.trim(),
    read: !!read,
    write: !!write,
    manage: !!manage,
  });

  // also set userTree override to disconnect from logical parent
  await userTree.setUserParent(userId.trim(), fileId, null);

  // 2) propagate to all descendants (each gets its OWN pId)
  const targets = (await getTargetsForPropagation(file)).filter(id => id !== fileId);
  for (const childId of targets) {
    // upsert = override children to match parent
    await permsStore.upsertByFileAndUser({
      fileId: childId,
      userId: userId.trim(),
      read: !!read,
      write: !!write,
      manage: !!manage,
    });
  }

  return { statusCode: 201, body: created };
}

// PATCH /api/files/:id/permissions/:pId - updates an existing permission
async function updatePermission(currentUserId, fileId, permId, fields) {
  const file = await filesStore.get(fileId);
  if (!file) return { statusCode: 404, body: { error: 'File not found' } };

  if (!(await canManage(currentUserId, file))) {
    return { statusCode: 403, body: { error: 'Forbidden' } };
  }

  const perm = await permsStore.getById(permId);
  if (!perm || perm.fileId !== fileId) {
    return { statusCode: 404, body: { error: 'Permission not found' } };
  }

  const hasAny =
    fields &&
    (Object.prototype.hasOwnProperty.call(fields, 'read') ||
    Object.prototype.hasOwnProperty.call(fields, 'write') ||
    Object.prototype.hasOwnProperty.call(fields, 'manage'));

  if (!hasAny) {
    return { statusCode: 400, body: { error: 'Nothing to update' } };
  }

  // Update the permission on the parent item
  const updated = await permsStore.update(permId, fields);

  // After update(), flags are normalized in store
  const { userId, read, write, manage } = updated;

  // Propagate override to all descendants
  const targets = (await getTargetsForPropagation(file)).filter(id => id !== fileId);
  for (const childId of targets) {
    await permsStore.upsertByFileAndUser({
      fileId: childId,
      userId,
      read,
      write,
      manage,
    });
  }

  return { statusCode: 204, body: null };
}

// DELETE /api/files/:id/permissions/:pId - deletes a permission for a file/folder
async function deletePermission(currentUserId, fileId, permId) {
  const file = await filesStore.get(fileId);
  if (!file) return { statusCode: 404, body: { error: 'File not found' } };

  if (!(await canManage(currentUserId, file))) {
    return { statusCode: 403, body: { error: 'Forbidden' } };
  }

  const perm = await permsStore.getById(permId);
  if (!perm || perm.fileId !== fileId) {
    return { statusCode: 404, body: { error: 'Permission not found' } };
  }

  // remove from THIS item
  await permsStore.remove(permId);

  // remove from all descendants (override behavior)
  const targets = (await getTargetsForPropagation(file)).filter(id => id !== fileId);
  for (const childId of targets) {
    await permsStore.removeByFileAndUser(childId, perm.userId);
  }

  return { statusCode: 204, body: null };
}

module.exports = {
  listFilePermissions,
  addPermission,
  updatePermission,
  deletePermission,
  canRead,
  canWrite,
  canManage,
};
