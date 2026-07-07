# Signup Architecture Specifications

This document describes the registration pipeline for new customer profiles.

## Pipeline Walkthrough

### 1. Request Validation
* Enforces structural parameters:
  * `name`: Required, trimmed length 2-100 characters, rejects control characters.
  * `email`: Required, normalized lowercase, matches regex format, <= 254 length.
  * `password`: Required, trimmed length 8-128 characters, requires uppercase, lowercase, numeric, and special character combinations.

### 2. Duplicate Detection
* Before transaction startup, the system queries the `users` table to check if the normalized email is already in use.
* If present, returns a `409 Conflict` response with `errorCode: "DUPLICATE_EMAIL"`.

### 3. Cryptographic Hashing
* Hashing operations are performed *outside* the SQLite transaction to minimize lock duration:
  * **Password**: Hashed asynchronously using bcrypt (work factor of 12).
  * **Refresh Token**: Hashed using SHA-256 (`tokenUtil.hashToken`) to protect the database against compromise leaks.

### 4. Database Transaction
* Opens a SQLite write transaction containing:
  1. Profile record write in the `users` table.
  2. Credential record write in the `user_credentials` table (mapping `provider` type `"email"` and the hashed password).
  3. Session record write in `user_sessions` (linking IP, userAgent, session UUID, refresh token hash, and expiry date).
* Safe rollback triggers if any internal step fails.

### 5. Token Issuance
* Access Token is issued with a short TTL (900s) containing only `{ sub, role, sid }` claims.
* Refresh Token is written to an HttpOnly cookie.
