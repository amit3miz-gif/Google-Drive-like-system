// Blocks requests that require an authenticated user

function requireAuth(req, res, next) {
  if (!req.currentUser) {
    return res
      .status(401)
      .type('application/json')
      .send(JSON.stringify({ error: 'Unauthorized' }, null, 1) + '\n');
  }
  return next();
}

module.exports = requireAuth;
