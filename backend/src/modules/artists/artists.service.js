const repository = require("./artists.repository");
const AppError = require("../../errors/AppError");

const resolveImageUrl = (key) => {
  if (!key) return null;
  if (/^https?:\/\//.test(key)) return key;
  const base =
    process.env.R2_PUBLIC_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 5005}`;
  return `${base.replace(/\/$/, "")}/api/media?key=${encodeURIComponent(key)}`;
};

const toDto = (artist) => ({
  id: artist.public_id,
  public_id: artist.public_id,
  name: artist.name,
  stageName: artist.name,
  phone: artist.phone || "",
  email: artist.email || "",
  image: resolveImageUrl(artist.image_key),
  image_key: artist.image_key || null,
  totalBeats: Number(artist.beat_count || 0),
  totalSales: 0,
  createdAt: artist.created_at,
  status: "active",
});

const listArtists = async () => (await repository.list()).map(toDto);

const createArtist = async (input) => {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const phone = typeof input?.phone === "string" ? input.phone.trim() : "";
  const email =
    typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const imageKey =
    typeof input?.image_key === "string" ? input.image_key.trim() : null;

  if (!name) throw new AppError("Artist name is required.", 400);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    throw new AppError("Artist email is invalid.", 400);
  }

  return toDto(
    await repository.create({ name, phone, email, image_key: imageKey }),
  );
};

module.exports = { listArtists, createArtist, toDto };
