/**
 * @fileoverview Integration Tests for Stripe Webhook Processing, Idempotency, and Transactions
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "payments_webhook_test.db");

// Configure overrides before loading modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "webhook_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "webhook_test_refresh_secret_key";
process.env.STRIPE_WEBHOOK_SECRET = "test_webhook_sec";

jest.setTimeout(30000);

// Mock AWS S3 client to bypass network operations
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://mock-signed-r2-url.com/beat.mp3?token=mocked")
}));

// Suppress console output to keep Jest logs clean
// const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
// const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
// const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const app = require("../../app");
const { db } = require("../../config/db");
const paymentsService = require("./payments.service");
const downloadsService = require("../downloads/downloads.service");

let server;
let port;
let client;

// Setup mock for constructWebhookEvent to simulate Stripe validation
let signatureMockBehavior = "valid"; // "valid", "invalid", "missing"
jest.spyOn(paymentsService, "constructWebhookEvent").mockImplementation((rawBody, signatureHeader) => {
  if (signatureHeader === "invalid-signature" || signatureMockBehavior === "invalid") {
    const AppError = require("../../errors/AppError");
    throw new AppError("Webhook signature verification failed", 400);
  }
  return JSON.parse(rawBody.toString());
});

const seedDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Insert mock users
      db.run(
        `INSERT INTO users (id, public_id, email, name, role, status) VALUES 
         (1, 'usr_admin', 'admin@example.com', 'Admin User', 'admin', 'active'),
         (2, 'usr_custA', 'customera@example.com', 'Customer A', 'customer', 'active')`,
        [],
        (err) => {
          if (err) return reject(err);

          // 2. Insert mock beats
          db.run(
            `INSERT INTO beats (id, public_id, title, slug, price_amount, currency_code, audio_key, status, created_by) VALUES 
             (101, 'bt_101', 'Test Beat', 'test-beat', 9900, 'INR', 'audio/101.mp3', 'published', 1)`,
            [],
            (err2) => {
              if (err2) return reject(err2);

              // 3. Seed a dummy order to prevent constraint failure on ownership
              db.run(
                `INSERT INTO orders (id, public_id, customer_id, total_amount, payment_method, status) VALUES 
                 (99, 'ord_99', 2, 9900, 'card', 'paid')`,
                [],
                (err3) => {
                  if (err3) return reject(err3);

                  // 4. Seed an ownership record for User ID 2 so that token hashing tests can pass
                  db.run(
                    `INSERT INTO ownerships (id, public_id, user_id, beat_id, order_id, license_type, purchase_price, download_count, status) VALUES
                     (999, 'own_999', 2, 101, 99, 'exclusive', 9900, 0, 'active')`,
                    [],
                    (err4) => {
                      if (err4) reject(err4);
                      else resolve();
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
};

beforeAll(async () => {
  // Initialize Schema on SQLite
  const schemaPath = path.join(__dirname, "..", "..", "..", "Database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  await seedDatabase();

  // Spin up Express App
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      client = axios.create({
        baseURL: `http://localhost:${port}`,
        validateStatus: () => true
      });
      resolve();
    });
  });
});

afterAll(async () => {
  // consoleLogSpy.mockRestore();
  // consoleWarnSpy.mockRestore();
  // consoleErrorSpy.mockRestore();

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

describe("Stripe Webhooks & Fulfillments Integration Tests", () => {
  beforeEach(async () => {
    signatureMockBehavior = "valid";
    
    // Reset database state between tests to ensure strict test isolation
    await new Promise((resolve) => {
      db.serialize(() => {
        db.run("UPDATE beats SET status = 'published' WHERE id = 101");
        db.run("DELETE FROM orders");
        db.run("DELETE FROM order_items");
        db.run("DELETE FROM processed_webhook_events");
        db.run("DELETE FROM ownerships WHERE id != 999", [], () => resolve());
      });
    });
  });

  describe("POST /api/payments/webhook", () => {
    test("Should reject request if stripe-signature header is missing", async () => {
      const res = await client.post("/api/payments/webhook", { id: "evt_1" });
      expect(res.status).toBe(400);
      expect(res.data.error.message).toContain("Missing Stripe signature");
    });

    test("Should reject request if signature verification fails", async () => {
      signatureMockBehavior = "invalid";
      const res = await client.post("/api/payments/webhook", { id: "evt_2" }, {
        headers: { "stripe-signature": "invalid-signature" }
      });
      expect(res.status).toBe(400);
      expect(res.data.error.message).toContain("verification failed");
    });

    test("Should process checkout.session.completed and fulfill order successfully", async () => {
      const eventId = "evt_session_success_1";
      const paymentIntentId = "pi_session_success_1";

      const payload = {
        id: eventId,
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_1",
            payment_status: "paid",
            payment_intent: paymentIntentId,
            customer_email: "customera@example.com",
            payment_method_types: ["card"],
            metadata: {
              email: "customera@example.com",
              beats: JSON.stringify([101])
            }
          }
        }
      };

      const res = await client.post("/api/payments/webhook", payload, {
        headers: { "stripe-signature": "valid-sig" }
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.eventId).toBe(eventId);

      // Verify order table has been updated
      const order = await new Promise((resolve) => {
        db.get("SELECT * FROM orders WHERE payment_reference = ?", [paymentIntentId], (err, row) => resolve(row));
      });
      expect(order).toBeDefined();
      expect(order.status).toBe("paid");
      expect(order.fulfillment_status).toBe("completed");

      // Verify ownership record is created
      const ownership = await new Promise((resolve) => {
        db.get("SELECT * FROM ownerships WHERE order_id = ?", [order.id], (err, row) => resolve(row));
      });
      expect(ownership).toBeDefined();
      expect(ownership.user_id).toBe(2);
      expect(ownership.beat_id).toBe(101);

      // Verify webhook event log is marked as PROCESSED
      const eventLog = await new Promise((resolve) => {
        db.get("SELECT * FROM processed_webhook_events WHERE event_id = ?", [eventId], (err, row) => resolve(row));
      });
      expect(eventLog).toBeDefined();
      expect(eventLog.status).toBe("PROCESSED");
    });

    test("Should execute idempotently and skip duplicate events", async () => {
      const eventId = "evt_duplicate_test";
      const paymentIntentId = "pi_duplicate_test";

      const payload = {
        id: eventId,
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_dup",
            payment_status: "paid",
            payment_intent: paymentIntentId,
            customer_email: "customera@example.com",
            payment_method_types: ["card"],
            metadata: {
              email: "customera@example.com",
              beats: JSON.stringify([101])
            }
          }
        }
      };

      // Send first time
      const res1 = await client.post("/api/payments/webhook", payload, {
        headers: { "stripe-signature": "valid-sig" }
      });
      expect(res1.status).toBe(200);
      expect(res1.data.skipped).toBe(false);

      // Verify order count
      const initialOrders = await new Promise((resolve) => {
        db.all("SELECT * FROM orders WHERE payment_reference = ?", [paymentIntentId], (err, rows) => resolve(rows));
      });
      expect(initialOrders.length).toBe(1);

      // Send second time (duplicate)
      const res2 = await client.post("/api/payments/webhook", payload, {
        headers: { "stripe-signature": "valid-sig" }
      });
      expect(res2.status).toBe(200);
      expect(res2.data.skipped).toBe(true);

      // Verify order count is still exactly 1
      const finalOrders = await new Promise((resolve) => {
        db.all("SELECT * FROM orders WHERE payment_reference = ?", [paymentIntentId], (err, rows) => resolve(rows));
      });
      expect(finalOrders.length).toBe(1);
    });

    test("Should roll back transaction on fulfillment execution failure", async () => {
      const eventId = "evt_rollback_test";
      const paymentIntentId = "pi_rollback_test";

      // Injecting dynamic failure inside orderConfirmation path:
      // We pass a beat ID that is valid (101) but mock beats service handleOrderFulfillment to throw.
      const beatsService = require("../beats/beats.service");
      const originalHandle = beatsService.handleOrderFulfillment;
      beatsService.handleOrderFulfillment = jest.fn().mockRejectedValue(new Error("Mock handleOrderFulfillment Crash"));

      const payload = {
        id: eventId,
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_rollback",
            payment_status: "paid",
            payment_intent: paymentIntentId,
            customer_email: "customera@example.com",
            payment_method_types: ["card"],
            metadata: {
              email: "customera@example.com",
              beats: JSON.stringify([101])
            }
          }
        }
      };

      const res = await client.post("/api/payments/webhook", payload, {
        headers: { "stripe-signature": "valid-sig" }
      });

      // Expecting 500 error since the transaction handler throws
      expect(res.status).toBe(500);

      // Verify that order record does NOT exist (due to rollback of transaction)
      const order = await new Promise((resolve) => {
        db.get("SELECT * FROM orders WHERE payment_reference = ?", [paymentIntentId], (err, row) => resolve(row));
      });
      expect(order).toBeNull();

      // Verify that webhook event log is marked as FAILED with failure reason
      const eventLog = await new Promise((resolve) => {
        db.get("SELECT * FROM processed_webhook_events WHERE event_id = ?", [eventId], (err, row) => resolve(row));
      });
      expect(eventLog).toBeDefined();
      expect(eventLog.status).toBe("FAILED");
      expect(eventLog.failure_reason).toContain("Mock handleOrderFulfillment Crash");

      // Restore mock
      beatsService.handleOrderFulfillment = originalHandle;
    });

    test("Should skip and ignore unsupported events", async () => {
      const eventId = "evt_unsupported_test";
      const payload = {
        id: eventId,
        type: "customer.created",
        data: {
          object: {
            id: "cus_123"
          }
        }
      };

      const res = await client.post("/api/payments/webhook", payload, {
        headers: { "stripe-signature": "valid-sig" }
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);

      const eventLog = await new Promise((resolve) => {
        db.get("SELECT * FROM processed_webhook_events WHERE event_id = ?", [eventId], (err, row) => resolve(row));
      });
      expect(eventLog).toBeDefined();
      expect(eventLog.status).toBe("PROCESSED");
    });
  });

  describe("Download Token Hashing Verification", () => {
    test("Should persist token only as SHA-256 hash and match successfully during retrieval", async () => {
      // 1. Get user ownership profile
      const ownership = await new Promise((resolve) => {
        db.get("SELECT * FROM ownerships WHERE user_id = 2 LIMIT 1", [], (err, row) => resolve(row));
      });
      expect(ownership).toBeDefined();

      // 2. Request download token
      const result = await downloadsService.requestDownloadToken(2, ownership.id);
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined(); // The plaintext token

      // 3. Inspect database table download_tokens to verify hash is stored
      const tokenRecord = await new Promise((resolve) => {
        db.get("SELECT * FROM download_tokens WHERE ownership_id = ?", [ownership.id], (err, row) => resolve(row));
      });
      expect(tokenRecord).toBeDefined();
      expect(tokenRecord.token).not.toBe(result.token); // Should not match plaintext token!
      
      const computedHash = crypto.createHash("sha256").update(result.token).digest("hex");
      expect(tokenRecord.token).toBe(computedHash); // Must be a SHA-256 hex string

      // 4. Verify download using executeDownload succeeds with plaintext token
      const downloadResult = await downloadsService.executeDownload(result.token, "127.0.0.1", "Jest-Test");
      expect(downloadResult.presignedUrl).toContain("mock-signed-r2-url.com");

      // 5. Verify download fails with invalid token
      await expect(downloadsService.executeDownload("invalid-token", "127.0.0.1", "Jest-Test"))
        .rejects.toThrow("Invalid download token");
    });
  });
});
