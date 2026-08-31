require("dotenv").config();

const app = require("./app");
const env = require("./config/env");

const PORT = process.env.PORT || env.PORT || 5012;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("Server started successfully.");
  console.log(`Listening on port ${PORT}`);
});

server.on("error", (error) => {
  console.error(`Failed to start server on port ${PORT}:`, error.message);
  process.exit(1);
});