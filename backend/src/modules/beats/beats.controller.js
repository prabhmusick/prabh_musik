/**
 * @fileoverview Beats Controller Layer
 * Handles HTTP request parsing, status code mapping, and response serialization for beats.
 */

const service = require("./beats.service");

/**
 * Handles HTTP POST request to create a new beat.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware reference.
 * @returns {Promise<void>} Resolves when HTTP response is sent.
 */
const createBeat = async (req, res, next) => {
  try {
    const creatorUserId = req.user ? req.user.id : undefined;
    const beatDto = await service.createBeat(req.body, creatorUserId);

    res.status(201).json({
      success: true,
      data: beatDto
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles HTTP GET request to retrieve a single beat by public_id.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware reference.
 * @returns {Promise<void>} Resolves when HTTP response is sent.
 */
const getBeatByPublicId = async (req, res, next) => {
  try {
    const beatDto = await service.getBeatByPublicId(req.params.publicId);

    res.status(200).json({
      success: true,
      data: beatDto
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles HTTP GET request to retrieve a single published beat by its SEO slug.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware reference.
 * @returns {Promise<void>} Resolves when HTTP response is sent.
 */
const getBeatBySlug = async (req, res, next) => {
  try {
    const beatDto = await service.getBeatBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: beatDto
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles HTTP GET request to list published beats for the storefront catalog.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware reference.
 * @returns {Promise<void>} Resolves when HTTP response is sent.
 */
const listPublicBeats = async (req, res, next) => {
  try {
    const options = {
      genre: req.query.genre,
      limit: req.query.limit,
      offset: req.query.offset,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const beats = await service.listPublicBeats(options);

    res.status(200).json({
      success: true,
      data: beats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles HTTP GET request to list all beats (drafts, published, archived) for the administrative dashboard.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware reference.
 * @returns {Promise<void>} Resolves when HTTP response is sent.
 */
const listAdminBeats = async (req, res, next) => {
  try {
    const options = {
      status: req.query.status,
      genre: req.query.genre,
      limit: req.query.limit,
      offset: req.query.offset,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const beats = await service.listAdminBeats(options);

    res.status(200).json({
      success: true,
      data: beats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles HTTP PATCH request to update a beat record.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware reference.
 * @returns {Promise<void>} Resolves when HTTP response is sent.
 */
const updateBeat = async (req, res, next) => {
  try {
    const adminUserId = req.user ? req.user.id : undefined;
    const updatedBeatDto = await service.updateBeat(
      req.params.publicId,
      req.body,
      adminUserId
    );

    res.status(200).json({
      success: true,
      data: updatedBeatDto
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles HTTP PATCH request to update a beat's lifecycle status.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware reference.
 * @returns {Promise<void>} Resolves when HTTP response is sent.
 */
const updateStatus = async (req, res, next) => {
  try {
    const adminUserId = req.user ? req.user.id : undefined;
    const status = req.body ? req.body.status : undefined;

    const updatedBeatDto = await service.updateStatus(
      req.params.publicId,
      status,
      adminUserId
    );

    res.status(200).json({
      success: true,
      data: updatedBeatDto
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBeat,
  getBeatByPublicId,
  getBeatBySlug,
  listPublicBeats,
  listAdminBeats,
  updateBeat,
  updateStatus
};