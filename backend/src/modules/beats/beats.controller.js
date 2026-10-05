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
  const result = await service.getBeatsPaginated(req.query);
  res.json({
    success: true,
    count: result.data.length,
    data: result.data,
    pagination: result.pagination,
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
  const key = req.params.key;

  // Security check: Prevent path traversal or invalid keys
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    return res.status(400).json({ success: false, message: "Invalid object key." });
  }

  const decodedKey = decodeURIComponent(key);

  // Security check: Prevent unauthorized access to private master files, stems, or licenses
  if (decodedKey.startsWith("masters/") || decodedKey.startsWith("stems/") || decodedKey.startsWith("licenses/")) {
    const authHeader = req.headers.authorization;
    if (!req.user && authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const jwtUtil = require("../../utils/jwt");
        const decoded = jwtUtil.verifyAccessToken(token);
        if (decoded && decoded.sub) {
          req.user = {
            id: decoded.sub,
            role: decoded.role,
            sessionId: decoded.sid
          };
        }
      } catch (e) {}
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required for master assets." });
    }
    if (req.user.role !== "admin") {
      const ownershipsService = require("../ownerships/ownerships.service");
      const userOwnerships = await ownershipsService.getOwnershipsByUser(req.user.id);
      const hasAccess = userOwnerships.some(o => o.audio_key === decodedKey || String(o.beat_id) === decodedKey);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Access denied. Valid beat purchase required." });
      }
    }
  }

  const rangeHeader = req.headers.range;
  const objectData = await service.getBeatObjectStream(key, rangeHeader);

  res.status(objectData.statusCode);
  res.set("Content-Type", objectData.contentType);
  res.set("Accept-Ranges", "bytes");
  res.set("Cache-Control", "public, max-age=31536000, immutable");

  if (objectData.contentLength) {
    res.set("Content-Length", objectData.contentLength);
  }

  if (objectData.contentRange) {
    res.set("Content-Range", objectData.contentRange);
  }

  objectData.stream.pipe(res);
};

module.exports = {
  createBeat,
  getAllBeats,
  getBeat,
  updateBeat,
  archiveBeat,
  getBeatObject,
};