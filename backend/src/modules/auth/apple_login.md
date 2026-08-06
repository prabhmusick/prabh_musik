# Apple Sign-In Integration & Account Linking Architecture

## Overview
This document specifies the sequence flows, database linking rules, transaction boundaries, session lifecycles, and future cross-platform client compatibility guidelines for the Apple OAuth Sign-In integration inside the Prabh Musik backend.

---

## Authentication Sequence Flow

```
Apple Client          Controller            Verifier            AuthService         Repository            Database
     |                     |                    |                    |                   |                   |
     |-- POST /apple ----->|                    |                    |                   |                   |
     |   (idToken, nonce)  |-- verifyToken() -->|                    |                   |                   |
     |                     |<-- Profile DTO ----|                    |                   |                   |
     |                     |                                         |                   |                   |
     |                     |-------- oauthLogin(profile, context) -->|                   |                   |
     |                     |                                         |-- findProvider()-->|                   |
     |                     |                                         |<-- null/row ------|                   |
     |                     |                                         |                   |                   |
     |                     |                                         |-- findEmail() --->|                   |
     |                     |                                         |<-- User/null -----|                   |
     |                     |                                         |                                       |
     |                     |                                         |====== TX BEGIN =======================|
     |                     |                                         |                                       |
     |                     |                                         |-- createCred() -->|                   |
     |                     |                                         |   OR createUser()-->|                   |
     |                     |                                         |-- createSession()-->|                  |
     |                     |                                         |                                       |
     |                     |                                         |====== TX COMMIT ======================|
     |                     |                                         |                                       |
     |                     |<-- User & Tokens -----------------------|                                       |
     |                     |                                                                                 |
     | Set HttpOnly Cookie |                                                                                 |
     |<-- 200 OK Json -----|                                                                                 |
```

---

## Account Linking Rules

When a verified Apple ID token is received by `oauthLogin`:
1. **Apple Credential Exists:** Authenticates directly to the mapped internal user profile.
2. **Email Matches Pre-existing Local/Google Account:** Links the Apple provider credential to the existing user profile inside a transaction. Local email credentials (passwords) and other linked OAuth credentials remain intact and functional.
3. **No Match Found:** Registers a new user profile with default role `customer`, inserts a new Apple credential, and initiates their active session.

---

## Apple-Specific Edge Case Behaviors

### 1. Private Relay Emails
* If a user selects "Hide My Email" during the Apple Sign-In prompt, Apple generates a private relay email address ending in `@privaterelay.appleid.com`.
* The backend treats private relay emails exactly like normal emails. They are unique, stable, and used as the unique `email` key in the `users` table.

### 2. Missing Email Claims
* If a client misconfigures scopes or does not request email permissions, the ID Token will not contain an `email` claim.
* The Apple verifier normalizes this claim to `""` (empty string).
* The database enforces a `NOT NULL` constraint on user emails. Thus, attempting to register a brand new user with an empty email will fail cleanly at the database constraint layer inside the transaction boundary, triggering a rollback.

---

## Session Lifecycle & Replay Protection

* **JWT Issuance:** Successful sign-in generates an Access Token (valid for 15 minutes) containing user public UUID and role, and a secure Refresh Token (valid for 30 days) containing session UUID (`sid`).
* **Refresh Token Rotation:** Every call to `POST /api/auth/refresh` rotates the refresh token. The previous token is immediately revoked.
* **Replay Detection:** If a revoked refresh token is presented, the system flags it as a replay attack and revokes all active sessions belonging to that token's session family.
* **Nonce Verification:** Apple clients can pass a cryptographically random `nonce` string. The backend verifies this nonce claim during verification to prevent authorization code replays on public clients.

---

## Future Cross-Platform Compatibility

The backend's OIDC implementation is built to support native and web logins seamlessly:
1. **Multi-Audience Support:** The verifier accepts tokens matching any audience in `env.APPLE_ALLOWED_AUDIENCES` (e.g. Bundle ID `com.prabhmusik.app` for iOS, `com.prabhmusik.macos` for macOS, or Services ID `com.prabhmusik.service` for Web Sign-In).
2. **Decoupled Client Schema:** Verification does not assume platforms always share name components. iOS, Web, macOS, or VisionOS clients can query sign-ins independently, and the backend handles standard token validation without changes.
