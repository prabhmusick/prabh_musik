# API Specification Contract: POST /api/auth/logout & GET /api/auth/me (Frozen)

This document serves as the official API contract and source of truth for frontend client development, backend route handling, endpoint integration testing, and API documentation for SPRINT 6.

---

## 1. Logout Endpoint: `POST /api/auth/logout`

### Headers & Authentication
- **Authentication**: Credentials delivered exclusively via the HttpOnly `refreshToken` cookie.
- **Request Body**: None (Accepts no parameters).

### Normalization & Idempotency Rules
- **Idempotency**: Logout MUST be idempotent. If a request is received from an already logged-out client (no cookie, invalid cookie, expired cookie, or session already marked as revoked), the backend MUST clear the client's `refreshToken` cookie and return `200 OK`.
- **Database Action**: Do NOT delete user session rows. The server updates `revoked_at = CURRENT_TIMESTAMP` and sets `revoked_reason = 'USER_LOGOUT'` for the matching session.

### Success Response (HTTP 200 OK)
- **Response Header**: `Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0` (or `Expires` in the past to clear the cookie).
- **Response Body**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

---

## 2. Current User Endpoint: `GET /api/auth/me`

### Headers & Authentication
- **Authentication**: Enforces credentials delivery via the HTTP `Authorization` header carrying a Bearer Access Token.
- **Required Header**:
  - `Authorization: Bearer eyJhbGciOi...`

### Success Response (HTTP 200 OK)
Returns the mapped User DTO for the currently authenticated user session. This endpoint is the single source of truth for frontend user state.

```json
{
  "success": true,
  "message": "User profile fetched successfully.",
  "data": {
    "user": {
      "public_id": "8a06e9f1-ca01-447a-8fbb-7ee96df58804",
      "name": "José O'Connor",
      "email": "jose@example.com",
      "role": "customer",
      "status": "active"
    }
  }
}
```

### Error Responses

#### 1. Missing or Invalid Authorization Header (HTTP 401 Unauthorized)
```json
{
  "success": false,
  "message": "Authentication token is missing or invalid.",
  "errorCode": "UNAUTHORIZED",
  "requestId": "correlation-uuid",
  "details": null
}
```

#### 2. Suspended Account Block (HTTP 401 Unauthorized)
```json
{
  "success": false,
  "message": "User account is suspended.",
  "errorCode": "USER_SUSPENDED",
  "requestId": "correlation-uuid",
  "details": null
}
```

#### 3. Deleted Account Block (HTTP 401 Unauthorized)
```json
{
  "success": false,
  "message": "User account is deleted.",
  "errorCode": "USER_DELETED",
  "requestId": "correlation-uuid",
  "details": null
}
```
