const express = require('express')
const router = express.Router()

// Import the tokens controller
const tokensController = require('../controllers/tokens');

// POST /api/tokens
router.post('/', tokensController.createToken);

module.exports = router;
