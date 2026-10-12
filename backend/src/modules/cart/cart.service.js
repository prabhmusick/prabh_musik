const repository = require("./cart.repository");

const resolvePublicUrl = (key) => {
  if (!key) return "";
  if (/^https?:\/\//.test(key)) return key;
  const r2Url = process.env.R2_PUBLIC_URL || "https://media.prabhmusik.com";
  if (r2Url) {
    return `${r2Url.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
  }
  const base =
    process.env.BACKEND_PUBLIC_URL ||
    `http://localhost:${process.env.PORT || 5005}/api/media?key=`;
  return base.includes("/api/media?key=")
    ? `${base}${encodeURIComponent(key)}`
    : `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
};

const toBeatItem = (beat) => ({
  id: beat.public_id,
  title: beat.title,
  producer: "Unknown",
  price: Number(beat.price_amount || 0) / 100,
  cover: resolvePublicUrl(beat.cover_key),
  genre: beat.genre || undefined,
  bpm: beat.bpm || undefined,
  previewUrl: resolvePublicUrl(beat.audio_key),
});

const getCart = async (userId) =>
  (await repository.list(userId)).map(toBeatItem);
const replaceCart = async (userId, items) => {
  const beatIds = [
    ...new Set(
      (items || []).map((item) => String(item.id || item)).filter(Boolean),
    ),
  ];
  return (await repository.replace(userId, beatIds)).map(toBeatItem);
};
const removeFromCart = async (userId, beatId) =>
  (await repository.remove(userId, String(beatId))).map(toBeatItem);

module.exports = { getCart, replaceCart, removeFromCart };
