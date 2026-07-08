# Global Error Handling Blueprint

This document details the serialization formats, HTTP mappings, and logging behaviors for errors.

## Standard JSON Error Format

All failure responses returned by the backend API follow a unified structure:

```json
{
  "success": false,
  "message": "Human-readable description of what went wrong.",
  "errorCode": "CENTRALIZED_ERROR_CONSTANT",
  "requestId": "correlation-uuid-value",
  "details": null
}
```

## Error Classifications

### 1. Operational Errors
* **Definition**: Expected business failures or validation errors (e.g. malformed inputs, email in use, rate limits).
* **Behavior**:
  * Bubble up to the controller without catching.
  * Caught by the global `errorHandler` middleware.
  * Logged internally as a warning (`logger.warn`) containing metadata.
  * Returned to the client with the original HTTP status code (400, 409, 429) and user-friendly messages.

### 2. Non-Operational (System) Errors
* **Definition**: Unexpected programmatic exceptions (e.g. database disk full, SQLite syntax crashes, memory exhaustion, JWT signing keys missing).
* **Behavior**:
  * Logged internally as an error (`logger.error`) with the raw message and full stack trace.
  * In **production**, the error message is completely redacted and replaced with a generic description: `"An unexpected error occurred."`
  * Returns HTTP status code `500 Internal Server Error` with `errorCode: "INTERNAL_SERVER_ERROR"`.
  * The stack trace is never sent to the client in production.
