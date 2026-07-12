require("dotenv").config();
const app = require("./app");
const env = require("./config/env");

const port = process.env.PORT || env.PORT;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
// Trigger reload 3
