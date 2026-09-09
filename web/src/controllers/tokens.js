// gets a HTTP request, call service, return accurate response

const tokensService = require('../services/tokens');

const { sendJson } = require('./response');

// POST /api/tokens
async function createToken(req, res, next) {
    try {
        const { username, password } = req.body || {};
        const result = await tokensService.login(username, password);
        return sendJson(res, result.statusCode, result.body);
    } catch (err) {
        return next(err);
    }
}

module.exports = { createToken };