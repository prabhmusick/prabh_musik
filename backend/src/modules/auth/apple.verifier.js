/**
 * @fileoverview Apple Identity Token Verification Module
 * Verifies Apple ID tokens, enforces OIDC standards, validates claims, and maps to OAuthProfileDTO.
 * Retrieves and caches public keys natively to avoid Jest ESM package mapping issues.
 */

const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const env = require("../../config/env");
const AppError = require("../../errors/AppError");

// Local JWKS Cache
let jwksCache = null;
let jwksLastFetched = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours key caching
const MIN_FETCH_INTERVAL = 60 * 1000; // 1 minute rate-limiting between network fetches

/**
 * Fetches Apple's public signing keys and caches them in memory.
 * Falls back to current cache if network errors occur.
 *
 * @param {boolean} [force=false] - If true, ignores cache age (but respects rate limits).
 * @returns {Promise<Array<Object>>} Resolved Apple JWKs array.
 */
const fetchAppleJwks = async (force = false) => {
  const now = Date.now();
  if (jwksCache && !force && (now - jwksLastFetched < CACHE_DURATION)) {
    return jwksCache;
  }

  // Rate-limit fetches to prevent brute-force signature attempts from flooding Apple
  if (jwksCache && (now - jwksLastFetched < MIN_FETCH_INTERVAL)) {
    return jwksCache;
  }

  try {
    const response = await axios.get("https://appleid.apple.com/auth/keys", { timeout: 5000 });
    if (response.data && Array.isArray(response.data.keys)) {
      jwksCache = response.data.keys;
      jwksLastFetched = now;
      return jwksCache;
    }
    throw new Error("Invalid response format from Apple JWKS endpoint.");
  } catch (error) {
    if (jwksCache) {
      return jwksCache;
    }
    throw error;
  }
};

/**
 * Resolves the Apple public signing key (PEM format) matching the given kid.
 *
 * @param {string} kid - Key ID from token header.
 * @returns {Promise<string>} Public key in PEM format.
 */
const getApplePublicKey = async (kid) => {
  let keys = await fetchAppleJwks();
  let matchingKey = keys.find(k => k.kid === kid);

  if (!matchingKey) {
    // Attempt forced fetch on cache miss to handle key rotations
    keys = await fetchAppleJwks(true);
    matchingKey = keys.find(k => k.kid === kid);
  }

  if (!matchingKey) {
    throw new Error(`Key ID ${kid} not found in Apple JWKS.`);
  }

  try {
    const publicKey = crypto.createPublicKey({
      format: "jwk",
      key: {
        kty: "RSA",
        n: matchingKey.n,
        e: matchingKey.e,
        alg: "RS256",
        use: "sig"
      }
    });
    return publicKey.export({ type: "pkcs1", format: "pem" });
  } catch (err) {
    throw new Error(`Failed to convert JWK to PEM format: ${err.message}`);
  }
};

/**
 * Verifies Apple ID Token and maps payload to normalized provider-agnostic OAuthProfileDTO.
 *
 * @param {string} idToken - Raw Apple ID Token.
 * @param {string|null} [expectedNonce=null] - Optional nonce string to verify.
 * @returns {Promise<Readonly<{provider: string, providerId: string, email: string, emailVerified: boolean, displayName: string, avatarUrl: string, givenName: string, familyName: string}>>}
 */
const verifyAppleIdToken = async (idToken, expectedNonce = null) => {
  if (!idToken || typeof idToken !== "string") {
    throw new AppError("Malformed or missing Apple ID Token.", 401);
  }

  // Pre-decode header to check for kid
  const decodedHeader = jwt.decode(idToken, { complete: true });
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    throw new AppError("Apple ID Token verification failed: Unable to retrieve signing keys.", 401);
  }

  const { kid } = decodedHeader.header;
  let pemKey;
  try {
    pemKey = await getApplePublicKey(kid);
  } catch (err) {
    throw new AppError("Apple ID Token verification failed: Unable to retrieve signing keys.", 401);
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      pemKey,
      {
        algorithms: ["RS256"],
        issuer: "https://appleid.apple.com"
      },
      (err, payload) => {
        if (err) {
          return reject(new AppError(`Apple ID Token verification failed: ${err.message}`, 401));
        }

        if (!payload) {
          return reject(new AppError("Apple ID Token verification failed: No payload returned.", 401));
        }

        // 1. Explicitly validate that token contains a valid sub claim before DTO creation
        if (!payload.sub || typeof payload.sub !== "string" || !payload.sub.trim()) {
          return reject(new AppError("Invalid Apple ID token.", 401));
        }

        // 2. Audience validation (must match one of the allowed audiences in configuration)
        const allowedAudiences = env.APPLE_ALLOWED_AUDIENCES || [];
        if (!payload.aud || !allowedAudiences.includes(payload.aud)) {
          return reject(new AppError("Apple ID Token verification failed: Audience mismatch.", 401));
        }

        // 3. Optional nonce verification
        if (expectedNonce !== null && expectedNonce !== undefined) {
          if (payload.nonce !== expectedNonce) {
            return reject(new AppError("Apple ID Token verification failed: Nonce mismatch.", 401));
          }
        }

        // 4. Default email field to empty string if email claim is absent
        const emailValue = payload.email || "";

        // 5. Handle email_verified as boolean or string value
        const emailVerifiedValue = Boolean(payload.email_verified === true || payload.email_verified === "true");

        // 6. Return a frozen, standard provider-agnostic OAuthProfileDTO
        resolve(
          Object.freeze({
            provider: "apple",
            providerId: payload.sub,
            email: emailValue,
            emailVerified: emailVerifiedValue,
            displayName: "",
            avatarUrl: "",
            givenName: "",
            familyName: ""
          })
        );
      }
    );
  });
};

module.exports = {
  verifyAppleIdToken
};
