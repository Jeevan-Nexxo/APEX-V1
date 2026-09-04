const validator = require("validator");

const validateEmail = (email) => {
  if (!email) return { valid: false, message: "Email is required." };
  if (!validator.isEmail(email)) return { valid: false, message: "Invalid email format." };
  return { valid: true };
};

const validatePassword = (password) => {
  if (!password) return { valid: false, message: "Password is required." };
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters." };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must contain an uppercase letter." };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must contain a lowercase letter." };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must contain a number." };
  return { valid: true };
};

const validateFullName = (fullName) => {
  if (!fullName || !fullName.trim()) return { valid: false, message: "Full name is required." };
  return { valid: true };
};

const validateRole = (role) => {
  const allowed = ["student", "visitor", "manager", "admin"];
  if (!role || !allowed.includes(role)) {
    return { valid: false, message: "Role must be one of: student, visitor, manager, admin." };
  }
  return { valid: true };
};

const validateUrl = (url) => {
  if (!url) return { valid: true };
  if (!validator.isURL(url)) return { valid: false, message: "Invalid URL format." };
  return { valid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateFullName,
  validateRole,
  validateUrl,
};
