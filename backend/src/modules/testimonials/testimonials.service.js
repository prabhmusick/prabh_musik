const repository = require("./testimonials.repository");
const AppError = require("../../errors/AppError");

const resolveImageUrl = (key) => {
  if (!key) return null;
  if (/^https?:\/\//.test(key) || key.startsWith("/")) return key;
  const base =
    process.env.R2_PUBLIC_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 5005}`;
  return `${base.replace(/\/$/, "")}/api/media?key=${encodeURIComponent(key)}`;
};

const toDto = (testimonial) => ({
  id: testimonial.id,
  name: testimonial.name,
  image: resolveImageUrl(testimonial.image),
  rating: Number(testimonial.rating),
  testimonial: testimonial.testimonial,
  professional: testimonial.professional,
  createdAt: testimonial.created_at,
});

const listTestimonials = async () => (await repository.list()).map(toDto);

const createTestimonial = async (input) => {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const image = typeof input?.image === "string" ? input.image.trim() : "";
  const testimonial =
    typeof input?.testimonial === "string" ? input.testimonial.trim() : "";
  const professional =
    typeof input?.professional === "string" ? input.professional.trim() : "";
  const rating = Number(input?.rating);

  if (!name) throw new AppError("Client name is required.", 400);
  if (!image) throw new AppError("Client image is required.", 400);
  if (!testimonial) throw new AppError("Testimonial is required.", 400);
  if (!professional) throw new AppError("Professional title is required.", 400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError("Rating must be an integer from 1 to 5.", 400);
  }

  return toDto(
    await repository.create({
      name,
      image,
      rating,
      testimonial,
      professional,
    }),
  );
};

const removeTestimonial = async (id) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) {
    throw new AppError("Invalid testimonial id.", 400);
  }

  const result = await repository.remove(numericId);
  if (!result.meta?.changes) {
    throw new AppError("Testimonial not found.", 404);
  }
};

module.exports = { listTestimonials, createTestimonial, removeTestimonial };
