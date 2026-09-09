// Identifies the current user (if any) for every incoming request.
// attaches info to req.currentUser and req.token (does NOT block requests)

const usersService = require('../services/users');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt'); // web/config/jwt.js
const { sendJson } = require('../controllers/response');

// extract token from request headers (support multiple header names to be robust)
function getTokenFromHeaders(req) {
    const auth = req.headers.authorization;
    if (auth && typeof auth === 'string') {
        const m = auth.match(/^Bearer\s+(.+)$/i);
        if (m && m[1]) return m[1].trim();
    }
    return null;
}

// Remove sensative password related fields before attaching user to req
function toPublicUser(user) {
  if (!user) return null;

  const {
    passwordHash,
    passwordSalt,
    passwordIterations,
    passwordDigest,
    pictureId,
    pictureData,
    pictureContentType,
    ...publicUser
  } = user;

  return publicUser;
}



// the middleware
async function currentUser(req, res, next) {
    // default values
    req.currentUser = null;
    req.token = null;
    req.jwt = null;

    // read token from headers
    const token = getTokenFromHeaders(req);
    if (!token) {
        // if no token - not logged in, but request may still be public
        return next();
    }
    let decoded; // decoded token payload
    try {
        // verifies signature + checks exp automatically
        decoded = jwt.verify(token, jwtConfig.secret);
    } catch (err) {
        return sendJson(res, 401, { error: 'Invalid or expired token' });
    }

    const userId = decoded && decoded.userId;
    if (!userId) {
        return sendJson(res, 401, { error: 'Invalid token payload' });
    }

    const user = await usersService.getUserById(userId);
    if (!user) {
        // User not found (e.g., deleted)
        return sendJson(res, 401, { error: 'User not found' });
    }

    // Attach to request for downstream handlers/controllers
    req.token = token;
    req.jwt = decoded;
    req.currentUser = toPublicUser(user);

    return next();
}

module.exports = currentUser;