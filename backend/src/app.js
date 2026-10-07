const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const db = require("./config/db");

const beatsRouter = require("./modules/beats/beats.routes");
const uploadsRouter = require("./modules/uploads/uploads.routes");
const usersRouter = require("./modules/users/users.routes");
const ordersRouter = require("./modules/orders/orders.routes");
const ownershipsRouter = require("./modules/ownerships/ownerships.routes");
const downloadsRouter = require("./modules/downloads/downloads.routes");
const authRouter = require("./modules/auth/auth.routes");
const artistsRouter = require("./modules/artists/artists.routes");
const testimonialsRouter = require("./modules/testimonials/testimonials.routes");
const lyricsRouter = require("./modules/lyrics/lyrics.routes");
const paymentsRouter = require("./modules/payments/payments.routes");
const cartRouter = require("./modules/cart/cart.routes");
const monitoringRouter = require("./modules/monitoring/monitoring.routes");
const mediaRouter = require("./modules/media/media.routes");

const ownershipsController = require("./modules/ownerships/ownerships.controller");
const requestIdMiddleware = require("./middleware/requestId.middleware");
const authMiddleware = require("./middleware/auth.middleware");
const errorHandler = require("./middleware/error");

const app = express();

// Trust Proxy Configuration from Environment Variables
const trustProxyVal = process.env.TRUST_PROXY;
if (trustProxyVal) {
  if (trustProxyVal === "true" || trustProxyVal === "false") {
    app.set("trust proxy", trustProxyVal === "true");
  } else if (!isNaN(Number(trustProxyVal))) {
    app.set("trust proxy", Number(trustProxyVal));
  } else {
    app.set("trust proxy", trustProxyVal);
  }
}

// Global correlation tracing at top of stack
app.use(requestIdMiddleware);

// Fail-fast environment check in production
if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.includes("change_me")) {
    throw new Error("FATAL CONFIGURATION ERROR: Production JWT_ACCESS_SECRET must be set securely.");
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes("change_me")) {
    throw new Error("FATAL CONFIGURATION ERROR: Production JWT_REFRESH_SECRET must be set securely.");
  }
}

// Enforce request body limits to protect against DoS
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      if (req.originalUrl && req.originalUrl.startsWith("/api/payments/webhook")) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(cookieParser());

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5005",
  "https://www.prabhmusik.com",
  "https://prabhmusik.com",
];

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Range"]
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(morgan("dev"));

db.init();

app.get(["/health", "/api/health"], (req, res) => {
  res.json({
    success: true,
    status: "ok",
    service: "Prabh Musik API",
    version: "1.0.0",
    dependencies: {
      database: "connected",
      storage: "configured",
      stripe: "configured"
    },
    timestamp: new Date().toISOString()
  });
});

app.get(["/ready", "/api/ready"], (req, res) => {
  res.json({
    success: true,
    status: "ready"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/beats", beatsRouter);
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/ownerships", ownershipsRouter);
app.use("/api/downloads", downloadsRouter);
app.use("/api/artists", artistsRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/lyrics", lyricsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/monitoring", monitoringRouter);
app.use("/api/media", mediaRouter);
app.get("/api/me/library", authMiddleware, ownershipsController.getMyOwnerships || ownershipsController.getLibraryByUser);

const AppError = require("./errors/AppError");

// Catch 404 Not Found routes and forward to errorHandler
app.use((req, res, next) => {
  const err = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404);
  err.errorCode = "NOT_FOUND";
  next(err);
});

// Register standardized global error handling middleware as the last handler
app.use(errorHandler);

module.exports = app;
