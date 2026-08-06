/**
 * @fileoverview Google ID Token Verification Module
 * Verifies Google ID tokens, enforces issuer and audience compliance, and maps profiles to DTOs.
 */

const { OAuth2Client } = require("google-auth-library");
const env = require("../../config/env");
const AppError = require("../../errors/AppError");

// Use a SINGLETON OAuth2Client. Do NOT instantiate per request.
const oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID Token, validates claims and issuer, and returns a normalized DTO.
 *
 * @param {string} idToken - The Google ID Token string.
 * @returns {Promise<Readonly<{provider: string, providerId: string, email: string, emailVerified: boolean, displayName: string, avatarUrl: string}>>}
 */
const verifyGoogleIdToken = async (idToken) => {
  if (!idToken || typeof idToken !== "string") {
    throw new AppError("Malformed or missing Google ID Token.", 401);
  }

  let payload;
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new AppError(`Google ID Token verification failed: ${error.message}`, 401);
  }

  if (!payload) {
    throw new AppError("Google ID Token verification failed: No payload returned.", 401);
  }

  // Explicit issuer validation
  const allowedIssuers = ["https://accounts.google.com", "accounts.google.com"];
  if (!payload.iss || !allowedIssuers.includes(payload.iss)) {
    throw new AppError(`Google ID Token verification failed: Invalid issuer ${payload.iss || "none"}`, 401);
  }

  // Required claims validation
  if (!payload.sub) {
    throw new AppError("Google ID Token verification failed: Missing sub claim.", 401);
  }

  if (!payload.email) {
    throw new AppError("Google ID Token verification failed: Missing email claim.", 401);
  }

  return Object.freeze({
    provider: "google",
    providerId: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    displayName: payload.name || "",
    avatarUrl: payload.picture || ""
  });
};

module.exports = {
  verifyGoogleIdToken
};
