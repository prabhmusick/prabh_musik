"use strict";

/**
 * @fileoverview Google ID Token Verifier Unit Tests
 */

jest.mock("google-auth-library", () => {
  const mOAuth2Client = {
    verifyIdToken: jest.fn()
  };
  return {
    OAuth2Client: jest.fn(() => mOAuth2Client)
  };
});

const { OAuth2Client } = require("google-auth-library");
const { verifyGoogleIdToken } = require("./google.verifier");
const AppError = require("../../errors/AppError");

describe("Google Verifier Unit Tests", () => {
  let oauthClientMock;

  beforeEach(() => {
    jest.clearAllMocks();
    oauthClientMock = new OAuth2Client();
  });

  test("✓ Valid Token - Should return a normalized immutable DTO", async () => {
    const mockPayload = {
      iss: "https://accounts.google.com",
      sub: "1234567890",
      email: "test@example.com",
      email_verified: true,
      name: "Test User",
      picture: "https://example.com/avatar.jpg"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    const result = await verifyGoogleIdToken("valid_token_xyz");

    expect(result).toEqual({
      provider: "google",
      providerId: "1234567890",
      email: "test@example.com",
      emailVerified: true,
      displayName: "Test User",
      avatarUrl: "https://example.com/avatar.jpg"
    });

    // Check immutability
    expect(Object.isFrozen(result)).toBe(true);
    expect(() => { result.email = "hacked@example.com"; }).toThrow();

    expect(oauthClientMock.verifyIdToken).toHaveBeenCalledWith({
      idToken: "valid_token_xyz",
      audience: expect.any(String)
    });
  });

  test("✓ Invalid Signature - Should throw AppError 401", async () => {
    oauthClientMock.verifyIdToken.mockRejectedValue(new Error("Invalid signature"));

    await expect(verifyGoogleIdToken("invalid_sig_token")).rejects.toThrow(AppError);
    await expect(verifyGoogleIdToken("invalid_sig_token")).rejects.toThrow("Invalid signature");
  });

  test("✓ Invalid Audience - Should throw AppError 401", async () => {
    oauthClientMock.verifyIdToken.mockRejectedValue(new Error("Wrong recipient"));

    await expect(verifyGoogleIdToken("invalid_aud_token")).rejects.toThrow(AppError);
    await expect(verifyGoogleIdToken("invalid_aud_token")).rejects.toThrow("Wrong recipient");
  });

  test("✓ Expired Token - Should throw AppError 401", async () => {
    oauthClientMock.verifyIdToken.mockRejectedValue(new Error("Token used too late"));

    await expect(verifyGoogleIdToken("expired_token")).rejects.toThrow(AppError);
    await expect(verifyGoogleIdToken("expired_token")).rejects.toThrow("Token used too late");
  });

  test("✓ Malformed Token - Should throw AppError 401", async () => {
    await expect(verifyGoogleIdToken(null)).rejects.toThrow(AppError);
    await expect(verifyGoogleIdToken(undefined)).rejects.toThrow("Malformed or missing Google ID Token");
    await expect(verifyGoogleIdToken(12345)).rejects.toThrow("Malformed or missing Google ID Token");
  });

  test("✓ Missing Email - Should throw AppError 401", async () => {
    const mockPayload = {
      iss: "accounts.google.com",
      sub: "1234567890",
      email_verified: true,
      name: "Test User"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    await expect(verifyGoogleIdToken("missing_email_token")).rejects.toThrow(AppError);
    await expect(verifyGoogleIdToken("missing_email_token")).rejects.toThrow("Missing email claim");
  });

  test("✓ Missing Subject (sub) - Should throw AppError 401", async () => {
    const mockPayload = {
      iss: "https://accounts.google.com",
      email: "test@example.com",
      email_verified: true,
      name: "Test User"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    await expect(verifyGoogleIdToken("missing_sub_token")).rejects.toThrow(AppError);
    await expect(verifyGoogleIdToken("missing_sub_token")).rejects.toThrow("Missing sub claim");
  });

  test("✓ Invalid Issuer - Should throw AppError 401", async () => {
    const mockPayload = {
      iss: "https://malicious-issuer.com",
      sub: "1234567890",
      email: "test@example.com",
      email_verified: true,
      name: "Test User"
    };

    oauthClientMock.verifyIdToken.mockResolvedValue({
      getPayload: () => mockPayload
    });

    await expect(verifyGoogleIdToken("invalid_issuer_token")).rejects.toThrow(AppError);
    await expect(verifyGoogleIdToken("invalid_issuer_token")).rejects.toThrow("Invalid issuer");
  });
});
