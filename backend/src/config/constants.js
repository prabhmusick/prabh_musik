/**
 * @fileoverview Application Constants Configuration
 * Defines core whitelist options and enums for users, roles, and authentication.
 */

/**
 * Supported User Roles
 * @const
 * @readonly
 * @type {{ADMIN: string, CUSTOMER: string}}
 */
const USER_ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer"
};

/**
 * Account Statuses
 * @const
 * @readonly
 * @type {{ACTIVE: string, SUSPENDED: string, DELETED: string}}
 */
const ACCOUNT_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  DELETED: "deleted"
};

/**
 * Supported Authentication Providers
 * @const
 * @readonly
 * @type {{EMAIL: string, GOOGLE: string, APPLE: string}}
 */
const AUTH_PROVIDER = {
  EMAIL: "email",
  GOOGLE: "google",
  APPLE: "apple"
};

module.exports = {
  USER_ROLES,
  ACCOUNT_STATUS,
  AUTH_PROVIDER
};
