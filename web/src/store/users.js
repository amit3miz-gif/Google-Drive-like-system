const User = require("../models/users");

// Add a new user to the store
async function addUser(user) {
    // user contains: id, username, name, passwordHash, passwordSalt, passwordIterations, passwordDigest, pictureId
    const created = await User.create(user);
    // return plain object
    return created.toObject();
}

// Get a user by their ID (logical uuid)
async function getUserById(id) {
    if (!id) return null;
    const doc = await User.findOne({ id }).lean();
    return doc || null;
}

// Get a user by their username (email)
async function getUserByUsername(username) {
    if (!username) return null;
    const doc = await User.findOne({ username }).lean();
    return doc || null;
}

module.exports = {
    addUser,
    getUserById,
    getUserByUsername,
};
