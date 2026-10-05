/**
 * @fileoverview Integration Tests for Orders and Payments Confirmation
 */

const http = require("http");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const testDbPath = path.join(__dirname, "..", "..", "..", "Database", "orders_integration_test.db");

// Set environment variables before loading modules
process.env.DB_FILE = testDbPath;
process.env.JWT_ACCESS_SECRET = "orders_integration_test_access_secret_key";
process.env.JWT_REFRESH_SECRET = "orders_integration_test_refresh_secret_key";
process.env.STRIPE_SECRET_KEY = "sk_test_mock_integration_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock_integration_key";

// Suppress console output to keep Jest logs clean
const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

const app = require("../../app");
const { db } = require("../../config/db");
const D1DatabaseMock = (new db.constructor()).constructor;
["exec", "close", "serialize", "run", "get", "all"].forEach((method) => {
  D1DatabaseMock.prototype[method] = function (...args) {
    return this.sqliteDb[method](...args);
  };
});

const ordersService = require("./orders.service");
const ordersRepository = require("./orders.repository");

let server;
let port;
let client;

// Helper to seed a test user and test beat
const seedData = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Insert test user
      db.run(
        `INSERT INTO users (id, public_id, email, name, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [101, "usr_test101", "customer@example.com", "John Doe", "customer", "active"],
        (err) => {
          if (err) return reject(err);

          // Insert test beat
          db.run(
            `INSERT INTO beats (id, public_id, title, slug, price_amount, currency_code, audio_key, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [201, "bt_test201", "Midnight Ride", "midnight-ride", 14999, "INR", "audio/bt_test201.mp3", "published", 101],
            (err2) => {
              if (err2) reject(err2);
              else resolve();
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

  await seedData();

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
  consoleLogSpy.mockRestore();
  consoleWarnSpy.mockRestore();
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

describe("Orders & Payments Integration Tests", () => {
  describe("POST /api/orders (Order Creation)", () => {
    test("Should fail if request payload is completely empty", async () => {
      const res = await client.post("/api/orders", {});
      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    test("Should fail if customerId is missing or invalid", async () => {
      const res = await client.post("/api/orders", {
        beatIds: [201],
        paymentMethod: "card"
      });
      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    test("Should create a pending order successfully with valid parameters", async () => {
      const res = await client.post("/api/orders", {
        customerId: 101,
        beatIds: [201],
        paymentMethod: "card"
      });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      expect(res.data.data.status).toBe("pending");
      expect(res.data.data.totalAmount).toBe(14999);
      expect(res.data.data.items[0].beatId).toBe(201);
    });
  });

  describe("OrdersService.confirmPayment() (Idempotency and Replays)", () => {
    test("Should create and fulfill a new order on first payment confirmation", async () => {
      const order = await ordersService.confirmPayment({
        email: "customer@example.com",
        beatIds: [201],
        paymentReference: "pi_test_12345",
        paymentMethod: "card"
      });

      expect(order).toBeDefined();
      expect(order.status).toBe("paid");
      expect(order.fulfillmentStatus).toBe("completed");
      expect(order.paymentMethod).toBe("card");

      // Verify it was written to DB
      const dbOrder = await ordersRepository.getOrderByPaymentReference("pi_test_12345");
      expect(dbOrder).toBeDefined();
      expect(dbOrder.status).toBe("paid");
    });

    test("Should trigger idempotency guard and return same order on duplicate confirmation requests", async () => {
      // Request duplicate payment confirmation
      const order = await ordersService.confirmPayment({
        email: "customer@example.com",
        beatIds: [201],
        paymentReference: "pi_test_12345",
        paymentMethod: "card"
      });

      expect(order).toBeDefined();
      expect(order.status).toBe("paid");

      // Count orders matching reference in the database to verify no duplicate row was created
      const count = await new Promise((resolve) => {
        db.get("SELECT COUNT(*) as cnt FROM orders WHERE payment_reference = ?", ["pi_test_12345"], (err, row) => {
          resolve(row ? row.cnt : 0);
        });
      });
      expect(count).toBe(1);
    });
  });

  describe("OrdersRepository Transaction Rollback", () => {
    test("Should rollback order insertion if order item insert fails", async () => {
      const initialCount = await new Promise((resolve) => {
        db.get("SELECT COUNT(*) as cnt FROM orders", [], (err, row) => {
          resolve(row ? row.cnt : 0);
        });
      });

      // Pass an invalid structure in items list which would fail SQL insert (missing fields)
      await expect(
        ordersRepository.createOrder(
          101,
          9999,
          "card",
          "pending",
          [{ beatId: null, beatTitle: null, price: null }]
        )
      ).rejects.toThrow();

      // Verify no order was inserted
      const finalCount = await new Promise((resolve) => {
        db.get("SELECT COUNT(*) as cnt FROM orders", [], (err, row) => {
          resolve(row ? row.cnt : 0);
        });
      });
      expect(finalCount).toBe(initialCount);
    });
  });
});
