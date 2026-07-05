const AppError = require("../../errors/AppError");

const STATUS_WHITELIST = ["draft", "published", "archived"];
const SELLING_STATUS_WHITELIST = ["available", "sold"];

/**
 * Trims strings or returns value
 * 
 * @param {*} value - The input value to clean
 * @returns {*} Cleaned value
 */
const cleanString = (value) => 
  typeof value === "string" ? value.trim() : value;

/**
 * Validates payload parameters for beat creation.
 * Throws AppError on schema violations.
 * 
 * @param {object} data - Input properties payload
 * @returns {object} Cleaned, validated, and normalized data
 */
const validateCreateBeat = (data) => {
  if (!data) {
    throw new AppError("No data provided", 400);
  }

  const beat_name = cleanString(data.beat_name);
  const audio_key = cleanString(data.audio_key);

  // Required Field Validations
  if (!beat_name) {
    throw new AppError("Beat name is required", 400);
  }
  if (!audio_key) {
    throw new AppError("Audio key is required", 400);
  }

  // Price validation: prevent entering NaN to database
  let price = 0;
  if (data.price !== undefined && data.price !== null && data.price !== "") {
    price = Number(data.price);
    if (Number.isNaN(price) || price < 0) {
      throw new AppError("Price must be a valid positive number", 400);
    }
  }

  // BPM validation
  let bpm = null;
  if (data.bpm !== undefined && data.bpm !== null && data.bpm !== "") {
    bpm = Number(data.bpm);
    if (Number.isNaN(bpm) || bpm < 0 || !Number.isInteger(bpm)) {
      throw new AppError("BPM must be a valid integer number", 400);
    }
  }

  // Duration validation
  let duration = null;
  if (data.duration !== undefined && data.duration !== null && data.duration !== "") {
    duration = Number(data.duration);
    if (Number.isNaN(duration) || duration < 0 || !Number.isInteger(duration)) {
      throw new AppError("Duration must be a valid integer number", 400);
    }
  }

  // Status Whitelists
  const status = cleanString(data.status) || "draft";
  if (!STATUS_WHITELIST.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${STATUS_WHITELIST.join(", ")}`, 400);
  }

  const selling_status = cleanString(data.selling_status) || "available";
  if (!SELLING_STATUS_WHITELIST.includes(selling_status)) {
    throw new AppError(`Invalid selling_status. Must be one of: ${SELLING_STATUS_WHITELIST.join(", ")}`, 400);
  }

  return {
    beat_name,
    audio_key,
    price,
    bpm,
    duration,
    status,
    selling_status,
    beat_type: cleanString(data.beat_type) || null,
    genre: cleanString(data.genre) || null,
    description: cleanString(data.description) || null,
    cover_key: cleanString(data.cover_key) || null,
    banner_key: cleanString(data.banner_key) || null,
    track_type: cleanString(data.track_type) || null,
    mood: cleanString(data.mood) || null
  };
};

/**
 * Validates payload parameters for beat updates.
 * Throws AppError on schema violations.
 * 
 * @param {object} data - Updated properties payload
 * @returns {object} Sanitized and type-validated update fields
 */
const validateUpdateBeat = (data) => {
  if (!data) {
    throw new AppError("No data provided for update", 400);
  }

  const sanitized = {};

  if (data.beat_name !== undefined) {
    const trimmed = cleanString(data.beat_name);
    if (!trimmed) {
      throw new AppError("Beat name cannot be empty", 400);
    }
    sanitized.beat_name = trimmed;
  }

  if (data.audio_key !== undefined) {
    const trimmed = cleanString(data.audio_key);
    if (!trimmed) {
      throw new AppError("Audio key cannot be empty", 400);
    }
    sanitized.audio_key = trimmed;
  }

  if (data.price !== undefined) {
    if (data.price === null || data.price === "") {
      sanitized.price = 0;
    } else {
      const price = Number(data.price);
      if (Number.isNaN(price) || price < 0) {
        throw new AppError("Price must be a valid positive number", 400);
      }
      sanitized.price = price;
    }
  }

  if (data.bpm !== undefined) {
    if (data.bpm === null || data.bpm === "") {
      sanitized.bpm = null;
    } else {
      const bpm = Number(data.bpm);
      if (Number.isNaN(bpm) || bpm < 0 || !Number.isInteger(bpm)) {
        throw new AppError("BPM must be a valid integer number", 400);
      }
      sanitized.bpm = bpm;
    }
  }

  if (data.duration !== undefined) {
    if (data.duration === null || data.duration === "") {
      sanitized.duration = null;
    } else {
      const duration = Number(data.duration);
      if (Number.isNaN(duration) || duration < 0 || !Number.isInteger(duration)) {
        throw new AppError("Duration must be a valid integer number", 400);
      }
      sanitized.duration = duration;
    }
  }

  if (data.status !== undefined) {
    const status = cleanString(data.status);
    if (!STATUS_WHITELIST.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${STATUS_WHITELIST.join(", ")}`, 400);
    }
    sanitized.status = status;
  }

  if (data.selling_status !== undefined) {
    const selling_status = cleanString(data.selling_status);
    if (!SELLING_STATUS_WHITELIST.includes(selling_status)) {
      throw new AppError(`Invalid selling_status. Must be one of: ${SELLING_STATUS_WHITELIST.join(", ")}`, 400);
    }
    sanitized.selling_status = selling_status;
  }

  // Normalize other string parameters if supplied
  const stringFields = [
    "beat_type",
    "genre",
    "description",
    "cover_key",
    "banner_key",
    "track_type",
    "mood"
  ];

  stringFields.forEach((field) => {
    if (data[field] !== undefined) {
      sanitized[field] = cleanString(data[field]);
    }
  });

  return sanitized;
};

module.exports = {
  validateCreateBeat,
  validateUpdateBeat
};
