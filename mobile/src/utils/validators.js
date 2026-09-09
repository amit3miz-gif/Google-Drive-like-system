
// Email
export function validateEmail(email) {
  const trimmed = String(email || "").trim();
  if (!trimmed) return "Email is required";

  const emailRegex = /^[A-Za-z0-9._-]+@[A-Za-z0-9-]+\.[A-Za-z]+$/;
  if (!emailRegex.test(trimmed)) {
    return "Email must be a valid email";
  }

  return "";
}


// Full name
export function validateName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "Full name is required";

  // Only English letters (a-z, A-Z) and spaces
  const lettersRegex = /^[A-Za-z\s]+$/;
  if (!lettersRegex.test(trimmed)) {
    return "Full name can contain only English letters and spaces";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return "Full name must contain at least two words";
  }

  return "";
}


// Password
export function validatePassword(password) {
  const p = String(password || "");
  if (!p.trim()) return "Password is required";
  if (p.length < 8) {
    return "Password must be at least 8 characters";
  }

  const hasLetter = /[A-Za-z]/.test(p);
  const hasDigit = /\d/.test(p);

  if (!hasLetter || !hasDigit) {
    return "Password must contain both letters and digits";
  }

  return "";
}

// Confirm password
export function validateConfirmPassword(password, confirmPassword) {
  const cp = String(confirmPassword || "");
  if (!cp.trim()) return "Confirm password is required";
  if (password !== confirmPassword) return "Passwords do not match";
  return "";
}

// Avatar (mobile version)
// picture = { data: base64, contentType: "image/jpeg" }
export function validateAvatar(picture) {
  if (!picture || !picture.data || !picture.contentType) {
    return "Avatar is required";
  }
  return "";
}

// Login form
export function validateLoginForm({ username, password }) {
  const u = String(username || "").trim();
  const p = String(password || "").trim();

  if (!u || !p) {
    return "Username and password are required";
  }

  const emailError = validateEmail(u);
  if (emailError) return emailError;

  return "";
}


// Register form (mobile)
export function validateRegisterForm({
  username,
  name,
  password,
  password2,
  picture,
}) {
  const emailError = validateEmail(username);
  if (emailError) return emailError;

  const nameError = validateName(name);
  if (nameError) return nameError;

  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;

  const confirmError = validateConfirmPassword(password, password2);
  if (confirmError) return confirmError;

  const avatarError = validateAvatar(picture);
  if (avatarError) return avatarError;

  return "";
}
