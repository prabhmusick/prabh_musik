// Mock the service layer and cookie utility at the very top with explicit factories to prevent loading real files/db
jest.mock("./auth.service", () => ({
  signup: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
  googleLogin: jest.fn(),
  appleLogin: jest.fn(),
  getMe: jest.fn()
}));

jest.mock("../../utils/cookie", () => ({
  setRefreshCookie: jest.fn(),
  clearRefreshCookie: jest.fn(),
  getRefreshCookieOptions: jest.fn()
}));

const authController = require("./auth.controller");
const authService = require("./auth.service");
const cookieUtil = require("../../utils/cookie");
const ConflictError = require("../../errors/ConflictError");

describe("Auth Controller - signup() Unit Tests", () => {
  let req;
  let res;

  const mockResult = {
    user: {
      public_id: "8a06e9f1-ca01-447a-8fbb-7ee96df58804",
      name: "José O'Connor",
      email: "jose@example.com",
      role: "customer",
      status: "active"
    },
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9-refresh...",
    expiresIn: 900
  };

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        name: "José O'Connor",
        email: "jose@example.com",
        password: "P@ssw0rdStrength!",
        extraUnvalidatedProperty: "should_be_stripped"
      },
      headers: {
        "user-agent": "Mozilla/5.0 Browser",
        "x-forwarded-for": "1.2.3.4, 5.6.7.8"
      },
      ip: "127.0.0.1"
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  test("✓ Successful signup should return HTTP 201, correct response structure, and set refresh cookie", async () => {
    // Stub signup service to succeed
    authService.signup.mockResolvedValue(mockResult);

    await authController.signup(req, res);

    // Verify service was called once
    expect(authService.signup).toHaveBeenCalledTimes(1);

    // Verify service was called with ONLY validated fields (extra properties stripped)
    expect(authService.signup).toHaveBeenCalledWith(
      {
        name: "José O'Connor",
        email: "jose@example.com",
        password: "P@ssw0rdStrength!"
      },
      expect.objectContaining({
        ip: "1.2.3.4", // Normalized from x-forwarded-for list
        userAgent: "Mozilla/5.0 Browser"
      })
    );

    // Verify client context does not contain custom properties like deviceName
    const serviceCallArgs = authService.signup.mock.calls[0][1];
    expect(serviceCallArgs).not.toHaveProperty("deviceName");

    // Verify cookie delegation
    expect(cookieUtil.setRefreshCookie).toHaveBeenCalledTimes(1);
    expect(cookieUtil.setRefreshCookie).toHaveBeenCalledWith(res, mockResult.refreshToken);

    // Verify response format matches frozen API contract
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Account created successfully.",
      data: {
        user: mockResult.user,
        accessToken: mockResult.accessToken,
        expiresIn: 900
      }
    });
  });

  test("✓ IP Address should fall back to req.ip if x-forwarded-for header is missing", async () => {
    delete req.headers["x-forwarded-for"];
    authService.signup.mockResolvedValue(mockResult);

    await authController.signup(req, res);

    expect(authService.signup).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        ip: "127.0.0.1"
      })
    );
  });

  test("✓ Duplicate email ConflictError from service layer should propagate", async () => {
    const conflictError = new ConflictError("Email already in use.");
    authService.signup.mockRejectedValue(conflictError);

    // Express's catchAsync wrapper relies on the controller returning a rejected promise
    await expect(authController.signup(req, res)).rejects.toThrow(ConflictError);

    // Response should NOT be sent directly in the controller
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("✓ Unexpected database error from service layer should propagate", async () => {
    const unexpectedError = new Error("Database connection loss");
    authService.signup.mockRejectedValue(unexpectedError);

    await expect(authController.signup(req, res)).rejects.toThrow("Database connection loss");

    // Response should NOT be sent directly in the controller
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("✓ If cookieUtil.setRefreshCookie() throws, error propagates and no response is sent", async () => {
    authService.signup.mockResolvedValue(mockResult);
    
    // Stub cookieUtil to throw an error
    cookieUtil.setRefreshCookie.mockImplementation(() => {
      throw new Error("Unable to set cookie due to secure header locks");
    });

    await expect(authController.signup(req, res)).rejects.toThrow("Unable to set cookie due to secure header locks");

    // Ensure status and json were not sent to client by this handler (avoid duplicate response)
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
