/**
 * @fileoverview Monitoring Controller
 * Handles observability queries, fetching aggregated structured metric outputs.
 */

const metrics = require("../../utils/metrics");

/**
 * Returns structured application metrics payload.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {void}
 */
const getMetrics = (req, res) => {
  res.status(200).json({
    success: true,
    data: metrics.getMetricsSummary()
  });
};

module.exports = {
  getMetrics
};
