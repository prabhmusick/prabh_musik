# API Specification Contract: POST /api/auth/refresh (Frozen)

This document serves as the official API contract and source of truth for frontend client development, backend route handling, endpoint integration testing, and API documentation for SPRINT 5.

---

## 1. Endpoint
`POST /api/auth/refresh`

---

## 2. Headers

### Required Headers
- None

### Optional Headers
- **`User-Agent`**: Client browser/device identification string.
- **`X-Forwarded-For`** / **`Remote-Addr`**: Client IP address.

---

## 3. Request Body
- **None** (Accepts no parameters in body, query, or path).

---

## 4. Authentication Method
- **Cookie-Based**: Enforces credentials delivery exclusively via the HttpOnly `refreshToken` cookie.

---

## 5. Normalization & Validation Rules
- The validator checks for the presence of the `refreshToken` cookie. If the cookie is absent or structurally invalid, it will propagate a validation block or delegative flow returning `401 Unauthorized` with `INVALID_SESSION`.

---

## 6. Business Rules

1. **Rotating Refresh Tokens (RTR)**: Every successful token refresh invalidates the previously issued refresh token and returns a newly signed refresh token via cookies, and a fresh access token in the response JSON.
2. **Replay Attack / Token Reuse Detection**: If the client submits an old, already-rotated refresh token, the service detects a compromise since the token's hash does not match the active session's hash. The backend immediately:
   - Revokes the entire session (set `revoked_at = CURRENT_TIMESTAMP`).
   - Emits a structured security audit event (`INVALID_REFRESH_TOKEN` / `SESSION_REVOKED`).
   - Rejects the request returning `401 Unauthorized` with error code `INVALID_SESSION`.
3. **Session State Evaluation**: Verification checks ensure the session exists, is not revoked, and is not past its expiration date.
4. **Audit Emissions**: Structured audit logging registers three events:
   - `TOKEN_REFRESHED` on successful rotations.
   - `SESSION_REVOKED` when session is revoked.
   - `INVALID_REFRESH_TOKEN` when token reuse is identified.

---

## 7. Success Response (HTTP 200 OK)

Upon validation, the server replaces the old `refreshToken` cookie with the rotated token, and returns a new Access Token with the user profile DTO.

```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "user": {
      "public_id": "8a06e9f1-ca01-447a-8fbb-7ee96df58804",
      "name": "José O'Connor",
      "email": "jose@example.com",
      "role": "customer",
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

## 8. Cookie Specification
The old `refreshToken` cookie is replaced via the response header:

`Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=2592000`

---

## 9. Error Responses

```json
{
  "success": false,
  "message": "Invalid or expired session.",
  "errorCode": "INVALID_SESSION",
  "requestId": "correlation-uuid",
  "details": null
}
```

- **HTTP 401 Unauthorized** (`INVALID_SESSION`):
  - Missing `refreshToken` cookie.
  - Invalid JWT signature.
  - Expired token signature.
  - Revoked/deleted session row.
  - Replay attack/mismatched hash reuse.
