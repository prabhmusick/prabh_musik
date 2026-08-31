const service = require("./auth.service");
const cookieUtil = require("../../utils/cookie");
const googleVerifier = require("./google.verifier");

/**
 * Handle user registration request.
 * POST /api/auth/signup
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
const signup = async (req, res) => {
  // Extract and normalize client IP addressing to support reverse proxies
  let ip = req.headers["x-forwarded-for"] || req.ip || null;
  if (ip && typeof ip === "string") {
    ip = ip.split(",")[0].trim();
  }

  const clientContext = {
    ip,
    userAgent: req.headers["user-agent"] || null
  };

  // Only pass validated and normalized payload produced by the validator
  const validatedPayload = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  };

  const result = await service.signup(validatedPayload, clientContext);

  // Delegate cookie generation entirely to the cookie utility
  cookieUtil.setRefreshCookie(res, result.refreshToken);

  return res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn
    }
  });
};

/**
 * Handle user login credentials authentication.
 */
const login = async (req, res) => {
  // Extract and normalize client IP addressing to support reverse proxies
  let ip = req.headers["x-forwarded-for"] || req.ip || null;
  if (ip && typeof ip === "string") {
    ip = ip.split(",")[0].trim();
  }

  const clientContext = {
    ip,
    userAgent: req.headers["user-agent"] || null,
    requestId: req.id
  };

  // Only pass validated fields
  const validatedPayload = {
    email: req.body.email,
    password: req.body.password
  };

  const result = await service.login(validatedPayload, clientContext);

  // Delegate cookie generation entirely to the cookie utility
  cookieUtil.setRefreshCookie(res, result.refreshToken);

  return res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn
    }
  });
};

/**
 * Handle user session logout.
 */
const logout = async (req, res) => {
  const token = req.cookies ? req.cookies.refreshToken : null;

  const clientContext = {
    requestId: req.id
  };

  await service.logout(token, clientContext);

  // Clear cookie always to ensure client state resets cleanly
  cookieUtil.clearRefreshCookie(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully."
  });
};

/**
 * Refresh expired access tokens using refresh token cookies.
 */
const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  // Extract and normalize client IP addressing to support reverse proxies
  let ip = req.headers["x-forwarded-for"] || req.ip || null;
  if (ip && typeof ip === "string") {
    ip = ip.split(",")[0].trim();
  }

  const clientContext = {
    ip,
    userAgent: req.headers["user-agent"] || null,
    requestId: req.id
  };

  const result = await service.refreshToken(token, clientContext);

  // Delegate cookie generation entirely to the cookie utility
  cookieUtil.setRefreshCookie(res, result.refreshToken);

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully.",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn
    }
  });
};

/**
 * Retrieve authenticated user context metadata.
 */
const getMe = async (req, res) => {
  const userId = req.user ? req.user.id : null;

  const result = await service.getMe(userId);

  return res.status(200).json({
    success: true,
    message: "User profile fetched successfully.",
    data: {
      user: result
    }
  });
};

/**
 * Trigger forgot password email request.
 */
const forgotPassword = async (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented" });
};

/**
 * Perform actual user password reset flow.
 */
const resetPassword = async (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented" });
};

/**
 * Verify user email account matching verification token.
 */
const verifyEmail = async (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented" });
};

/**
 * Resend verification link email to user.
 */
const resendVerification = async (req, res) => {
  res.status(501).json({ success: false, message: "Not implemented" });
};

const googleLogin = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: "Google ID Token is required."
    });
  }

  let ip = req.headers["x-forwarded-for"] || req.ip || null;
  if (ip && typeof ip === "string") {
    ip = ip.split(",")[0].trim();
  }

  const clientContext = {
    ip,
    userAgent: req.headers["user-agent"] || null,
    requestId: req.id
  };

  const profile = await googleVerifier.verifyGoogleIdToken(idToken);
  const result = await service.oauthLogin(profile, clientContext);

  // Delegate cookie generation entirely to the cookie utility
  cookieUtil.setRefreshCookie(res, result.refreshToken);

  return res.status(200).json({
    success: true,
    message: "Logged in with Google successfully.",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn
    }
  });
};

// Apple sign-in handler removed.

module.exports = {
  signup,
  login,
  logout,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleLogin,
  // appleLogin removed
};
