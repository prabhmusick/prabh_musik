const service = require("./cart.service");

const getCart = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getCart(req.user.id) });
  } catch (error) {
    next(error);
  }
};

const replaceCart = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.items)) {
      return res.status(400).json({ error: "Cart items must be an array" });
    }
    res.json({
      success: true,
      data: await service.replaceCart(req.user.id, req.body.items),
    });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await service.removeFromCart(req.user.id, req.params.beatId),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, replaceCart, removeFromCart };
