/**
 * @fileoverview Password Policy Utility Module
 * Enforces security constraints on user passwords.
 */

/**
 * Validates password strength according to the security policy.
 * Requirements:
 * - Length: 8 to 128 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (e.g. !@#$%^&*(),.?":{}|<>)
 *
 * @param {string} password - The plaintext password to test.
 * @returns {boolean} True if the password meets all rules, false otherwise.
 */
const validatePasswordStrength = (password) => {
  if (typeof password !== "string") return false;
  if (password.length < 8 || password.length > 128) return false;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>~`_\-+=\[\]\\{}]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

module.exports = {
  validatePasswordStrength
};
