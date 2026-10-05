const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const controller = require("./cart.controller");

const router = express.Router();
router.use(authMiddleware);
router.get("/", controller.getCart);
router.put("/", controller.replaceCart);
router.delete("/:beatId", controller.removeFromCart);

module.exports = router;
