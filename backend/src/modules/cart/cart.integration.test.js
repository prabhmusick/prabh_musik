/**
 * @fileoverview Integration tests for Cart persistence, metadata consistency, and price integrity.
 */

const { db } = require("../../config/db");
const cartService = require("./cart.service");
const paymentsService = require("../payments/payments.service");
const paymentsController = require("../payments/payments.controller");

jest.mock("../payments/payments.service");

describe("Cart and Pricing Integrity Tests", () => {
  const testUserPublicId = "usr_cart_test_999";
  const testUserId = 999;

  beforeAll(async () => {
    // Clean up first
    await db.prepare("DELETE FROM cart_items WHERE user_id = ?").bind(testUserId).run();
    await db.prepare("DELETE FROM beats WHERE id IN (501, 502, 503)").run();
    await db.prepare("DELETE FROM users WHERE id = ?").bind(testUserId).run();

    // Seed test user using standard INSERT INTO supported by MemoryDB
    await db
      .prepare(
        "INSERT INTO users (id, public_id, email, name, role, status) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(
        testUserId,
        testUserPublicId,
        "cart_tester@example.com",
        "Cart Tester",
        "customer",
        "active",
      )
      .run();

    // Seed beats: one ₹249.99 beat by Shiv and one ₹99.00 beat
    await db
      .prepare(
        `INSERT INTO beats 
        (id, public_id, title, slug, genre, audio_key, status, price_amount, duration, created_by, related_artist_name, bpm) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        501,
        "bt_shiv_24999",
        "Urban Trap Anthem",
        "urban-trap-anthem-test",
        "Trap",
        "audio_501.mp3",
        "published",
        24999, // 249.99 INR in paise
        195,
        testUserId,
        "Shiv",
        140,
      )
      .run();

    await db
      .prepare(
        `INSERT INTO beats 
        (id, public_id, title, slug, genre, audio_key, status, price_amount, duration, created_by, related_artist_name, bpm) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        502,
        "bt_prabh_9900",
        "Chill Lofi",
        "chill-lofi-test",
        "Lofi",
        "audio_502.mp3",
        "published",
        9900, // 99.00 INR in paise
        150,
        testUserId,
        "Prabh Musik",
        85,
      )
      .run();
  });

  afterAll(async () => {
    await db
      .prepare("DELETE FROM cart_items WHERE user_id = ?")
      .bind(testUserId)
      .run();
    await db
      .prepare("DELETE FROM beats WHERE id IN (501, 502, 503)")
      .run();
    await db
      .prepare("DELETE FROM users WHERE id = ?")
      .bind(testUserId)
      .run();
  });

  test("1. Successfully persists and retrieves ₹249.99 beat by Shiv with canonical metadata", async () => {
    const items = await cartService.replaceCart(testUserPublicId, [
      { id: "bt_shiv_24999" },
    ]);

    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item.id).toBe("bt_shiv_24999");
    expect(item.title).toBe("Urban Trap Anthem");
    expect(item.producer).toBe("Shiv");
    expect(item.artist).toBe("Shiv");
    expect(item.genre).toBe("Trap");
    expect(item.bpm).toBe(140);
    expect(item.price).toBe(249.99); // Exactly ₹249.99 in standard rupees, never 0 or paise
  });

  test("2. Supports adding multiple beats with different prices and maintains accurate total", async () => {
    const items = await cartService.replaceCart(testUserPublicId, [
      { id: "bt_shiv_24999" },
      { id: "bt_prabh_9900" },
    ]);

    expect(items).toHaveLength(2);
    const prices = items.map((i) => i.price);
    expect(prices).toContain(249.99);
    expect(prices).toContain(99);

    const subtotal = items.reduce((sum, i) => sum + i.price, 0);
    expect(Math.round(subtotal * 100) / 100).toBe(348.99);
  });

  test("3. Supports lookup and persistence by numeric ID or public ID", async () => {
    const items = await cartService.replaceCart(testUserPublicId, [
      { id: 501 },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("bt_shiv_24999");
    expect(items[0].price).toBe(249.99);
  });

  test("4. Removing an item updates cart correctly", async () => {
    await cartService.replaceCart(testUserPublicId, [
      { id: "bt_shiv_24999" },
      { id: "bt_prabh_9900" },
    ]);

    const remaining = await cartService.removeFromCart(
      testUserPublicId,
      "bt_shiv_24999",
    );
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe("bt_prabh_9900");
    expect(remaining[0].price).toBe(99);
  });

  test("5. Clearing the cart leaves 0 items", async () => {
    const cleared = await cartService.replaceCart(testUserPublicId, []);
    expect(cleared).toHaveLength(0);
  });

  test("6. Backend ignores client-tampered price and uses authoritative DB amount (24999 paise)", async () => {
    paymentsService.createCheckoutSession.mockImplementation(async (params) => ({
      sessionId: "sess_mock_123",
      orderId: "order_mock_123",
      amount: params.amount,
      currency: params.currency,
      keyId: "rzp_test_key",
    }));

    const req = {
      user: { id: testUserPublicId },
      body: {
        currency: "INR",
        email: "cart_tester@example.com",
        beats: [
          {
            id: "bt_shiv_24999",
            title: "Urban Trap Anthem",
            price: 1.0, // Malicious tampered client price!
          },
        ],
      },
      protocol: "http",
      get: () => "localhost:5005",
    };

    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        return res;
      },
      status: (code) => ({
        json: (data) => {
          responseData = { statusCode: code, ...data };
        },
      }),
    };

    await paymentsController.createCheckoutSession(req, res, () => {});

    expect(responseData).not.toBeNull();
    // Authoritative amount in paise must be 24999 (₹249.99), completely ignoring client-provided 1.0!
    expect(responseData.amount).toBe(24999);
  });

  test("7. Unpublished or archived beat cannot be checked out", async () => {
    // Create draft beat
    await db
      .prepare(
        `INSERT INTO beats 
        (id, public_id, title, slug, genre, audio_key, status, price_amount, duration, created_by, related_artist_name) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        503,
        "bt_draft_503",
        "Unpublished Beat",
        "unpublished-beat",
        "Trap",
        "draft.mp3",
        "draft",
        19900,
        180,
        testUserId,
        "Shiv",
      )
      .run();

    const req = {
      user: { id: testUserPublicId },
      body: {
        currency: "INR",
        email: "cart_tester@example.com",
        beats: [{ id: "bt_draft_503" }],
      },
      protocol: "http",
      get: () => "localhost:5005",
    };

    let errorResponse = null;
    const res = {
      json: () => {},
      status: (code) => ({
        json: (data) => {
          errorResponse = { statusCode: code, ...data };
        },
      }),
    };

    await paymentsController.createCheckoutSession(req, res, () => {});

    expect(errorResponse).not.toBeNull();
    expect(errorResponse.statusCode).toBe(400);
    expect(errorResponse.error).toMatch(/no longer available/i);
  });
});
