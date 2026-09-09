// in memory token store (for now tokenId = userId)

const tokensById = new Map(); 
// Token object structure:
// {
//   token: 'userId',
//   userId: 'userId',
//   createdAt: 1700000000000 
// }


// Generate a token for a given user (here token == userId)
function generateForUser(userId) {
    return String(userId).trim();
}


// Save token in store (mark as "logged in")
function save(userId) {
    const token = generateForUser(userId); // key
    const tokenObj = { token, userId, createdAt: Date.now() };
    tokensById.set(token, tokenObj);
    return tokenObj;
}


// Lookup token object (returns tokenObj or null)
function lookup(token) {
    const t = String(token || '').trim();
    if (!t) return null;
    return tokensById.get(t) || null; // token's valid but doesn't exist

}


// Delete token (logout)
function remove(token) {
    const t = String(token || '').trim();
    if (!t) return false;
    return tokensById.delete(t);
}


// Optional: check if token exists 
function exists(token) {
    return lookup(token) !== null;
}

module.exports = {
    generateForUser,
    save,
    lookup,
    remove,
    exists,
};