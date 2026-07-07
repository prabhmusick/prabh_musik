/**
 * @fileoverview Extensible Rate Limiting Middleware
 * Protects endpoints from abuse using an abstract storage pattern.
 */

const ERROR_CODES = require("../config/errorCodes");

/**
 * Abstract Rate Limit Store Base Class
 * Defines the contract that future store adapters (e.g. RedisStore) must implement.
 */
class RateLimitStore {
  /**
   * Increments the request count for a given client key.
   * @param {string} key - Client identifier (usually IP address).
   * @param {number} windowMs - Time window in milliseconds.
   * @returns {Promise<{ current: number, resetTime: number }>}
   */
  async increment(key, windowMs) {
    throw new Error("increment() method must be implemented by the subclass.");
  }
}

/**
 * In-Memory Storage Adapter
 * Default store implementation using JavaScript Map object.
 */
class InMemoryStore extends RateLimitStore {
  constructor() {
    super();
    this.hits = new Map();
  }

  async increment(key, windowMs) {
    const now = Date.now();
    const record = this.hits.get(key);

    if (!record) {
      const resetTime = now + windowMs;
      this.hits.set(key, {
        timestamps: [now],
        resetTime
      });

      // Automatically clean up memory after expiration
      setTimeout(() => this.hits.delete(key), windowMs);

      return {
        current: 1,
        resetTime
      };
    }

    // Filter out historical timestamps outside window
    record.timestamps = record.timestamps.filter(time => now - time < windowMs);
    record.timestamps.push(now);

    return {
      current: record.timestamps.length,
      resetTime: record.resetTime
    };
  }
}

/**
 * Rate limiting middleware creator.
 *
 * @param {Object} options - Configuration options.
 * @param {number} [options.windowMs=900000] - Lifespan window (15 minutes in ms).
 * @param {number} [options.max=5] - Maximum permitted requests.
 * @param {string} [options.message] - Failure error description.
 * @param {string} [options.errorCode] - Standard error code mapping.
 * @param {RateLimitStore} [options.store] - Underlying storage engine implementation.
 * @returns {import('express').RequestHandler}
 */
const rateLimit = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 5;
  const message = options.message || "Too many requests, please try again later.";
  const errorCode = options.errorCode || ERROR_CODES.TOO_MANY_REQUESTS;
  const store = options.store || new InMemoryStore();

  return async (req, res, next) => {
    let ip = req.headers["x-forwarded-for"] || req.ip || "127.0.0.1";
    if (ip && typeof ip === "string") {
      ip = ip.split(",")[0].trim();
    }

    try {
      const { current, resetTime } = await store.increment(ip, windowMs);
      const remaining = Math.max(0, max - current);
      const retryAfterSeconds = Math.ceil(Math.max(0, resetTime - Date.now()) / 1000);

      // Attach HTTP standard headers
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", remaining);

      if (current > max) {
        res.setHeader("Retry-After", retryAfterSeconds);
        return res.status(429).json({
          success: false,
          message,
          errorCode,
          details: {
            retryAfter: retryAfterSeconds
          }
        });
      }

      next();
    } catch (err) {
      next(err); // Propagate store errors
    }
  };
};

module.exports = {
  rateLimit,
  RateLimitStore,
  InMemoryStore
};
