# Provider-Agnostic OAuth Authentication & Account Linking

## Overview
This document outlines the detailed sequence flows, transactional boundaries, account-linking rules, and security checks for the unified OAuth pipeline in the Prabh Musik backend.

---

## Sequence Diagram

```
Client               Controller              Service              Verifier           Repository           Database
  |                      |                      |                    |                   |                   |
  |--- POST /google ---->|                      |                    |                   |                   |
  |    (idToken)         |-- verifyIdToken() -->|                    |                   |                   |
  |                      |<-- Profile DTO ------|                    |                   |                   |
  |                      |                      |                    |                   |                   |
  |                      |-- oauthLogin() ----->|                    |                   |                   |
  |                      |   (profile, context) |                    |                   |                   |
  |                      |                      |                    |                   |                   |
  |                      |                      |--------- findCredential() ------------>|                   |
  |                      |                      |<-------- null / Credential ------------|                   |
  |                      |                      |                                        |                   |
  |                      |                      |====== IF NOT FOUND: LINK OR CREATE ====|                   |
  |                      |                      |                                        |                   |
  |                      |                      |-- findUserByEmail() ------------------>|                   |
  |                      |                      |<-- User Profile / null ----------------|                   |
  |                      |                      |                                        |                   |
  |                      |                      |--------- BEGIN TRANSACTION ------------------------------->|
  |                      |                      |                                        |                   |
  |                      |                      |-- [Link User] createCredential() ----->|                   |
  |                      |                      |   OR [New User] createUser() --------->|                   |
  |                      |                      |                                        |                   |
  |                      |                      |-- createSession() -------------------->|                   |
  |                      |                      |-- updateLastLoginAt() ---------------->|                   |
  |                      |                      |                                        |                   |
  |                      |                      |--------- COMMIT TRANSACTION ------------------------------>|
  |                      |                      |                                                            |
  |                      |                      |-- generateAccessToken()                |                   |
  |                      |                      |-- generateRefreshToken()               |                   |
  |                      |                      |                                                            |
  |                      |<-- Tokens & DTO -----|                                                            |
  |                      |                                                                                   |
  | Set HttpOnly Cookie  |                                                                                   |
  |<-- 200 OK Json ------|                                                                                   |
```

---

## Architecture Flow & Separation of Concerns

1. **Routing and Verification (Provider-Specific):** The routing controller (e.g. `googleLogin`) reads the raw client token and validates it against the third-party issuer (e.g. using `googleVerifier`).
2. **Normalized Transfer Objects:** The verifier returns a standardized `OAuthProfileDTO` containing provider details, unique IDs, names, emails, and verification flags:
   ```typescript
   interface OAuthProfileDTO {
     provider: "google" | "apple";
     providerId: string;
     email: string;
     emailVerified: boolean;
     displayName: string;
     avatarUrl?: string;
     givenName?: string;
     familyName?: string;
   }
   ```
3. **Core AuthService (Provider-Agnostic):** `AuthService.oauthLogin(profile, clientContext)` receives the DTO. It does not know about Google SDKs or custom provider properties. It handles generic account lookups, transactions, linking, sessions, and audits.

---

## Business & Security Rules

1. **Email Verification Enforcement:** Before doing any database lookup or linkage, the service checks:
   ```javascript
   if (!profile.emailVerified) {
     const err = new AppError(`${profile.provider === "google" ? "Google" : profile.provider} email is not verified.`, 401);
     err.errorCode = "OAUTH_EMAIL_NOT_VERIFIED";
     throw err;
   }
   ```
2. **Passwordless Security:** OAuth credentials have `password_hash = NULL`. The backend does not generate random passwords, preventing shadow password vulnerabilities.
3. **Suspension Restrictions:** Users marked as `suspended` or `deleted` are blocked from authenticating. The backend throws an `AppError(401)` with error code `USER_SUSPENDED` or `401 Unauthorized`.
4. **Idempotence & Concurrency:** Unique database constraints on `users(email)` and `user_credentials(provider, provider_id)` prevent race conditions from generating duplicate records. Parallel logins result in transaction rollbacks for concurrent duplicate writes, preserving structural database consistency.

---

## Transaction Flow
All database modifications are handled atomically inside a SQLite transaction block:

```javascript
await executeTransaction(async (tx) => {
  // 1. Create user record (if new)
  const userResult = await usersRepository.createUser(tx, profile);

  // 2. Link/create credential
  await authRepository.createCredential(tx, credentialData);

  // 3. Create active session mapping
  await authRepository.createSession(tx, sessionData);
});
```

---

## Future Apple Sign-In Integration
To add Apple Sign-In:
1. Create `apple.verifier.js` to verify Apple Identity tokens (verifying signature using Apple JWKS, audience check, and claim verification).
2. Map fields to the standard `OAuthProfileDTO` (setting `provider = "apple"`).
3. Call `AuthService.oauthLogin(appleProfileDTO)` directly, achieving 100% reuse of the service, repository, session, cookie, and JWT layers.
