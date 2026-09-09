// Validation utility functions for user input fields

// Validates an email address
export function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';

  const emailRegex = /^[A-Za-z0-9._-]+@[A-Za-z0-9-]+\.[A-Za-z]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Email must be a valid email';
  }

  return '';
}

// Validates a full name
export function validateName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Full name is required';

  // Only English letters (a-z, A-Z) and spaces
  const lettersRegex = /^[A-Za-z\s]+$/;
  if (!lettersRegex.test(trimmed)) {
    return 'Full name can contain only English letters and spaces';
  }

  // Split by whitespace and filter out empty parts
  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    return 'Full name must contain at least two words';
  }

  return '';
}

// Validates a password
export function validatePassword(password) {
  if (!password.trim()) return 'Password is required';
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  // Check for at least one letter and one digit
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /\d/.test(password);

  if (!hasLetter || !hasDigit) {
    return 'Password must contain both letters and digits';
  }

  return '';
}

// Validates password confirmation
export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword.trim()) return 'Confirm password is required';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
}

// Validates avatar upload
export function validateAvatar(pictureFile) {
  if (!pictureFile) return 'Avatar is required';
  return '';
}

// Validates the entire registration form
export function validateRegisterForm({ username, name, password, password2, pictureFile }) {
  const emailError = validateEmail(username);
  if (emailError) return emailError;

  const nameError = validateName(name);
  if (nameError) return nameError;

  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;

  const confirmError = validateConfirmPassword(password, password2);
  if (confirmError) return confirmError;

  const avatarError = validateAvatar(pictureFile);
  if (avatarError) return avatarError;

  return '';
}

// Validates the login form
export function validateLoginForm({ username, password }) {
  if (!username.trim() || !password.trim()) {
    return 'Username and password are required';
  }
  return '';
}
