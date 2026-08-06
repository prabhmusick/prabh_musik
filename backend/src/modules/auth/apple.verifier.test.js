/**
 * @fileoverview Unit Tests for Apple ID Token Verifier
 */

"use strict";

const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const env = require("../../config/env");
const AppError = require("../../errors/AppError");

jest.mock("axios");
jest.mock("crypto", () => {
  const originalCrypto = jest.requireActual("crypto");
  return {
    ...originalCrypto,
    createPublicKey: jest.fn()
  };
});

jest.mock("jsonwebtoken", () => {
  class TokenExpiredError extends Error {
    constructor(message, expiredAt) {
      super(message);
      this.name = "TokenExpiredError";
      this.expiredAt = expiredAt;
    }
  }
  return {
    verify: jest.fn(),
    decode: jest.fn(),
    TokenExpiredError
  };
});

const appleVerifier = require("./apple.verifier");

describe("Apple ID Token Verification Unit Tests", () => {
  const mockKeys = [
    { kid: "key-1", kty: "RSA", n: "mock-n-1", e: "mock-e-1" },
    { kid: "key-2", kty: "RSA", n: "mock-n-2", e: "mock-e-2" }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    env.APPLE_ALLOWED_AUDIENCES = ["com.prabhmusik.app", "com.prabhmusik.service"];
    
    // Default axios get behavior
    axios.get.mockResolvedValue({ data: { keys: mockKeys } });
    
    // Default crypto.createPublicKey mock
    crypto.createPublicKey.mockReturnValue({
      export: jest.fn().mockReturnValue("mock-public-key-pem")
    });
  });

  test("✓ Valid token under Native App Audience - Should verify and return frozen DTO", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-1" } });

    const mockPayload = {
      sub: "apple-sub-123",
      aud: "com.prabhmusik.app",
      iss: "https://appleid.apple.com",
      email: "user@example.com",
      email_verified: true
    };

    jwt.verify.mockImplementation((token, key, options, cb) => {
      expect(key).toBe("mock-public-key-pem");
      cb(null, mockPayload);
    });

    const profile = await appleVerifier.verifyAppleIdToken("valid_native_token");

    expect(profile).toEqual({
      provider: "apple",
      providerId: "apple-sub-123",
      email: "user@example.com",
      emailVerified: true,
      displayName: "",
      avatarUrl: "",
      givenName: "",
      familyName: ""
    });
    expect(Object.isFrozen(profile)).toBe(true);
  });

  test("✓ Valid token under Web App Audience - Should verify and return DTO", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-2" } });

    const mockPayload = {
      sub: "apple-sub-456",
      aud: "com.prabhmusik.service",
      iss: "https://appleid.apple.com",
      email: "webuser@example.com",
      email_verified: "true"
    };

    jwt.verify.mockImplementation((token, key, options, cb) => {
      cb(null, mockPayload);
    });

    const profile = await appleVerifier.verifyAppleIdToken("valid_web_token");

    expect(profile.emailVerified).toBe(true);
    expect(profile.email).toBe("webuser@example.com");
  });

  test("✓ Invalid Audience - Should throw AppError 401 with Audience mismatch", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-1" } });

    const mockPayload = {
      sub: "apple-sub-123",
      aud: "com.unauthorized.app",
      iss: "https://appleid.apple.com",
      email: "user@example.com",
      email_verified: true
    };

    jwt.verify.mockImplementation((token, key, options, cb) => {
      cb(null, mockPayload);
    });

    await expect(appleVerifier.verifyAppleIdToken("bad_aud_token")).rejects.toThrow(
      new AppError("Apple ID Token verification failed: Audience mismatch.", 401)
    );
  });

  test("✓ Invalid Signature - Should throw AppError 401", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-1" } });

    jwt.verify.mockImplementation((token, key, options, cb) => {
      cb(new Error("invalid signature"));
    });

    await expect(appleVerifier.verifyAppleIdToken("bad_sig_token")).rejects.toThrow(
      new AppError("Apple ID Token verification failed: invalid signature", 401)
    );
  });

  test("✓ Expired Token - Should throw AppError 401", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-1" } });

    jwt.verify.mockImplementation((token, key, options, cb) => {
      cb(new jwt.TokenExpiredError("jwt expired", new Date()));
    });

    await expect(appleVerifier.verifyAppleIdToken("expired_token")).rejects.toThrow(
      new AppError("Apple ID Token verification failed: jwt expired", 401)
    );
  });

  test("✓ Malformed Token (decode returns null) - Should throw 401 key resolution failure error", async () => {
    jwt.decode.mockReturnValue(null);

    await expect(appleVerifier.verifyAppleIdToken("malformed_token")).rejects.toThrow(
      new AppError("Apple ID Token verification failed: Unable to retrieve signing keys.", 401)
    );
  });

  test("✓ Unknown kid / JWKS lookup failure / Signing key lookup timeout - Should convert to clean operational error", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "unknown-kid" } });

    // Mock axios get to simulate HTTP failure or timeout
    axios.get.mockRejectedValue(new Error("Connection timeout"));

    await expect(appleVerifier.verifyAppleIdToken("unknown_kid_token")).rejects.toThrow(
      new AppError("Apple ID Token verification failed: Unable to retrieve signing keys.", 401)
    );
  });

  test("✓ Missing sub claim - Should fail verification immediately before DTO construction", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-1" } });

    // sub claim is completely missing
    const mockPayload = {
      aud: "com.prabhmusik.app",
      iss: "https://appleid.apple.com",
      email: "user@example.com",
      email_verified: true
    };

    jwt.verify.mockImplementation((token, key, options, cb) => {
      cb(null, mockPayload);
    });

    await expect(appleVerifier.verifyAppleIdToken("no_sub_token")).rejects.toThrow(
      new AppError("Invalid Apple ID token.", 401)
    );
  });

  test("✓ Missing email claim - Should default email field to empty string", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-1" } });

    // email claim is missing
    const mockPayload = {
      sub: "apple-sub-123",
      aud: "com.prabhmusik.app",
      iss: "https://appleid.apple.com",
      email_verified: true
    };

    jwt.verify.mockImplementation((token, key, options, cb) => {
      cb(null, mockPayload);
    });

    const profile = await appleVerifier.verifyAppleIdToken("no_email_token");

    expect(profile.email).toBe("");
    expect(profile.emailVerified).toBe(true);
  });

  test("✓ Handle email_verified as false or 'false'", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-1" } });

    const mockPayload = {
      sub: "apple-sub-123",
      aud: "com.prabhmusik.app",
      iss: "https://appleid.apple.com",
      email: "user@example.com",
      email_verified: "false"
    };

    jwt.verify.mockImplementation((token, key, options, cb) => {
      cb(null, mockPayload);
    });

    const profile = await appleVerifier.verifyAppleIdToken("unverified_email_token");

    expect(profile.emailVerified).toBe(false);
  });

  test("✓ Optional Nonce Validation - Success on matching expectedNonce", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-1" } });

    const mockPayload = {
      sub: "apple-sub-123",
      aud: "com.prabhmusik.app",
      iss: "https://appleid.apple.com",
      email: "user@example.com",
      email_verified: true,
      nonce: "correct_nonce_value"
    };

    jwt.verify.mockImplementation((token, key, options, cb) => {
      cb(null, mockPayload);
    });

    const profile = await appleVerifier.verifyAppleIdToken("nonce_token", "correct_nonce_value");

    expect(profile.providerId).toBe("apple-sub-123");
  });

  test("✓ Optional Nonce Validation - Rejects on mismatched expectedNonce", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-1" } });

    const mockPayload = {
      sub: "apple-sub-123",
      aud: "com.prabhmusik.app",
      iss: "https://appleid.apple.com",
      email: "user@example.com",
      email_verified: true,
      nonce: "correct_nonce_value"
    };

    jwt.verify.mockImplementation((token, key, options, cb) => {
      cb(null, mockPayload);
    });

    await expect(
      appleVerifier.verifyAppleIdToken("nonce_token", "mismatched_nonce_value")
    ).rejects.toThrow(
      new AppError("Apple ID Token verification failed: Nonce mismatch.", 401)
    );
  });

  test("✓ Relay Email support - Captures and preserves relay domains", async () => {
    jwt.decode.mockReturnValue({ header: { kid: "key-1" } });

    const mockPayload = {
      sub: "apple-sub-123",
      aud: "com.prabhmusik.app",
      iss: "https://appleid.apple.com",
      email: "xyz@privaterelay.appleid.com",
      email_verified: true
    };

    jwt.verify.mockImplementation((token, key, options, cb) => {
      cb(null, mockPayload);
    });

    const profile = await appleVerifier.verifyAppleIdToken("relay_token");

    expect(profile.email).toBe("xyz@privaterelay.appleid.com");
  });

});
