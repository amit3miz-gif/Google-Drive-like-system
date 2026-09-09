const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const requireAuth = require('../middleware/requireAuth');

// POST /api/users
router.post('/', usersController.createUser);

// GET /api/users/me  (current logged-in user)
router.get('/me', requireAuth, usersController.getMe);

// GET /api/users/by-username/:username
router.get('/by-username/:username', requireAuth, usersController.getByUsername);

// GET /api/users/:id
router.get('/:id', requireAuth, usersController.getUserById);




module.exports = router;
