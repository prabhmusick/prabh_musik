const service = require("./artists.service");

const listArtists = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.listArtists() });
  } catch (error) {
    next(error);
  }
};

const createArtist = async (req, res, next) => {
  try {
    res
      .status(201)
      .json({ success: true, data: await service.createArtist(req.body) });
  } catch (error) {
    next(error);
  }
};

module.exports = { listArtists, createArtist };
