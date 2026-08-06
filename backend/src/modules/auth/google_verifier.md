# Google Identity Verification Layer

## Purpose
The Google Verification Layer provides a decoupled helper interface designed to authenticate third-party Google Identity Tokens securely. It serves as an authentication foundation, validating tokens prior to user creation or session lifecycle handling.

---

## Responsibilities
- **Singleton Client Management:** Maintains a single instance of `OAuth2Client` to prevent memory leaks and overhead per verification request.
- **Signature & Expiry Validation:** Checks the integrity of the JWT signature and enforces that expired tokens are immediately rejected.
- **Audience & Issuer Restrictions:** Restricts acceptance strictly to configured `GOOGLE_CLIENT_ID` values and valid Google account issuers.
- **Payload Sanitization:** Normalizes claims from the validated payload into a consistent, frozen, and immutable profile DTO.

---

## Verification Flow

```
Client (ID Token)
      ↓
POST /api/auth/google
      ↓
google.verifier.js ──[Instance Check]──> OAuth2Client Singleton
      ↓
Verify Signature & Expiration via google-auth-library
      ↓
Explicit Issuer Check (accounts.google.com / https://accounts.google.com)
      ↓
Explicit Claim Check (presence of 'sub' and 'email')
      ↓
Map & Freeze Output DTO
      ↓
Return Immutable Verified Profile DTO
```

---

## Validation Rules
1. **Token Malformation:** Token must be a non-empty string.
2. **Issuer Enforcement (`iss`):** Must match `https://accounts.google.com` or `accounts.google.com` exactly.
3. **Audience Mapping (`aud`):** Must match the configured `GOOGLE_CLIENT_ID`.
4. **Subject Integrity (`sub`):** Google user ID must be present in payload claims.
5. **Email Presence (`email`):** Profile email address is required.

---

## DTO Contract
The return value is a frozen object matching this structure:

```typescript
interface VerifiedGoogleProfile {
  readonly provider: "google";
  readonly providerId: string;   // Maps from payload.sub
  readonly email: string;        // Maps from payload.email
  readonly emailVerified: boolean; // Maps from payload.email_verified
  readonly displayName: string;  // Maps from payload.name
  readonly avatarUrl: string;    // Maps from payload.picture
}
```

---

## Failure Scenarios
- **Expired Token:** Throws `AppError(401)` with message `"Google ID Token verification failed: Token used too late"`.
- **Audience Mismatch:** Throws `AppError(401)` with message `"Google ID Token verification failed: Wrong recipient"`.
- **Invalid Issuer:** Throws `AppError(401)` with message `"Google ID Token verification failed: Invalid issuer [issuer_name]"`.
- **Missing Claims (`email`/`sub`):** Throws `AppError(401)` with details on the missing attribute.

---

## Example Success DTO
```json
{
  "provider": "google",
  "providerId": "109283746561029384756",
  "email": "producer.john@gmail.com",
  "emailVerified": true,
  "displayName": "John Doe",
  "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8oc..."
}
```

---

## Example Error Flow

```
POST /api/auth/google
   |
   +--> verifyGoogleIdToken("expired_token...")
           |
           +--> OAuth2Client.verifyIdToken() throws "Token used too late"
                   |
                   +--> Caught and mapped to AppError(401)
                           |
                           +--> Server returns 401 Unauthorized Response:
                                {
                                  "success": false,
                                  "message": "Google ID Token verification failed: Token used too late"
                                }
```
