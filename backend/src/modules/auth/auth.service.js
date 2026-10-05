/**
 * @fileoverview Authentication Service Layer
 *
 * Responsibilities:
 * - Orchestrates registration business logic.
 * - Handles password hashing and email normalization.
 * - Manages JWT token generation and SHA-256 session token encryption.
 * - Coordinates database transactional profile, credential, and session writes.
 *
 * Explicit Non-Responsibilities:
 * - Does not read HTTP req/res objects or directly touch cookies.
 * - Does not construct raw SQL or run direct sqlite queries.
 * - Does not perform Express routing.
 */

const AppError = require("../../errors/AppError");
const ConflictError = require("../../errors/ConflictError");
const usersRepository = require("../users/users.repository");
const authRepository = require("./auth.repository");
const { executeTransaction } = require("../../config/transaction");
const passwordUtil = require("../../utils/password");
const jwtUtil = require("../../utils/jwt");
const userMapper = require("../users/user.mapper");
const emailUtil = require("../../utils/email");
const env = require("../../config/env");
const idUtil = require("../../utils/id");
const tokenUtil = require("../../utils/token");
const logger = require("../../utils/logger");
const ERROR_CODES = require("../../config/errorCodes");
const audit = require("../../utils/audit");
const REVOCATION_REASONS = require("../../config/revocationReasons");

/**
 * Orchestrates customer account registration.
 *
 * @param {Object} userData - Incoming payload parameters (name, email, password).
 * @param {Object} clientContext - Metadata for tracking device details (ip, userAgent, deviceName).
 * @returns {Promise<Object>} Object containing user DTO, accessToken, refreshToken, and expiresIn.
 */
