const paymentsController = require("./payments.controller");
const paymentsService = require("./payments.service");
const beatsRepository = require("../beats/beats.repository");
const usersRepository = require("../users/users.repository");

jest.mock("./payments.service");
jest.mock("../beats/beats.repository");
jest.mock("../users/users.repository");

describe("payments.controller - createCheckoutSession", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: "usr_123" },
      body: {
        email: "customer@example.com",
        beats: [{ id: "beat_101", title: "Untrusted Client Title", price: 0 }],
      },
      protocol: "http",
      get: jest.fn().mockReturnValue("localhost:5000"),
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  it("rejects unauthenticated requests with 401", async () => {
    req.user = null;

    await paymentsController.createCheckoutSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/Authentication token is missing/i) })
    );
  });

  it("rejects empty cart with 400", async () => {
    usersRepository.findUserByPublicId.mockResolvedValue({ id: 1, email: "customer@example.com" });
    req.body.beats = [];

    await paymentsController.createCheckoutSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "At least one beat is required for checkout" });
  });

  it("rejects non-existent beats with 404", async () => {
    usersRepository.findUserByPublicId.mockResolvedValue({ id: 1, email: "customer@example.com" });
    beatsRepository.findByPublicId.mockResolvedValue(null);

    await paymentsController.createCheckoutSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Beat not found: ID beat_101" });
  });

  it("rejects archived beats with 409 Conflict", async () => {
    usersRepository.findUserByPublicId.mockResolvedValue({ id: 1, email: "customer@example.com" });
    beatsRepository.findByPublicId.mockResolvedValue({
      id: 101,
      public_id: "beat_101",
      title: "Archived Exclusive",
      status: "archived",
      price_amount: 150000,
    });

    await paymentsController.createCheckoutSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Cannot purchase archived beat: "Archived Exclusive"',
    });
  });

  it("calculates authoritative database price and ignores client-submitted price", async () => {
    usersRepository.findUserByPublicId.mockResolvedValue({ id: 1, email: "customer@example.com" });
    beatsRepository.findByPublicId.mockResolvedValue({
      id: 101,
      public_id: "beat_101",
      title: "Hard Trap Beat",
      status: "published",
      price_amount: 199900, // ₹1,999.00 in paise
    });

    paymentsService.createCheckoutSession.mockResolvedValue({
      orderId: "order_mock_123",
      amount: 199900,
      currency: "INR",
      keyId: "rzp_test_key",
    });

    // Client maliciously attempts to send amount: 0 or free
    req.body.amount = 0;
    req.body.beats = [{ id: "beat_101", price: 0 }];

    await paymentsController.createCheckoutSession(req, res, next);

    // Verify paymentsService was called with DB authoritative amount (199900 paise)
    expect(paymentsService.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 199900,
        currency: "INR",
        email: "customer@example.com",
        beats: [
          expect.objectContaining({
            id: "beat_101",
            title: "Hard Trap Beat",
            price: 1999,
            price_amount: 199900,
          }),
        ],
      })
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order_mock_123",
        amount: 199900,
        currency: "INR",
      })
    );
  });
});
