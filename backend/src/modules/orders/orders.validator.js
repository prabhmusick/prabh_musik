const AppError = require("../../errors/AppError");

const STATUS_WHITELIST = ["pending", "paid", "failed", "refunded", "cancelled"];

const cleanString = (value) => 
  typeof value === "string" ? value.trim() : value;

/**
 * Validates payload parameters for order creation.
 * Throws AppError on schema violations.
 */
const validateCreateOrder = (data) => {
  if (!data) {
    throw new AppError("No data provided", 400);
  }

  if (!Array.isArray(data.beatIds) || data.beatIds.length === 0) {
    throw new AppError("beatIds must be a non-empty array", 400);
  }

  const beatIds = data.beatIds.map(id => {
    const rawId = String(id || "").trim();
    if (!/^\d+$/.test(rawId)) {
      throw new AppError(`Invalid beatId: ${id}`, 400);
    }
    const parsedId = parseInt(rawId, 10);
    if (parsedId <= 0) {
      throw new AppError(`Invalid beatId: ${id}`, 400);
    }
    return parsedId;
  });

  const paymentMethod = cleanString(data.paymentMethod) || "razorpay";
  
  // Security Hardening: Initial order status MUST ALWAYS be pending upon creation.
  // Payment completion can only be achieved via server-side payment verification.
  const status = "pending";

  return {
    beatIds,
    paymentMethod,
    status
  };
};

/**
 * Validates status payload.
 */
const validateStatusUpdate = (data) => {
  if (!data || data.status === undefined) {
    throw new AppError("Status is required", 400);
  }
  let status = cleanString(data.status);
  if (typeof status === "string") {
    status = status.toLowerCase();
    if (status === "completed") {
      status = "paid";
    }
  }
  if (!STATUS_WHITELIST.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${STATUS_WHITELIST.join(", ")}`, 400);
  }
  return { status };
};

module.exports = {
  validateCreateOrder,
  validateStatusUpdate
};
