const permissionsService = require('../services/permissions');

const { sendJson } = require('./response');

// GET /api/files/:id/permissions - lists all permissions for a file/folder
async function listPermissions(req, res, next) {
    try {
        const fileId = String(req.params.id || '').trim();
        if (!fileId) return sendJson(res, 400, { error: 'Invalid id' });
        const userId = req.currentUser?.id;

        const result = await permissionsService.listFilePermissions(userId, fileId);
        return sendJson(res, result.statusCode, result.body);
    } catch (err) {
        return next(err);
    }
}

// POST /api/files/:id/permissions - creates a new permission for a file/folder
async function createPermission(req, res, next) {
    try {
        const fileId = String(req.params.id || '').trim();
        if (!fileId) return sendJson(res, 400, { error: 'Invalid id' });
        const userId = req.currentUser?.id;

        const result = await permissionsService.addPermission(userId, fileId, req.body);

        if (result.statusCode === 201) {
            res.location(`/api/files/${fileId}/permissions/${result.body.pId}`);
            return res.status(201).end();
        }

        return sendJson(res, result.statusCode, result.body);
    } catch (err) {
        return next(err);
    }
}

// PATCH /api/files/:id/permissions/:pId - updates an existing permission
async function patchPermission(req, res, next) {
    try {
        const fileId = String(req.params.id || '').trim();
        const pId = String(req.params.pId || '').trim();
        if (!fileId) return sendJson(res, 400, { error: 'Invalid id' });
        if (!pId) return sendJson(res, 400, { error: 'Invalid permission id' });
        const userId = req.currentUser?.id;

        const result = await permissionsService.updatePermission(userId, fileId, pId, req.body);

        if (result.statusCode === 204) return res.status(204).end();
        return sendJson(res, result.statusCode, result.body);
    } catch (err) {
        return next(err);
    }
}

// DELETE /api/files/:id/permissions/:pId - deletes a permission for a file/folder
async function deletePermission(req, res, next) {
    try {
        const fileId = String(req.params.id || '').trim();
        const pId = String(req.params.pId || '').trim();
        if (!fileId) return sendJson(res, 400, { error: 'Invalid id' });
        if (!pId) return sendJson(res, 400, { error: 'Invalid permission id' });
        const userId = req.currentUser?.id;

        const result = await permissionsService.deletePermission(userId, fileId, pId);

        if (result.statusCode === 204) return res.status(204).end();
        return sendJson(res, result.statusCode, result.body);
    } catch (err) {
        return next(err);
    }
}

module.exports = { listPermissions, createPermission, patchPermission, deletePermission };
