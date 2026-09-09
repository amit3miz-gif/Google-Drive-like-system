const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search');

// GET /api/search/:query
router.get('/:query', searchController.search);

module.exports = router;
