/**
 * @fileoverview Metrics Collector Utility
 * Stores in-memory metrics, request rates, error categorizations, latency percentiles, and telemetry counts.
 */

const metricsState = {
  totalRequests: 0,
  requestsByEndpoint: {},
  responseTimes: [],
  errorCount: 0,
  errorsByCategory: {
    Validation: 0,
    Authentication: 0,
    Authorization: 0,
    Repository: 0,
    Database: 0,
    Storage: 0,
    Payment: 0,
    Network: 0,
    Unexpected: 0
  },
  authFailures: 0,
  rateLimitHits: 0,
  blockedRequests: 0,
  suspiciousIps: {},
  repeatedAuthFailures: {},
  uploadsByType: {
    audio: 0,
    preview: 0,
    cover: 0,
    banner: 0,
    avatar: 0,
    document: 0
  },
  downloadsCount: 0,
  ordersCount: 0,
  paymentsAttempted: 0,
  paymentsSucceeded: 0,
  ownershipCreations: 0,
  storageOperations: 0,
  databaseQueries: 0,
  dailyActiveUsers: new Set()
};

/**
 * Records an HTTP request performance metrics.
 * @param {string} method - HTTP method name.
 * @param {string} path - Request URL path pattern.
 * @param {number} statusCode - HTTP response code.
 * @param {number} durationMs - Elapsed duration of response.
 */
const recordRequest = (method, path, statusCode, durationMs) => {
  metricsState.totalRequests++;
  const endpoint = `${method} ${path}`;
  metricsState.requestsByEndpoint[endpoint] = (metricsState.requestsByEndpoint[endpoint] || 0) + 1;
  
  metricsState.responseTimes.push(durationMs);
  if (metricsState.responseTimes.length > 2000) {
    metricsState.responseTimes.shift();
  }

  if (statusCode >= 400) {
    metricsState.errorCount++;
  }
};

/**
 * Records an occurrence of an categorized error.
 * @param {string} category - Classification identifier.
 */
const recordError = (category) => {
  if (metricsState.errorsByCategory[category] !== undefined) {
    metricsState.errorsByCategory[category]++;
  } else {
    metricsState.errorsByCategory.Unexpected++;
  }
};

/**
 * Increments an arbitrary counter metric.
 * @param {string} metricName - Name of key in metricsState.
 */
const increment = (metricName) => {
  if (metricsState[metricName] !== undefined) {
    metricsState[metricName]++;
  }
};

/**
 * Records file upload events.
 * @param {string} type - File category (audio, cover, banner, avatar).
 */
const recordUpload = (type) => {
  if (metricsState.uploadsByType[type] !== undefined) {
    metricsState.uploadsByType[type]++;
  }
};

/**
 * Registers active user ID.
 * @param {number|string} userId - User identifier.
 */
const recordUserActive = (userId) => {
  if (userId) {
    metricsState.dailyActiveUsers.add(String(userId));
  }
};

/**
 * Helper to compute specific percentile response time.
 * @param {number} p - Percentile target (e.g. 95, 99).
 * @returns {number} Value in milliseconds.
 */
const getPercentile = (p) => {
  if (metricsState.responseTimes.length === 0) return 0;
  const sorted = [...metricsState.responseTimes].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
};

/**
 * Computes average response latency.
 * @returns {number} Average in milliseconds.
 */
const getAverageResponseTime = () => {
  if (metricsState.responseTimes.length === 0) return 0;
  const sum = metricsState.responseTimes.reduce((a, b) => a + b, 0);
  return sum / metricsState.responseTimes.length;
};

/**
 * Returns formatted metrics summaries.
 * @returns {Object} Structured data.
 */
const getMetricsSummary = () => {
  return {
    totalRequests: metricsState.totalRequests,
    requestsByEndpoint: metricsState.requestsByEndpoint,
    averageResponseTimeMs: Math.round(getAverageResponseTime() * 10) / 10,
    p95LatencyMs: Math.round(getPercentile(95) * 10) / 10,
    p99LatencyMs: Math.round(getPercentile(99) * 10) / 10,
    errorRate: metricsState.totalRequests > 0 ? (metricsState.errorCount / metricsState.totalRequests) : 0,
    errorsByCategory: metricsState.errorsByCategory,
    authFailures: metricsState.authFailures,
    rateLimitHits: metricsState.rateLimitHits,
    blockedRequests: metricsState.blockedRequests,
    suspiciousIps: metricsState.suspiciousIps,
    repeatedAuthFailures: metricsState.repeatedAuthFailures,
    uploadsByType: metricsState.uploadsByType,
    downloadsCount: metricsState.downloadsCount,
    ordersCount: metricsState.ordersCount,
    paymentSuccessRate: metricsState.paymentsAttempted > 0 ? (metricsState.paymentsSucceeded / metricsState.paymentsAttempted) : 0,
    ownershipCreations: metricsState.ownershipCreations,
    storageOperations: metricsState.storageOperations,
    databaseQueries: metricsState.databaseQueries,
    dailyActiveUsers: metricsState.dailyActiveUsers.size
  };
};

module.exports = {
  recordRequest,
  recordError,
  increment,
  recordUpload,
  recordUserActive,
  getMetricsSummary,
  metricsState
};
