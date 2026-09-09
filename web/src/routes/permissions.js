const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access parent route params

const permissionsController = require('../controllers/permissions');

router.route('/')
    .get(permissionsController.listPermissions)
    .post(permissionsController.createPermission);

router.route('/:pId')
    .patch(permissionsController.patchPermission)
    .delete(permissionsController.deletePermission);

module.exports = router;
