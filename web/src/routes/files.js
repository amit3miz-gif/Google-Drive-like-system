const express = require('express')
const router = express.Router()

// Import the files controller
const filesController = require('../controllers/files')

// Import and mount the permissions routes
const permissionsRoutes = require('./permissions');

// Starred routes
router.get('/starred', filesController.listStarredFiles);
router.patch('/:id/star', filesController.setStarForFile);

// Trash routes
router.get('/trash', filesController.listTrashFiles);
router.patch('/:id/trash', filesController.setTrashForFile);

// Routes for /api/files
router.route('/')
    .get(filesController.listFiles)
    .post(filesController.createFile)

// Routes for /api/files/shared-with-me
router.get('/shared-with-me', filesController.listSharedWithMe);

// Routes for /api/files/recent
router.get("/recent", filesController.listRecentFiles);

// Route for /api/files/:id/path
router.get("/:id/path", filesController.getFilePath);

// Routes for /api/files/:id
router.route('/:id')
    .get(filesController.getFileById)
    .patch(filesController.updateFileById)
    .delete(filesController.deleteFileById)

router.use('/:id/permissions', permissionsRoutes);

module.exports = router
