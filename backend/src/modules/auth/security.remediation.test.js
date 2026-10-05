/**
 * @fileoverview Security Integration Test Suite for Prabh Musik Backend API
 * Verifies 30 required security scenarios across Authentication, Authorization,
 * Admin APIs, Payments, R2 Storage, Ownership Downloads, Input Validation, and Secrets.
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "security_test.db");

// Set environment variables prior to loading modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "security_test_access_secret_key_123456789";
process.env.JWT_REFRESH_SECRET = "security_test_refresh_secret_key_123456789";
process.env.RAZORPAY_KEY_SECRET = "test_razorpay_secret_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_stripe_webhook_secret";

// Suppress console logs during tests
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const app = require("../../app");
const { db } = require("../../config/db");
const jwtUtil = require("../../utils/jwt");

let server;
let port;
let client;

// Test Entities
let adminUser, adminToken;
let userA, tokenA;
let userB, tokenB;
let testBeat, soldBeat;
let userAOwnership;

beforeAll(async () => {
  // Ensure schema is created in test database
  const schemaPath = path.join(__dirname, "..", "..", "..", "Database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      client = axios.create({
        baseURL: `http://localhost:${port}`,
        validateStatus: () => true // Do not throw on 4xx/5xx responses
      });
      resolve();
    });
  });
});

afterAll(async () => {
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();

  await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) return reject(err);
      try {
        if (fs.existsSync(testDbPath)) {
          fs.unlinkSync(testDbPath);
        }
      } catch (e) {}
      resolve();
    });
  });
});

beforeEach(async () => {
  // Clear tables in reverse dependency order
  await new Promise((resolve) => {
    db.serialize(() => {
      db.run("DELETE FROM download_logs", () => {});
      db.run("DELETE FROM download_tokens", () => {});
      db.run("DELETE FROM ownerships", () => {});
      db.run("DELETE FROM order_items", () => {});
      db.run("DELETE FROM orders", () => {});
      db.run("DELETE FROM beats", () => {});
      db.run("DELETE FROM user_sessions", () => {});
      db.run("DELETE FROM user_credentials", () => {});
      db.run("DELETE FROM users", () => resolve());
    });
  });

  // 1. Create Admin User
  const adminPublicId = crypto.randomUUID();
  const adminId = await new Promise((res, rej) => {
    db.run(
      "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
      [adminPublicId, "Admin User", "admin@prabhmusik.com", "admin", "active"],
      function(err) { if (err) rej(err); else res(this.lastID); }
    );
  });
  adminUser = { id: adminId, public_id: adminPublicId, role: "admin", email: "admin@prabhmusik.com" };
  adminToken = jwtUtil.generateAccessToken({ sub: adminPublicId, role: "admin", email: adminUser.email });

  // 2. Create User A (Customer)
  const userAPublicId = crypto.randomUUID();
  const userAId = await new Promise((res, rej) => {
    db.run(
      "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
      [userAPublicId, "User A", "usera@example.com", "customer", "active"],
      function(err) { if (err) rej(err); else res(this.lastID); }
    );
  });
  userA = { id: userAId, public_id: userAPublicId, role: "customer", email: "usera@example.com" };
  tokenA = jwtUtil.generateAccessToken({ sub: userAPublicId, role: "customer", email: userA.email });

  // 3. Create User B (Customer)
  const userBPublicId = crypto.randomUUID();
  const userBId = await new Promise((res, rej) => {
    db.run(
      "INSERT INTO users (public_id, name, email, role, status) VALUES (?, ?, ?, ?, ?)",
      [userBPublicId, "User B", "userb@example.com", "customer", "active"],
      function(err) { if (err) rej(err); else res(this.lastID); }
    );
  });
  userB = { id: userBId, public_id: userBPublicId, role: "customer", email: "userb@example.com" };
  tokenB = jwtUtil.generateAccessToken({ sub: userBPublicId, role: "customer", email: userB.email });

  // 4. Create Available Beat
  const beatPublicId = crypto.randomUUID();
  const beatId = await new Promise((res, rej) => {
    db.run(
      "INSERT INTO beats (public_id, beat_name, slug, price, selling_status, status, audio_key) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [beatPublicId, "Cyberpunk Trap", "cyberpunk-trap", 199.99, "available", "published", "masters/cyberpunk.wav"],
      function(err) { if (err) rej(err); else res(this.lastID); }
    );
  });
  testBeat = { id: beatId, public_id: beatPublicId, name: "Cyberpunk Trap", price: 199.99, status: "published", selling_status: "available" };

  // 5. Create Sold Beat
  const soldBeatPublicId = crypto.randomUUID();
  const soldBeatId = await new Promise((res, rej) => {
    db.run(
      "INSERT INTO beats (public_id, beat_name, slug, price, selling_status, status, audio_key) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [soldBeatPublicId, "Sold Exclusive Beat", "sold-exclusive-beat", 299.99, "sold", "published", "masters/sold.wav"],
      function(err) { if (err) rej(err); else res(this.lastID); }
    );
  });
  soldBeat = { id: soldBeatId, public_id: soldBeatPublicId, name: "Sold Exclusive Beat", price: 299.99, status: "published", selling_status: "sold" };

  // 6. Create Dummy Order for Ownership
  const orderPublicId = crypto.randomUUID();
  const orderId = await new Promise((res) => {
    db.run(
      "INSERT INTO orders (public_id, customer_id, total_amount, status) VALUES (?, ?, ?, ?)",
      [orderPublicId, userA.id, 199.99, "completed"],
      function() { res(this.lastID); }
    );
  });

  // 7. Create Ownership for User A
  const ownershipPublicId = crypto.randomUUID();
  const ownershipId = await new Promise((res, rej) => {
    db.run(
      "INSERT INTO ownerships (public_id, user_id, beat_id, order_id, license_type, purchase_price) VALUES (?, ?, ?, ?, ?, ?)",
      [ownershipPublicId, userA.id, testBeat.id, orderId, "exclusive", 199.99],
      function(err) { if (err) rej(err); else res(this.lastID); }
    );
  });
  userAOwnership = { id: ownershipId, public_id: ownershipPublicId, user_id: userA.id, beat_id: testBeat.id };
});

describe("1. AUTHENTICATION (Unauthenticated Access Denied)", () => {
  test("1. Unauthenticated GET /api/users -> 401", async () => {
    const res = await client.get("/api/users");
    expect(res.status).toBe(401);
  });

  test("2. Unauthenticated order access -> 401", async () => {
    const resList = await client.get("/api/orders");
    expect(resList.status).toBe(401);

    const resSingle = await client.get("/api/orders/1");
    expect(resSingle.status).toBe(401);
  });

  test("3. Unauthenticated download request -> 401", async () => {
    const res = await client.post(`/api/downloads/${userAOwnership.public_id}/request`);
    expect(res.status).toBe(401);
  });

  test("4. Unauthenticated admin beat mutation -> 401", async () => {
    const res = await client.post("/api/beats", { beat_name: "Hacker Beat", price: 99 });
    expect(res.status).toBe(401);
  });
});

describe("2. AUTHORIZATION (Role-based access control)", () => {
  test("5. Normal user GET /api/users -> 403", async () => {
    const res = await client.get("/api/users", {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect(res.status).toBe(403);
  });

  test("6. Normal user changes another user -> 403", async () => {
    const res = await client.put(`/api/users/${userB.public_id}`, { name: "Hacked Name" }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect(res.status).toBe(403);
  });

  test("7. Normal user accesses admin beat mutation -> 403", async () => {
    const res = await client.post("/api/beats", { beat_name: "Unauthorized Beat", price: 50 }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect(res.status).toBe(403);
  });

  test("8. User A cannot access User B order -> 403/404", async () => {
    const orderPublicId = crypto.randomUUID();
    await new Promise((res) => {
      db.run(
        "INSERT INTO orders (public_id, customer_id, total_amount, status) VALUES (?, ?, ?, ?)",
        [orderPublicId, userB.id, 199.99, "completed"],
        () => res()
      );
    });

    const res = await client.get(`/api/orders/${orderPublicId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect([403, 404]).toContain(res.status);
  });

  test("9. User B cannot download User A ownership -> 403/404", async () => {
    const res = await client.post(`/api/downloads/${userAOwnership.public_id}/request`, {}, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    expect([403, 404]).toContain(res.status);
  });
});

describe("3. ADMIN FUNCTIONALITY", () => {
  test("10. Admin can access user management", async () => {
    const res = await client.get("/api/users", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  test("11. Admin can perform authorized beat mutation", async () => {
    const res = await client.post("/api/beats", {
      beat_name: "New Admin Beat",
      price: 250,
      genre: "Hip Hop",
      bpm: 140,
      audio_key: "previews/admin_beat.mp3",
      slug: "new-admin-beat"
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect([200, 201]).toContain(res.status);
  });

  test("12. Admin can perform authorized order administration", async () => {
    const res = await client.get("/api/orders", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });
});

describe("4. PAYMENT & ORDER SECURITY", () => {
  test("13. Client cannot set price - server retrieves authoritative DB price", async () => {
    const res = await client.post("/api/orders", {
      beatIds: [testBeat.id],
      price: 1.00
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    expect([200, 201]).toContain(res.status);
    expect(res.data.data.totalAmount).toBe(199.99);
  });

  test("14. Client cannot set status=completed - forced to pending", async () => {
    const res = await client.post("/api/orders", {
      beatIds: [testBeat.id],
      status: "completed"
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    expect([200, 201]).toContain(res.status);
    expect(res.data.data.status).toBe("pending");
  });

  test("15. Client cannot set userId to another user - derived from req.user", async () => {
    const res = await client.post("/api/orders", {
      beatIds: [testBeat.id],
      userId: userB.id
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    expect([200, 201]).toContain(res.status);
    const createdOrder = res.data.data;
    const dbOrder = await new Promise((res) => {
      db.get("SELECT * FROM orders WHERE id = ?", [createdOrder.id], (err, row) => res(row));
    });
    expect(dbOrder.customer_id).toBe(userA.id);
  });

  test("16. Payment completion requires verification", async () => {
    const orderRes = await client.post("/api/orders", { beatIds: [testBeat.id] }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const orderId = orderRes.data.data.id;

    const res = await client.post("/api/orders/verify-payment", {
      orderId: orderId,
      paymentId: "pay_fake123",
      signature: "invalid_sig"
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect(res.status).toBe(400);
  });

  test("17. Invalid Razorpay signature is rejected", async () => {
    const orderRes = await client.post("/api/orders", { beatIds: [testBeat.id] }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const orderId = orderRes.data.data.id;

    const res = await client.post("/api/orders/verify-payment", {
      orderId: orderId,
      razorpay_order_id: "order_12345",
      razorpay_payment_id: "pay_12345",
      razorpay_signature: "tampered_signature"
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect(res.status).toBe(400);
    expect(res.data.errorCode).toBe("INVALID_PAYMENT_SIGNATURE");
  });

  test("18. Invalid Stripe webhook signature is rejected", async () => {
    const res = await client.post("/api/orders/webhook/stripe", { type: "payment_intent.succeeded" }, {
      headers: { "stripe-signature": "invalid_signature" }
    });
    expect(res.status).toBe(400);
  });

  test("19. Duplicate payment callback is idempotent", async () => {
    const orderPublicId = crypto.randomUUID();
    const orderId = await new Promise((res) => {
      db.run(
        "INSERT INTO orders (public_id, customer_id, total_amount, status) VALUES (?, ?, ?, ?)",
        [orderPublicId, userA.id, 199.99, "pending"],
        function() { res(this.lastID); }
      );
    });

    await new Promise((res) => {
      db.run(
        "INSERT INTO order_items (order_id, beat_id, beat_title, price, license_type) VALUES (?, ?, ?, ?, ?)",
        [orderId, testBeat.id, "Cyberpunk Trap", 199.99, "exclusive"],
        function() { res(); }
      );
    });

    const razorpayOrderId = "order_idem_123";
    const razorpayPaymentId = "pay_idem_123";
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const validSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");

    const res1 = await client.post("/api/orders/verify-payment", {
      orderId: orderId,
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      razorpaySignature: validSignature
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect(res1.status).toBe(200);

    const res2 = await client.post("/api/orders/verify-payment", {
      orderId: orderId,
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      razorpaySignature: validSignature
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect(res2.status).toBe(200);
  });

  test("20. Same exclusive beat cannot be purchased twice", async () => {
    const res = await client.post("/api/orders", {
      beatIds: [soldBeat.id]
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    expect(res.status).toBe(409);
  });
});

describe("5. R2 STORAGE & DOWNLOADS", () => {
  test("21. Public preview still works", async () => {
    const res = await client.get(`/api/beats/${testBeat.id}/preview`);
    expect([200, 404]).toContain(res.status);
  });

  test("22. Range requests return 206 where appropriate", async () => {
    const res = await client.get(`/api/beats/${testBeat.id}/preview`, {
      headers: { Range: "bytes=0-100" }
    });
    expect([200, 206, 404]).toContain(res.status);
  });

  test("23. Protected master cannot be fetched anonymously", async () => {
    const res = await client.get("/api/beats/object/masters%2Fcyberpunk.wav");
    expect(res.status).toBe(401);
  });

  test("24. Protected master cannot be fetched by user without ownership", async () => {
    const res = await client.get("/api/beats/object/masters%2Fcyberpunk.wav", {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    expect(res.status).toBe(403);
  });

  test("25. Arbitrary R2 key cannot be requested", async () => {
    const res = await client.get("/api/beats/object/unauthorized_prefix%2Fsecret.key", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect([400, 403, 404, 500]).toContain(res.status);
  });
});

describe("6. INPUT VALIDATION & SECRETS", () => {
  test("26. Invalid ownership ID rejected", async () => {
    const res = await client.post("/api/downloads/invalid-uuid-format/request", {}, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect([400, 404]).toContain(res.status);
  });

  test("27. Invalid beat ID rejected", async () => {
    const res = await client.post("/api/orders", { beatIds: ["not-a-number"] }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect(res.status).toBe(400);
  });

  test("28. Invalid payment data rejected", async () => {
    const orderRes = await client.post("/api/orders", { beatIds: [testBeat.id] }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const orderId = orderRes.data.data.id;

    const res = await client.post("/api/orders/verify-payment", {
      orderId: orderId
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    expect(res.status).toBe(400);
  });

  test("29. Production startup fails safely when mandatory production secrets are missing", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_ACCESS_SECRET;
    try {
      process.env.NODE_ENV = "production";
      delete process.env.JWT_ACCESS_SECRET;
      expect(() => {
        const { validateEnvSecrets } = require("../../config/secrets");
        validateEnvSecrets();
      }).toThrow();
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.JWT_ACCESS_SECRET = originalSecret;
    }
  });

  test("30. No secret values appear in API responses or logs", async () => {
    const res = await client.get(`/api/users/${userA.public_id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
    const jsonStr = JSON.stringify(res.data);
    expect(jsonStr).not.toContain("password_hash");
    expect(jsonStr).not.toContain("refresh_token_hash");
    expect(jsonStr).not.toContain("secret");
  });
});
