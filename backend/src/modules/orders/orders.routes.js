const express = require("express");
const controller = require("./orders.controller");
const catchAsync = require("../../utils/catchAsync");

const router = express.Router();

router.get("/", catchAsync(controller.getAllOrders));
router.get("/:id", catchAsync(controller.getOrder));
router.post("/", catchAsync(controller.createOrder));
router.put("/:id", catchAsync(controller.updateOrder));
router.patch("/:id/status", catchAsync(controller.updateOrderStatus));
router.delete("/:id", catchAsync(controller.deleteOrder));

module.exports = router;
