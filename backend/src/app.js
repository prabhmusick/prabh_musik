/**
 * @fileoverview Express Application Composition Root
 * Configures core middleware, domain routers, and fallback handlers.
 */

const express = require("express");
const cookieParser = require("cookie-parser");
const usersRoutes = require("./modules/users/users.routes");
const beatsRoutes = require("./modules/beats/beats.routes");
const authRoutes = require("./modules/auth/auth.routes");
const ordersRoutes = require("./modules/orders/orders.routes");
const paymentsRoutes = require("./modules/payments/payments.routes");
const ownershipsRoutes = require("./modules/ownerships/ownerships.routes");
const downloadsRoutes = require("./modules/downloads/downloads.routes");
const uploadsRoutes = require("./modules/uploads/uploads.routes");
const monitoringRoutes = require("./modules/monitoring/monitoring.routes");
const mediaRoutes = require("./modules/media/media.routes");
const { storageProvider } = require("./storage/r2.provider");
const tracer = require("./utils/tracer");
const requestIdMiddleware = require("./middleware/requestId.middleware");
const errorHandler = require("./middleware/error.middleware");

const cors = require("cors");
const helmet = require("helmet");
const { db } = require("./config/db");

const app = express();

// Auto-Observability module method tracing instrumentations
tracer.wrapModule(require("./modules/auth/auth.service"), "service", "AuthService");
tracer.wrapModule(require("./modules/users/users.service"), "service", "UsersService");
tracer.wrapModule(require("./modules/beats/beats.service"), "service", "BeatsService");
tracer.wrapModule(require("./modules/orders/orders.service"), "service", "OrdersService");
tracer.wrapModule(require("./modules/payments/payments.service"), "service", "PaymentsService");
tracer.wrapModule(require("./modules/ownerships/ownerships.service"), "service", "OwnershipsService");
tracer.wrapModule(require("./modules/downloads/downloads.service"), "service", "DownloadsService");
tracer.wrapModule(require("./modules/uploads/uploads.service"), "service", "UploadsService");

tracer.wrapModule(require("./modules/auth/auth.repository"), "repository", "AuthRepository");
tracer.wrapModule(require("./modules/users/users.repository"), "repository", "UsersRepository");
tracer.wrapModule(require("./modules/beats/beats.repository"), "repository", "BeatsRepository");
tracer.wrapModule(require("./modules/orders/orders.repository"), "repository", "OrdersRepository");
tracer.wrapModule(require("./modules/ownerships/ownerships.repository"), "repository", "OwnershipsRepository");
tracer.wrapModule(require("./modules/downloads/downloads.repository"), "repository", "DownloadsRepository");
tracer.wrapModule(require("./modules/uploads/uploads.repository"), "repository", "UploadsRepository");

tracer.wrapModule(storageProvider, "storage", "StorageProvider");

// 1. Enforce CORS and Security Headers
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim());
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

// 2. Core Request Body Parsing Middleware
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      if (req.originalUrl && req.originalUrl.startsWith("/api/payments/webhook")) {
        req.rawBody = buf;
      }
    }
  })
); // Enforce request size limits to protect against DoS
app.use(cookieParser());

// 3. Request Correlation ID Middleware
app.use(requestIdMiddleware);

// 4. Health and Readiness Helpers & Endpoints
const checkStorage = async () => {
  try {
    await storageProvider.objectExists("health-check");
    return true;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return true;
    }
    return false;
  }
};

app.get("/health", async (req, res) => {
  const dbConnected = await new Promise((resolve) => {
    db.get("SELECT 1", [], (err) => {
      resolve(!err);
    });
  });

  const storageConnected = await checkStorage().catch(() => false);
  const stripeAvailable = !!(process.env.STRIPE_SECRET_KEY || "");

  res.status(200).json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
    version: "1.0.0",
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    dependencies: {
      database: dbConnected ? "connected" : "disconnected",
      storage: storageConnected ? "connected" : "disconnected",
      stripe: stripeAvailable ? "configured" : "unconfigured"
    }
  });
});

app.get("/ready", async (req, res) => {
  try {
    // 1. Verify database connectivity
    await new Promise((resolve, reject) => {
      db.get("SELECT 1", [], (err) => {
        if (err) reject(new Error("Database check failed: " + err.message));
        else resolve();
      });
    });

    // 2. Verify storage connectivity
    const storageCheck = await checkStorage().catch(() => false);
    if (!storageCheck) {
      throw new Error("Storage check failed");
    }

    // 3. Verify Stripe key config
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe configuration missing");
    }

    res.status(200).json({
      success: true,
      status: "ready"
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "not_ready",
      message: error.message
    });
  }
});

// 5. Mount Domain Module Routers
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/beats", beatsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/ownerships", ownershipsRoutes);
app.use("/api/downloads", downloadsRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/media", mediaRoutes);

// 5. Catch-All Middleware for Unmatched Routes (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found."
    }
  });
});

// 6. Global Error Handling Middleware (Must remain the LAST handler)
app.use(errorHandler);

module.exports = app;