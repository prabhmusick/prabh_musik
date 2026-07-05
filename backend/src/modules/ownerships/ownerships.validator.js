const AppError = require("../../errors/AppError");

const validateExpiryUpdate = (data) => {
  if (!data || data.expiresAt === undefined) {
    throw new AppError("expiresAt is required", 400);
  }

  const expiresAt = data.expiresAt;
  if (expiresAt !== null) {
    const timestamp = Date.parse(expiresAt);
    if (isNaN(timestamp)) {
      throw new AppError("Invalid date format for expiresAt", 400);
    }
  }

  return { expiresAt };
};

module.exports = {
  validateExpiryUpdate
};
