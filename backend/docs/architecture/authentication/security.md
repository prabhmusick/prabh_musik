# Security Architecture Guidelines

This document outlines the security parameters, rate limits, auditing patterns, and network configurations governing the authentication layer.

## Security Policies

### 1. Reverse Proxies & Trust Proxy Settings
* Express must know when it is sitting behind a load balancer or reverse proxy to parse client IP chains correctly.
* The `trust proxy` setting is configured dynamically via the environment variable `TRUST_PROXY` (relying on values like `1` or `"loopback"`). It must never be hardcoded.
* Client IP resolution parses `x-forwarded-for` to strip load balancer proxies and isolate the true client.

### 2. Cookie Security Configuration
The refresh cookie uses parameters configured within the cookie utility to safeguard against hijacking:
* `HttpOnly`: Set to `true` (prohibits DOM access via `document.cookie` to prevent XSS exfiltration).
* `Secure`: Set to `true` (enforces HTTPS only, avoiding transport sniffing).
* `SameSite`: Set to `Lax` (safeguards against Cross-Site Request Forgery).
* `Path`: Restricted to `/api/auth` (prevents cookie leakage to other paths).

### 3. Auth Endpoint Rate Limiting
* Endpoint: `POST /api/auth/signup`
* Rate Threshold: **5 requests per 15 minutes per IP**.
* Response Code: `429 Too Many Requests`.
* Response Headers:
  * `X-RateLimit-Limit`: Maximum allowable requests (5).
  * `X-RateLimit-Remaining`: Permitted hits remaining in the current window.
  * `Retry-After`: Reset duration in seconds.

### 4. Audit Log Specifications
Audit trails are centralized in `utils/audit.js` and use `logger.info` internally to record events:
* `USER_REGISTERED`: Profile public UUID and email.
* `USER_LOGGED_IN`: Session initialization.
* `PASSWORD_CHANGED`: Profile credential updates.
* `SESSION_REVOKED`: Session revoking and logouts.
* *Audit Logs must never record sensitive inputs (passwords, plaintext tokens, secrets).*
