# Request Authentication Lifecycle

This document describes the end-to-end traversal of an HTTP request through the authentication infrastructure layers.

## Request Pipeline Sequence

```
[Incoming Request]
        ↓
1. [requestId.middleware.js] (Binds UUID to req.id, sets X-Request-Id, wraps thread in AsyncLocalStorage)
        ↓
2. [Helmet & Parsers] (Applies security headers, parses Cookie / JSON body limits)
        ↓
3. [rateLimit.middleware.js] (Parses IP, decrements limit counters, blocks 429 if threshold met)
        ↓
4. [auth.validator.js] (Validates schema types, length constraints, password strength rules)
        ↓
5. [auth.controller.js] (Trims body, extracts context, forwards to service layer)
        ↓
6. [auth.service.js] (Executes database transaction, hashes passwords, generates JWTs)
        ↓
7. [cookieUtil.js & controller] (Sets HttpOnly refresh cookies, returns HTTP 201 + Access Token)
        ↓
[Standard HTTP Response]
```

## Middleware Responsibilities

### 1. Request ID Middleware
* **Purpose**: Assigns a unique UUID to every incoming HTTP request.
* **Responsibilities**:
  * Parses incoming client `X-Request-Id` headers (reusing them if available).
  * Generates a new random UUID if absent.
  * Sets the outgoing response header `X-Request-Id`.
  * Wraps the next middleware invocation in the `AsyncLocalStorage` context to automatically bind logs without manual signature passing.

### 2. Rate Limiting Middleware
* **Purpose**: Safeguards authentication endpoints from Denial of Service (DoS) and brute-force attacks.
* **Responsibilities**:
  * Normalizes the client's IP address.
  * Increments hit counters via an abstract store.
  * Blocks client IPs with `429 Too Many Requests` once limits are breached, appending standard rate limit headers.

### 3. Global Error Handler
* **Purpose**: Centralizes operational and system error translations.
* **Responsibilities**:
  * Captures exceptions thrown by any route handler.
  * Standardizes JSON outputs, injecting the correlation `requestId` and standard `errorCode`.
  * Sanitizes raw engine errors and stack traces in production environment mode.
