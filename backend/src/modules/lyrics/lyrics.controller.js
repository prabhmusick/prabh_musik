const service = require("./lyrics.service");

const listLyrics = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.listLyrics() });
  } catch (error) {
    next(error);
  }
};

const createLyric = async (req, res, next) => {
  try {
    res
      .status(201)
      .json({ success: true, data: await service.createLyric(req.body) });
  } catch (error) {
    next(error);
  }
};

const deleteLyric = async (req, res, next) => {
  try {
    await service.removeLyric(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { listLyrics, createLyric, deleteLyric };