const signup = async (userData, clientContext = {}) => {
  const normalizedEmail = emailUtil.normalizeEmail(userData.email);

  try {
    // 1. Duplicate email detection (Business logic check)
    const existingUser = await usersRepository.findUserByEmail(normalizedEmail);
    if (existingUser) {
      logger.warn({
        event: ERROR_CODES.DUPLICATE_EMAIL,
        email: normalizedEmail,
        message: "Duplicate email registration attempt."
      });
      throw new ConflictError("Email already in use.");
    }

    // 2. Perform password hashing and refresh token hashing BEFORE opening the transaction
    const passwordHash = await passwordUtil.hashPassword(userData.password);

    // Generate Session and Public UUIDs
    const sessionId = idUtil.generateSessionId();
    const publicId = idUtil.generatePublicId();

    // Build and hash Refresh Token BEFORE transaction
    const refreshToken = jwtUtil.generateRefreshToken({
      sub: publicId,
      sid: sessionId,
      jti: idUtil.generateSessionId()
    });
    const refreshHash = tokenUtil.hashToken(refreshToken);

    const sessionExpiryDays = env.SESSION_EXPIRY_DAYS;
    const expiresAt = new Date(Date.now() + sessionExpiryDays * 24 * 60 * 60 * 1000).toISOString();

    // 3. Execute Database Transaction
    const { userId } = await executeTransaction(async (tx) => {
      // Create user
      const userResult = await usersRepository.createUser(tx, {
        public_id: publicId,
        name: userData.name,
        email: normalizedEmail,
        role: "customer",
        status: "active"
      });

      // Create credential
      await authRepository.createCredential(tx, {
        user_id: userResult.id,
        provider: "email",
        password_hash: passwordHash
      });

      // Create session
      await authRepository.createSession(tx, {
        id: sessionId,
        user_id: userResult.id,
        refresh_token_hash: refreshHash,
        device_name: clientContext.deviceName || null,
        ip: clientContext.ip || null,
        user_agent: clientContext.userAgent || null,
        expires_at: expiresAt
      });

      return { userId: userResult.id };
    });

    // 4. Generate Access Token AFTER successful transaction commit
    const accessToken = jwtUtil.generateAccessToken({
      sub: publicId,
      role: "customer",
      sid: sessionId
    });

    // 5. Build User DTO from available in-memory data (avoids post-commit getUserById DB read)
    const userDto = userMapper.toUserDto({
      public_id: publicId,
      name: userData.name,
      email: normalizedEmail,
      role: "customer",
      status: "active"
    });

    // Emit structured audit event instead of standard info log
    audit.userRegistered({
      userId: publicId,
      email: normalizedEmail
    });

    return {
      user: userDto,
      accessToken,
      refreshToken,
      expiresIn: env.ACCESS_TOKEN_EXPIRY_SECONDS
    };
  } catch (error) {
    // Catch repository/database unique constraint and translate to ConflictError
    const isUniqueConstraint = 
      (error.message && error.message.includes("UNIQUE constraint failed")) ||
      (error.originalError && error.originalError.message && error.originalError.message.includes("UNIQUE constraint failed")) ||
      (error.code === "SQLITE_CONSTRAINT") ||
      (error.originalError && error.originalError.code === "SQLITE_CONSTRAINT");

    if (isUniqueConstraint) {
      logger.warn({
        event: ERROR_CODES.DUPLICATE_EMAIL,
        email: normalizedEmail,
        message: "Unique constraint violation caught from database write."
      });
      throw new ConflictError("Email already in use.");
    }

    if (error instanceof AppError) {
      throw error;
    }

    logger.error({
      event: "SIGNUP_FAILED_UNEXPECTED",
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Validates credentials and generates access/refresh tokens.
 *
 * @param {Object} credentials - Input payload (email, password).
 * @param {Object} clientContext - Client request details (ip, userAgent, requestId).
 * @returns {Promise<Object>} Object containing user DTO, tokens, and expiry duration.
 */
const login = async (credentials, clientContext = {}) => {
  const normalizedEmail = emailUtil.normalizeEmail(credentials.email);

  const throwInvalidCredentials = () => {
    const err = new AppError("Invalid email or password.", 401);
    err.errorCode = ERROR_CODES.INVALID_CREDENTIALS;
    throw err;
  };

  // 1. Fetch user by email
  const user = await usersRepository.findUserByEmail(normalizedEmail);
  if (!user || user.status === "deleted") {
    throwInvalidCredentials();
  }

  // 2. Fetch local credentials record by userId (Do not query by email)
  const credential = await authRepository.findCredentialByUserId(user.id);
  if (!credential) {
    throwInvalidCredentials();
  }

  // 3. Verify password first to mitigate response timing leaks
  const isPasswordValid = await passwordUtil.comparePassword(credentials.password, credential.password_hash);
  if (!isPasswordValid) {
    throwInvalidCredentials();
  }

  // 4. Verify account status (after password verification)
  if (user.status === "suspended") {
    const err = new AppError("User account is suspended.", 401);
    err.errorCode = ERROR_CODES.USER_SUSPENDED;
    throw err;
  }

  // Generate Session and Token identifiers
  const sessionId = idUtil.generateSessionId();
  const refreshToken = jwtUtil.generateRefreshToken({
    sub: user.public_id,
    sid: sessionId,
    jti: idUtil.generateSessionId()
  });
  const refreshHash = tokenUtil.hashToken(refreshToken);

  const sessionExpiryDays = env.SESSION_EXPIRY_DAYS || 30;
  const expiresAt = new Date(Date.now() + sessionExpiryDays * 24 * 60 * 60 * 1000).toISOString();
  const lastLoginAt = new Date().toISOString();

  // 5. Execute Session Creation and User last_login_at updates in a unified transaction
  await executeTransaction(async (tx) => {
    // Create session record
    await authRepository.createSession(tx, {
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: refreshHash,
      device_name: clientContext.deviceName || null,
      ip: clientContext.ip || null,
      user_agent: clientContext.userAgent || null,
      expires_at: expiresAt
    });

    // Update last login timestamp
    await usersRepository.updateLastLoginAt(tx, user.id, lastLoginAt);
  });

  // 6. Generate Access Token
  const accessToken = jwtUtil.generateAccessToken({
    sub: user.public_id,
    role: user.role,
    sid: sessionId
  });

  // 7. Emit structured login audit event
  audit.userLoggedIn({
    userId: user.public_id,
    requestId: clientContext.requestId
  });

  // 8. Map to clean public User DTO
  const userDto = userMapper.toUserDto({
    public_id: user.public_id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  });

  return {
    user: userDto,
    accessToken,
    refreshToken,
    expiresIn: env.ACCESS_TOKEN_EXPIRY_SECONDS
  };
};

/**
 * Revokes the session associated with the provided refresh token.
 *
 * @param {string} token - Stored refresh token cookie.
 * @param {Object} clientContext - Context variables (requestId, ip, userAgent).
 * @returns {Promise<Object>} Status object.
 */
const logout = async (token, clientContext = {}) => {
  if (!token || typeof token !== "string") {
    return { success: true };
  }

  let decoded;
  try {
    // 1. Try to verify the refresh token first
    decoded = jwtUtil.verifyRefreshToken(token);
  } catch (error) {
    // 2. If verification fails, safely decode the token only for best-effort session revocation
    decoded = jwtUtil.decodeToken(token);
  }

  if (!decoded || !decoded.sid) {
    return { success: true };
  }

  const { sub, sid } = decoded;

  // 3. Find the session
  const session = await authRepository.findSessionBySessionId(sid);
  if (session && !session.revokedAt) {
    // 4. Revoke session inside a minimal transaction
    await executeTransaction(async (tx) => {
      await authRepository.revokeSessionBySessionId(tx, sid, REVOCATION_REASONS.USER_LOGOUT);
    });

    // 5. Emit USER_LOGGED_OUT carrying requestId, sessionId, userId, reason
    audit.emit({
      name: "USER_LOGGED_OUT",
      userId: sub || null,
      metadata: {
        sessionId: sid,
        requestId: clientContext.requestId,
        reason: REVOCATION_REASONS.USER_LOGOUT
      },
      message: "User logged out successfully."
    });
  }

  return { success: true };
};

/**
 * Validates a refresh token and generates a new access token.
 *
 * @param {string} token - Stored refresh token cookie.
 * @param {Object} clientContext - Context variables (requestId, ip, userAgent).
 * @returns {Promise<Object>} Object containing new tokens and user profile DTO.
 */
const refreshToken = async (token, clientContext = {}) => {
  const throwInvalidSession = () => {
    const err = new AppError("Invalid or expired session.", 401);
    err.errorCode = ERROR_CODES.INVALID_SESSION;
    throw err;
  };

  if (!token || typeof token !== "string") {
    throwInvalidSession();
  }

  let decoded;
  try {
    // 1. Verify refresh token signature and expiration
    decoded = jwtUtil.verifyRefreshToken(token);
  } catch (error) {
    logger.warn({
      event: "JWT_REFRESH_VERIFICATION_FAILED",
      error: error.message,
      requestId: clientContext.requestId
    });
    throwInvalidSession();
  }

  const { sub, sid } = decoded;
  if (!sub || !sid) {
    throwInvalidSession();
  }

  // 2. Fetch the session from DB
  const session = await authRepository.findSessionBySessionId(sid);
  if (!session) {
    throwInvalidSession();
  }

  // 3. Verify session expiration first (before token comparison)
  const isExpired = new Date(session.expiresAt) < new Date();
  if (isExpired) {
    logger.warn({
      event: "SESSION_EXPIRED",
      sessionId: sid,
      expiresAt: session.expiresAt,
      requestId: clientContext.requestId
    });
    throwInvalidSession();
  }

  // 4. Verify session is not already revoked
  if (session.revokedAt) {
    logger.warn({
      event: "SESSION_ALREADY_REVOKED",
      sessionId: sid,
      revokedAt: session.revokedAt,
      requestId: clientContext.requestId
    });
    throwInvalidSession();
  }

  // 5. Fetch user profile from DB to verify active status
  const user = await usersRepository.getUserById(session.userId);
  if (!user || user.status === "suspended" || user.status === "deleted") {
    logger.warn({
      event: "USER_INACTIVE_ON_REFRESH",
      userId: sub,
      status: user ? user.status : "nonexistent",
      requestId: clientContext.requestId
    });
    throwInvalidSession();
  }

  // 6. Hash cookie refresh token and compare against stored hash using timing-safe utilities
  const crypto = require("crypto");
  const submittedHash = tokenUtil.hashToken(token);

  const timingSafeCompare = (a, b) => {
    const hashA = crypto.createHash("sha256").update(a).digest();
    const hashB = crypto.createHash("sha256").update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  };

  const isMatch = timingSafeCompare(submittedHash, session.tokenHash);
  if (!isMatch) {
    // Replay Attack Detected! Revoke session immediately inside a minimal transaction
    await executeTransaction(async (tx) => {
      await authRepository.revokeSessionBySessionId(tx, sid, REVOCATION_REASONS.TOKEN_REPLAY);
    });

    // Emit security events carrying requestId, sessionId, userId, reason
    audit.emit({
      name: "TOKEN_REPLAY_DETECTED",
      userId: user.public_id,
      metadata: {
        sessionId: sid,
        requestId: clientContext.requestId,
        reason: REVOCATION_REASONS.TOKEN_REPLAY
      },
      message: "Potential refresh token replay attack detected. Revoking session."
    });

    audit.emit({
      name: "SESSION_REVOKED",
      userId: user.public_id,
      metadata: {
        sessionId: sid,
        requestId: clientContext.requestId,
        reason: REVOCATION_REASONS.TOKEN_REPLAY
      },
      message: "Session terminated due to replay detection"
    });

    throwInvalidSession();
  }

  // 7. Legitimate request: generate new tokens OUTSIDE database transaction
  const newRefreshToken = jwtUtil.generateRefreshToken({
    sub: user.public_id,
    sid: session.id,
    jti: idUtil.generateSessionId()
  });
  const newRefreshHash = tokenUtil.hashToken(newRefreshToken);

  const newAccessToken = jwtUtil.generateAccessToken({
    sub: user.public_id,
    role: user.role,
    sid: session.id
  });

  // 8. Execute only hash updates inside minimal transaction
  await executeTransaction(async (tx) => {
    await authRepository.rotateSessionToken(tx, session.id, newRefreshHash);
  });

  // 9. Emit TOKEN_REFRESHED audit event
  audit.emit({
    name: "TOKEN_REFRESHED",
    userId: user.public_id,
    metadata: {
      sessionId: session.id,
      requestId: clientContext.requestId
    },
    message: "Session tokens successfully rotated."
  });

  const userDto = userMapper.toUserDto(user);
  return {
    user: userDto,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: env.ACCESS_TOKEN_EXPIRY_SECONDS
  };
};

/**
 * Initiates forgot password flow by creating and mailing reset tokens.
 */
const forgotPassword = async (email) => {
  throw new AppError("Not implemented", 501);
};

/**
 * Validates token and resets user password to a new one.
 */
const resetPassword = async (token, newPassword) => {
  throw new AppError("Not implemented", 501);
};

/**
 * Verifies email signature using verification token.
 */
const verifyEmail = async (token) => {
  throw new AppError("Not implemented", 501);
};

/**
 * Resends verification email to the user.
 */
const resendVerification = async (email) => {
  throw new AppError("Not implemented", 501);
};

/**
 * Authenticates user using generic OAuth assertions.
 *
 * @param {Object} profile - Normalized OAuth Profile DTO.
 * @param {Object} [clientContext={}] - Metadata context from request.
 * @returns {Promise<Object>} Mapped user, tokens, and expiry duration.
 */
const oauthLogin = async (profile, clientContext = {}) => {
  // 1. Mandatory provider-agnostic validation
  if (!profile.emailVerified) {
    const err = new AppError(
      `${profile.provider === "google" ? "Google" : profile.provider} email is not verified.`,
      401
    );
    err.errorCode = "OAUTH_EMAIL_NOT_VERIFIED";
    throw err;
  }

  // 2. Check for existing credential for the given provider
  let credential = await authRepository.findCredentialByProvider(profile.provider, profile.providerId);
  let user;

  const sessionId = idUtil.generateSessionId();
  const sessionExpiryDays = env.SESSION_EXPIRY_DAYS || 30;
  const expiresAt = new Date(Date.now() + sessionExpiryDays * 24 * 60 * 60 * 1000).toISOString();
  const lastLoginAt = new Date().toISOString();

  if (credential) {
    // Existing OAuth Credential User
    user = await usersRepository.getUserById(credential.user_id);
    if (!user || user.status === "deleted") {
      throw new AppError("Invalid or suspended account.", 401);
    }
    if (user.status === "suspended") {
      const err = new AppError("User account is suspended.", 401);
      err.errorCode = ERROR_CODES.USER_SUSPENDED;
      throw err;
    }

    const refreshToken = jwtUtil.generateRefreshToken({
      sub: user.public_id,
      sid: sessionId,
      jti: idUtil.generateSessionId()
    });
    const refreshHash = tokenUtil.hashToken(refreshToken);

    await executeTransaction(async (tx) => {
      await authRepository.createSession(tx, {
        id: sessionId,
        user_id: user.id,
        refresh_token_hash: refreshHash,
        device_name: clientContext.deviceName || null,
        ip: clientContext.ip || null,
        user_agent: clientContext.userAgent || null,
        expires_at: expiresAt
      });

      await usersRepository.updateLastLoginAt(tx, user.id, lastLoginAt);
    });

    const accessToken = jwtUtil.generateAccessToken({
      sub: user.public_id,
      role: user.role,
      sid: sessionId
    });

    audit.userLoggedIn({
      userId: user.public_id,
      requestId: clientContext.requestId
    });

    return {
      user: userMapper.toUserDto(user),
      accessToken,
      refreshToken,
      expiresIn: env.ACCESS_TOKEN_EXPIRY_SECONDS
    };
  }

  // Credential does not exist. Check if email matches existing account.
  user = await usersRepository.findUserByEmail(profile.email);

  if (user) {
    // Existing email user - Link OAuth account
    if (user.status === "deleted") {
      throw new AppError("Invalid or suspended account.", 401);
    }
    if (user.status === "suspended") {
      const err = new AppError("User account is suspended.", 401);
      err.errorCode = ERROR_CODES.USER_SUSPENDED;
      throw err;
    }

    const refreshToken = jwtUtil.generateRefreshToken({
      sub: user.public_id,
      sid: sessionId,
      jti: idUtil.generateSessionId()
    });
    const refreshHash = tokenUtil.hashToken(refreshToken);

    await executeTransaction(async (tx) => {
      // Create OAuth credential
      await authRepository.createCredential(tx, {
        user_id: user.id,
        provider: profile.provider,
        provider_id: profile.providerId,
        provider_email: profile.email,
        password_hash: null
      });

      // Create session
      await authRepository.createSession(tx, {
        id: sessionId,
        user_id: user.id,
        refresh_token_hash: refreshHash,
        device_name: clientContext.deviceName || null,
        ip: clientContext.ip || null,
        user_agent: clientContext.userAgent || null,
        expires_at: expiresAt
      });

      await usersRepository.updateLastLoginAt(tx, user.id, lastLoginAt);
    });

    const accessToken = jwtUtil.generateAccessToken({
      sub: user.public_id,
      role: user.role,
      sid: sessionId
    });

    audit.userLoggedIn({
      userId: user.public_id,
      requestId: clientContext.requestId
    });

    return {
      user: userMapper.toUserDto(user),
      accessToken,
      refreshToken,
      expiresIn: env.ACCESS_TOKEN_EXPIRY_SECONDS
    };
  }

  // Brand new user - Register and sign in
  const publicId = idUtil.generatePublicId();
  const refreshToken = jwtUtil.generateRefreshToken({
    sub: publicId,
    sid: sessionId,
    jti: idUtil.generateSessionId()
  });
  const refreshHash = tokenUtil.hashToken(refreshToken);

  const displayName = profile.displayName || (profile.givenName && profile.familyName ? `${profile.givenName} ${profile.familyName}` : "OAuth User");

  const newUserProfile = {
    public_id: publicId,
    name: displayName,
    email: profile.email,
    role: "customer",
    status: "active"
  };

  await executeTransaction(async (tx) => {
    // 1. Create user record
    const userResult = await usersRepository.createUser(tx, newUserProfile);

    // 2. Create credential record
    await authRepository.createCredential(tx, {
      user_id: userResult.id,
      provider: profile.provider,
      provider_id: profile.providerId,
      provider_email: profile.email,
      password_hash: null
    });

    // 3. Create session
    await authRepository.createSession(tx, {
      id: sessionId,
      user_id: userResult.id,
      refresh_token_hash: refreshHash,
      device_name: clientContext.deviceName || null,
      ip: clientContext.ip || null,
      user_agent: clientContext.userAgent || null,
      expires_at: expiresAt
    });
  });

  const accessToken = jwtUtil.generateAccessToken({
    sub: publicId,
    role: "customer",
    sid: sessionId
  });

  audit.userRegistered({
    userId: publicId,
    email: profile.email
  });

  return {
    user: userMapper.toUserDto(newUserProfile),
    accessToken,
    refreshToken,
    expiresIn: env.ACCESS_TOKEN_EXPIRY_SECONDS
  };
};

// Apple sign-in support removed from service.

/**
 * Resolves currently authenticated user context from token.
 *
 * Note: Session validation (evaluating the user's active session state in user_sessions) may be added in a
 * future optimization if immediate access-token revocation / blacklisting becomes a requirement.
 * Currently, access token checks are validation-only in middleware, with user-status checks here.
 *
 * @param {string} userId - User public UUID.
 * @returns {Promise<Object>} Mapped user profile DTO.
 */
const getMe = async (userId) => {
  const throwUnauthorized = () => {
    const err = new AppError("Authentication token is missing or invalid.", 401);
    err.errorCode = ERROR_CODES.UNAUTHORIZED;
    throw err;
  };

  if (!userId) {
    throwUnauthorized();
  }

  // 1. Find user by public UUID
  const user = await usersRepository.findUserByPublicId(userId);
  if (!user) {
    throwUnauthorized();
  }

  // 2. Check account status
  if (user.status === "deleted") {
    // Avoid exposing unnecessary account state - prefer generic unauthorized behavior
    throwUnauthorized();
  }

  if (user.status === "suspended") {
    const err = new AppError("User account is suspended.", 401);
    err.errorCode = ERROR_CODES.USER_SUSPENDED;
    throw err;
  }

  // 3. Map user profile to DTO and return
  const userDto = userMapper.toUserDto(user);
  return userDto;
};

module.exports = {
  signup,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  oauthLogin,
  getMe
};
