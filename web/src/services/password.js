const crypto = require('crypto');

// Hash a password using PBKDF2 with a random salt
function hashPassword(password) {
    // Generate a random 16-byte salt and represent it as hex
    const salt = crypto.randomBytes(16).toString('hex');

    // PBKDF2 parameters: number of iterations, key length, and hash algorithm
    const iterations = 100000;
    const keyLength = 64;
    const digest = 'sha512';

    // Derive a cryptographic key from the password and salt
    const hashedPassword = crypto
        .pbkdf2Sync(password, salt, iterations, keyLength, digest)
        .toString('hex');

    // Store hash + salt + parameters so we can verify later
    return { salt, hashedPassword, iterations, digest };
}

// Verify password: hash again with same salt+params and compare
function verifyPassword(password, stored) {
    const { salt, hashedPassword, iterations, digest } = stored;
    const keyLength = Buffer.from(hashedPassword, 'hex').length;

    // Recompute hash using the same salt and parameters
    const hashToCheck = crypto
        .pbkdf2Sync(password, salt, iterations, keyLength, digest)
        .toString('hex');

    // Password is valid only if hashes match exactly
    return hashToCheck === hashedPassword;
}

module.exports = {
    hashPassword,
    verifyPassword,
};
