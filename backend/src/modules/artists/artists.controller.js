const service = require("./artists.service");

const listArtists = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.listArtists() });
  } catch (error) {
    next(error);
  }
};

const listWorkedWithArtists = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.listWorkedWithArtists() });
  } catch (error) {
    next(error);
  }
};

const createWorkedWithArtist = async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      data: await service.createWorkedWithArtist(req.body),
    });
  } catch (error) {
    next(error);
  }
};

const deleteWorkedWithArtist = async (req, res, next) => {
  try {
    await service.removeWorkedWithArtist(req.params.id);
    res.json({ success: true });
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

module.exports = {
  listArtists,
  listWorkedWithArtists,
  createWorkedWithArtist,
  deleteWorkedWithArtist,
  createArtist,
};
