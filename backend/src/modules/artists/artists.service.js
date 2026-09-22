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

const toWorkedWithDto = (artist) => ({
  id: artist.id,
  name: artist.name,
  image:
    artist.image?.startsWith("/") || /^https?:\/\//.test(artist.image)
      ? artist.image
      : resolveImageUrl(artist.image),
  popularSong: artist.popular_song || "",
  musicType: artist.music_type || "",
  workedYear: artist.worked_year ? String(artist.worked_year) : "",
  showOnMusicProduction: Boolean(artist.show_on_music_production),
});

const listWorkedWithArtists = async () =>
  (await repository.listWorkedWith()).map(toWorkedWithDto);

const createWorkedWithArtist = async (input) => {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const image = typeof input?.image === "string" ? input.image.trim() : "";
  const popularSong =
    typeof input?.popular_song === "string" ? input.popular_song.trim() : "";
  const musicType =
    typeof input?.music_type === "string" ? input.music_type.trim() : "";
  const workedYear = Number(input?.worked_year);
  const showOnMusicProduction = input?.show_on_music_production === true;

  if (!name) throw new AppError("Artist name is required.", 400);
  if (!image) throw new AppError("Artist image is required.", 400);
  if (!popularSong) throw new AppError("Popular song is required.", 400);
  if (!musicType) throw new AppError("Music type is required.", 400);
  if (!Number.isInteger(workedYear) || workedYear < 1900 || workedYear > 2100) {
    throw new AppError("Worked year is invalid.", 400);
  }

  try {
    return toWorkedWithDto(
      await repository.createWorkedWith({
        name,
        image,
        popularSong,
        musicType,
        workedYear,
        showOnMusicProduction,
      }),
    );
  } catch (error) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      throw new AppError("This artist is already listed.", 409);
    }
    throw error;
  }
};

const removeWorkedWithArtist = async (id) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) {
    throw new AppError("Invalid artist id.", 400);
  }

  const result = await repository.deleteWorkedWith(numericId);
  if (!result.meta?.changes) {
    throw new AppError("Worked-with artist not found.", 404);
  }
};

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

module.exports = {
  listArtists,
  listWorkedWithArtists,
  createWorkedWithArtist,
  removeWorkedWithArtist,
  createArtist,
  toDto,
};
