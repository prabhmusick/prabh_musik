const express = require("express");
const controller = require("./orders.controller");

const router = express.Router();

router.get("/", controller.getAllOrders);
router.get("/:id", controller.getOrder);
router.post("/", controller.createOrder);
router.put("/:id", controller.updateOrder);
router.patch("/:id/status", controller.updateOrderStatus);
router.delete("/:id", controller.deleteOrder);

module.exports = router;
