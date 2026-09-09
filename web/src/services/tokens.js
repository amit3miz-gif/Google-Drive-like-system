// login logic - returns JWT

const usersStore = require('../store/users');
const { verifyPassword } = require('./password');

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

async function login(username, password) {
  // validate request
  if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
    return {
      statusCode: 400,
      body: { error: 'username and password are required' },
    };
  }

  // find user by username
  const normalized = String(username || '').trim().toLowerCase();
  const user = await usersStore.getUserByUsername(normalized);
  if (!user) {
    return { statusCode: 401, body: { error: 'Invalid credentials' } };
  }

  // verify password using stored hash+salt+params
  const ok = verifyPassword(password, {
    salt: user.passwordSalt,
    hashedPassword: user.passwordHash,
    iterations: user.passwordIterations,
    digest: user.passwordDigest,
  });

  if (!ok) {
    return { statusCode: 401, body: { error: 'Invalid credentials' } };
  }

  // create JWT
  const payload = {
    userId: user.id,
    username: user.username, // include username in token payload for convenience
  };

  const token = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  return {
    statusCode: 200,
    body: { token },
  };
}

module.exports = { login };
