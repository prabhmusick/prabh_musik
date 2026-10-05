const repository = require("./lyrics.repository");
const AppError = require("../../errors/AppError");

const toDto = (lyric) => ({
  id: lyric.id,
  title: lyric.title,
  genre: lyric.genre,
  quote: lyric.quote,
  createdAt: lyric.created_at,
});

const listLyrics = async () => (await repository.list()).map(toDto);

const createLyric = async (input) => {
  const title = typeof input?.title === "string" ? input.title.trim() : "";
  const genre = typeof input?.genre === "string" ? input.genre.trim() : "";
  const quote = typeof input?.quote === "string" ? input.quote.trim() : "";

  if (!title) throw new AppError("Lyric title is required.", 400);
  if (!genre) throw new AppError("Lyric genre is required.", 400);
  if (!quote) throw new AppError("Lyric quote is required.", 400);

  return toDto(await repository.create({ title, genre, quote }));
};

const removeLyric = async (id) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) {
    throw new AppError("Invalid lyric id.", 400);
  }

  const result = await repository.remove(numericId);
  if (!result.meta?.changes) throw new AppError("Lyric not found.", 404);
};

module.exports = { listLyrics, createLyric, removeLyric };
