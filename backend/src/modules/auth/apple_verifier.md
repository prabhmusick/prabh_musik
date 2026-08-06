# Apple OIDC Identity Verification Layer

## Overview
This document specifies the design, security invariants, error handling mappings, and OIDC compliance features for the Apple ID Token verification utility (`apple.verifier.js`).

---

## Verification Pipeline Flow

```
Raw ID Token
     ↓
Decode Header → Read Key ID (kid)
     ↓
Query Apple JWKS Endpoint (https://appleid.apple.com/auth/keys)
     ↓
Resolve Public Signing Key (Validated against cache & rate-limits)
     ↓
Verify Token Signature (algorithms: ["RS256"] only)
     ↓
Verify Issuer Claims (Exactly matches https://appleid.apple.com)
     ↓
Verify Audience Claims (aud in APPLE_ALLOWED_AUDIENCES array)
     ↓
Verify Token Expiry (exp claim checks)
     ↓
[Optional] Verify Nonce (Matches expectedNonce if provided)
     ↓
Validate sub Claim (Must exist and not be empty)
     ↓
Extract and Cast email_verified (string/boolean → boolean)
     ↓
Extract and Map email (defaults to "" if absent)
     ↓
Return Frozen OAuthProfileDTO
```

---

## Standard OAuthProfileDTO Schema

Returned payload is a read-only, provider-agnostic profile Object compatible with `AuthService.oauthLogin()`:

```typescript
interface OAuthProfileDTO {
  provider: "apple";
  providerId: string;      // maps from sub claim
  email: string;           // maps from email claim, defaults to "" if absent
  emailVerified: boolean;  // maps from email_verified, casts to boolean
  displayName: "";         // empty (Apple does not include names in tokens)
  avatarUrl: "";           // empty
  givenName: "";           // empty
  familyName: "";          // empty
}
```

---

## OIDC & Security Invariants

1. **Algorithm Security:** Cryptographic checks strictly enforce `RS256`. Rejects tokens utilizing symmetric `HS256` or the `none` algorithm to safeguard against signature bypass attacks.
2. **JWKS Cache Policies:** Signatures are checked against cached public keys (cached for 24 hours). This mitigates continuous HTTP roundtrips, keeping request overhead low and preventing rate limit blocks from Apple.
3. **Cache Eviction Safeguard:** Rate limiting is set to 10 requests/minute on the JWKS client, protecting the key resolver from flood attacks utilizing fake `kid` values.
4. **Stable User Identifiers:** Replaces dynamic mapping fields with the OIDC-defined `sub` claim which acts as Apple's unique, permanent user ID.
5. **Relay Domain Compatibility:** Apple's private relay domains (e.g. `*@privaterelay.appleid.com`) parse seamlessly as verified emails.

---

## Operational Error Mapping
All internal signature failures, transport errors, lookup timeouts, and config violations are wrapped and presented as clean operational errors:

* **JWKS Failures (Network error, unknown kid, timeout, signing key lookup failures):** Wraps into `AppError("Apple ID Token verification failed: Unable to retrieve signing keys.", 401)`.
* **Missing Subject Claim:** Throws `AppError("Invalid Apple ID token.", 401)`.
* **Audience Mismatch:** Throws `AppError("Apple ID Token verification failed: Audience mismatch.", 401)`.
* **Nonce Mismatch:** Throws `AppError("Apple ID Token verification failed: Nonce mismatch.", 401)`.
* **Signature/Expiry Violations:** Throws `AppError("Apple ID Token verification failed: <Details>", 401)`.
* **Missing Token Parameter:** Throws `AppError("Malformed or missing Apple ID Token.", 401)`.
