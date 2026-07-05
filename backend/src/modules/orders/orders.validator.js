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

  const rawCust = String(data.customerId || "").trim();
  if (!/^\d+$/.test(rawCust)) {
    throw new AppError("Invalid or missing customerId", 400);
  }
  const customerId = parseInt(rawCust, 10);
  if (customerId <= 0) {
    throw new AppError("Invalid or missing customerId", 400);
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

  const paymentMethod = cleanString(data.paymentMethod) || "credit_card";
  
  let status = cleanString(data.status) ? cleanString(data.status).toLowerCase() : "pending";
  // Support UI's 'COMPLETED' by mapping it to 'paid'
  if (status === "completed") {
    status = "paid";
  }

  if (!STATUS_WHITELIST.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${STATUS_WHITELIST.join(", ")}`, 400);
  }

  return {
    customerId,
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
