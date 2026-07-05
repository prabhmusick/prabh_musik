const service = require("./beats.service");

/**
 * Creates a new beat record (HTTP 201)
 * POST /api/beats
 */
const createBeat = async (req, res) => {
  const beat = await service.createBeat(req.body);
  res.status(201).json({
    success: true,
    data: beat,
  });
};

/**
 * Lists all active non-archived beats
 * GET /api/beats
 */
const getAllBeats = async (req, res) => {
  const beats = await service.getAllBeats();
  res.json({
    success: true,
    count: beats.length,
    data: beats,
  });
};

/**
 * Retrieves a single beat by ID
 * GET /api/beats/:id
 */
const getBeat = async (req, res) => {
  const beat = await service.getBeat(req.params.id);
  res.json({
    success: true,
    data: beat,
  });
};

/**
 * Updates a beat record dynamically
 * PATCH /api/beats/:id
 */
const updateBeat = async (req, res) => {
  const beat = await service.updateBeat(req.params.id, req.body);
  res.json({
    success: true,
    data: beat,
  });
};

/**
 * Soft deletes/archives a beat
 * DELETE /api/beats/:id
 */
const archiveBeat = async (req, res) => {
  await service.archiveBeat(req.params.id);
  res.json({
    success: true,
    message: "Beat archived successfully.",
  });
};

/**
 * Streams a stored beat object (audio/image) from the configured storage backend.
 * GET /api/beats/object/:key
 */
const getBeatObject = async (req, res) => {
  const result = await service.getBeatObject(req.params.key);

  res.set("Content-Type", result.contentType || "application/octet-stream");
  res.send(result.buffer);
};

module.exports = {
  createBeat,
  getAllBeats,
  getBeat,
  updateBeat,
  archiveBeat,
  getBeatObject,
};