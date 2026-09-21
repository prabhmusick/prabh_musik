const service = require("./testimonials.service");

const listTestimonials = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.listTestimonials() });
  } catch (error) {
    next(error);
  }
};

const createTestimonial = async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      data: await service.createTestimonial(req.body),
    });
  } catch (error) {
    next(error);
  }
};

const deleteTestimonial = async (req, res, next) => {
  try {
    await service.removeTestimonial(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { listTestimonials, createTestimonial, deleteTestimonial };
