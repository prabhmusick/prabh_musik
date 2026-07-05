// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");
// const path = require("path");

// // const beatsRouter = require("./routes/beats");
// const beatsRouter = require("./modules/beats/legacy.beats.js");
// // const usersRouter = require("./routes/users");
// // const artistsRouter = require("./routes/artists");
// // const beatsMetaRouter = require("./routes/beatsMeta");
// // const purchasesRouter = require("./routes/purchases");
// const uploadsRouter = require("./modules/beats/uploads/uploads.routes.js");
// const db = require("./config/db");

// const app = express();

// app.use(express.json());
// app.use(cors());
// app.use(helmet());
// app.use(morgan(process.env.LOG_FORMAT || "combined"));

// // Serve frontend statically so app can be deployed from one server
// // Expose runtime env for frontend to consume (API_BASE, UPLOAD_URL)
// // app.get("/env.js", (req, res) => {
// //   const portVal = process.env.PORT || 3000;
// //   const apiBase = `http://localhost:${portVal}`;
// //   const uploadUrl = `${apiBase}/beats/upload-audio`;
// //   res.set("Content-Type", "application/javascript");
// //   res.send(
// //     `window.API_BASE = "${apiBase}"; window.UPLOAD_URL = "${uploadUrl}";`,
// //   );
// // });

// // Adjusted relative path to go up two levels to look for sibling frontend directory
// // app.use(express.static(path.join(__dirname, "..", "..", "frontend")));

// // Initialize DB/schema
// db.init();

// // API routes for metadata
// // app.use("/api/users", usersRouter);
// // app.use("/api/artists", artistsRouter);
// // app.use("/api/beats", beatsMetaRouter);
// // app.use("/api/purchases", purchasesRouter);
// app.use("/api/uploads", uploadsRouter);
// app.use("/api/beats", beatsRouter);

// // Basic error handler
// app.use((err, req, res, next) => {
//   console.error(err);
//   res.status(500).json({ error: err.message || "Internal error" });
// });

// app.get("/", (req, res) => res.send("Server Running"));

// // app.use("/beats", beatsRouter);
// app.use("/api/beats", beatsRouter);

// module.exports = app;

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const db = require("./config/db");
console.log("DB MODULE:", db);

const beatsRouter = require("./modules/beats/beats.routes");
const uploadsRouter = require("./modules/uploads/uploads.routes");
const usersRouter = require("./modules/users/users.routes");
const ordersRouter = require("./modules/orders/orders.routes");
const ownershipsRouter = require("./modules/ownerships/ownerships.routes");
const downloadsRouter = require("./modules/downloads/downloads.routes");
const ownershipsController = require("./modules/ownerships/ownerships.controller");

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan("dev"));

db.init();

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    service: "Prabh Musik API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/uploads", uploadsRouter);
app.use("/api/beats", beatsRouter);
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/ownerships", ownershipsRouter);
app.use("/api/downloads", downloadsRouter);
app.get("/api/me/library", ownershipsController.getLibraryByUser);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;