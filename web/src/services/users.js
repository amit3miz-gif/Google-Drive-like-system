const crypto = require('crypto');
const store = require('../store/users');
const picturesStore = require('../store/pictures');
const { hashPassword } = require('./password');


// Helper: checks that a value is a non-empty string (after trimming)
const isNonEmptyString = (v) =>
    typeof v === 'string' && v.trim().length > 0;

// Helper: basic email format validation using a simple regex
const isValidEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9._-]+@[A-Za-z0-9-]+\.[A-Za-z]+$/;
    return typeof email === 'string' && emailRegex.test(email);
};

// Helper: validates full name
const validateFullName = (name) => {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return 'name is required and must be a non-empty string';
  }

  // Only English letters (a-z, A-Z) and spaces
  const lettersRegex = /^[A-Za-z\s]+$/;
  if (!lettersRegex.test(trimmed)) {
    return 'name can contain only English letters and spaces';
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return 'name must contain at least two words';
  }

  return '';
};

// Helper: validates password
const validatePasswordServer = (password) => {
  const trimmed = String(password || '').trim();
  if (!trimmed) return 'password is required and must be a non-empty string';
  if (trimmed.length < 8) {
    return 'Password must be at least 8 characters';
  }
  const hasLetter = /[A-Za-z]/.test(trimmed);
  const hasDigit = /\d/.test(trimmed);
  if (!hasLetter || !hasDigit) {
    return 'Password must contain both letters and digits';
  }
  return '';
};

// Creates a new user after validating input and checking uniqueness
const createUser = async ({ username, password, name, pictureData, pictureContentType }) => {
    // Validate username, name, password, and picture
    if (!isNonEmptyString(username) || !isValidEmail(username.trim())) {
        return { ok: false, error: 'username is required and must be a valid email' };
    }
    const nameError = validateFullName(name);
    if (nameError) {
        return { ok: false, error: nameError };
    }
    const passwordError = validatePasswordServer(password);
    if (passwordError) {
        return { ok: false, error: passwordError };
    }
    if (!pictureData || !pictureData.trim()) {
        return { ok: false, error: 'pictureData is required' };
    }
    if (!pictureContentType || !pictureContentType.startsWith('image/')) {
        return { ok: false, error: 'pictureContentType must start with image/' };
    }

    // Validate that pictureData is valid base64 and not empty when decoded
    let buffer;
    try {
        buffer = Buffer.from(pictureData, 'base64');
    } catch {
        return { ok: false, error: 'pictureData must be valid base64' };
    }
    if (buffer.length === 0) {
        return { ok: false, error: 'pictureData must not be empty' };
    }

    const normalizedUsername = username.trim().toLowerCase();
    // Check for uniqueness of username = email
    const existingByUsername = await store.getUserByUsername(normalizedUsername);
    if (existingByUsername) {
        return { ok: false, error: 'Email already exists' };
    }

    // Hash the password
    const { salt, hashedPassword, iterations, digest } = hashPassword(password);

    // Generate a new unique id for the user
    const id = crypto.randomUUID();

    // Store the picture and get its id
    const pictureId = crypto.randomUUID();
    await picturesStore.addPicture(pictureId, pictureData.trim(), pictureContentType.trim()); 
    // Build the user object and store it
    const user = { 
        id, 
        username: normalizedUsername, 
        name: name.trim(), 
        passwordHash: hashedPassword, 
        passwordSalt: salt, 
        passwordIterations: iterations, 
        passwordDigest: digest, 
        pictureId 
    };

  await store.addUser(user);
    return { ok: true, user };
};

// Retrieves a user by id 
const getUserById = async (id) => {
  if (!isNonEmptyString(id)) {
    return null;
  }

  const user = await store.getUserById(id);
  if (!user) {
    return null;
  }

  // Fetch the picture data
  const picture = await picturesStore.getPicture(user.pictureId) || null;

  return {
    ...user,
    pictureData: picture ? picture.data : null,
    pictureContentType: picture ? picture.contentType : null,
  };
};

// Retrieves a user by username (email)
const getUserByUsername = async (email) => {
  if (!isNonEmptyString(email) || !isValidEmail(email.trim())) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  const user = await store.getUserByUsername(normalized);
  if (!user) return null;

  const picture = (await picturesStore.getPicture(user.pictureId)) || null;

  return {
    ...user,
    pictureData: picture ? picture.data : null,
    pictureContentType: picture ? picture.contentType : null,
  };
};



module.exports = {
    createUser,
    getUserById,
    getUserByUsername,
};
