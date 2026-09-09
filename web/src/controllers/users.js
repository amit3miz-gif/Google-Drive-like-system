const usersService = require("../services/users");
const { sendJson } = require("./response");

// Controller for creating a new user
const createUser = async (req, res) => {
  try {
    const { username, password, name, pictureData, pictureContentType } =
      req.body || {};
    console.log("createUser body:", { username, name, hasPic: !!pictureData });

    const result = await usersService.createUser({
      username,
      password,
      name,
      pictureData,
      pictureContentType,
    });

    if (!result.ok) {
      console.error("createUser error:", result.error);
      return sendJson(res, 409, { error: result.error });
    }

    const user = result.user;

    return res.status(201).location(`/api/users/${user.id}`).end();
  } catch (error) {
    console.error("createUser INTERNAL ERROR:", error);
    return sendJson(res, 500, { error: "Internal server error" });
  }
};

// Controller for fetching a user by ID
const getUserById = async (req, res) => {
  const { id } = req.params;

  const user = await usersService.getUserById(id);

  if (!user) {
    return sendJson(res, 404, { error: "User not found" });
  }

  const {
    passwordHash,
    passwordSalt,
    passwordIterations,
    passwordDigest,
    pictureId,
    ...publicUser
  } = user;

  return sendJson(res, 200, publicUser);
};

// GET /api/users/me (current logged-in user)
const getMe = async (req, res) => {
  if (!req.currentUser?.id) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const full = await usersService.getUserById(req.currentUser.id);
  if (!full) return sendJson(res, 401, { error: "User not found" });

  const {
    passwordHash,
    passwordSalt,
    passwordIterations,
    passwordDigest,
    pictureId,
    ...mePublic
  } = full;

  return sendJson(res, 200, mePublic);
};

// GET /api/users/by-username/:username
const getByUsername = async (req, res) => {
  const { username } = req.params;

  const user = await usersService.getUserByUsername(username);
  if (!user) {
    return sendJson(res, 404, { error: "User not found" });
  }

  const {
    passwordHash,
    passwordSalt,
    passwordIterations,
    passwordDigest,
    pictureId,
    ...publicUser
  } = user;

  return sendJson(res, 200, publicUser);
};

module.exports = {
  createUser,
  getUserById,
  getMe,
  getByUsername,
};
