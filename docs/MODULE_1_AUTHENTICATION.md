# Module 1 — Authentication & Multi-Tenancy

**Status:** Complete
**Owner:** Solo project (StatusForge)
**Last updated:** This document is a living record — update it whenever this module changes.

---

## 1. Overview

This module handles everything related to proving who a user is (**authentication**) and what they're allowed to do (**authorization**), plus the tenant boundary (**Organization**) that every other module in StatusForge builds on top of.

**Why this module exists first:** every other feature (Services, Schedules, Incidents) needs to know *who* is asking and *which organization's data* they're allowed to touch. Nothing else in the system can be built safely without this in place.

---

## 2. Goals

- Let a user create an account (email/password, or Google Sign-In)
- Keep users logged in across page reloads without exposing tokens to XSS
- Let users recover access if they forget their password
- Enforce that Org A can never read or modify Org B's data
- Enforce role-based permissions (Admin / Responder / Viewer)
- Detect and respond to session/token theft, not just prevent it in theory

---

## 3. Architecture

```
┌────────────────────┐        ┌─────────────────────────────────────────┐
│   React Frontend     │        │              Express Backend             │
│                      │        │                                           │
│  AuthContext          │ ─────▶ │  helmet → cors → json → cookieParser     │
│  (in-memory token,    │◀───── │       → rateLimiter → zod validate       │
│   silent /refresh)     │        │       → requireAuth → requireRole       │
└────────────────────┘        │              → controller                 │
                                └─────────────┬─────────────────────────────┘
                                              │
                                ┌─────────────┴─────────────┐
                                │        MongoDB Atlas         │
                                │  Organization, User,          │
                                │  RefreshToken                 │
                                └───────────────────────────────┘

External: Google OAuth (ID token verification), Gmail/Nodemailer (transactional email)
```

---

## 4. Data Models

### Organization
| Field | Type | Notes |
|---|---|---|
| name | String | Tenant / company name |
| plan | String enum | `free` \| `pro` (future billing) |

### User
| Field | Type | Notes |
|---|---|---|
| organizationId | ObjectId (ref) | Tenant boundary — present on every query |
| name, email | String | `email` unique, lowercase |
| passwordHash | String, optional | Absent for Google-only accounts until `set-password` is used |
| googleId | String, optional/unique/sparse | Present only for accounts linked to Google |
| role | String enum | `admin` \| `responder` \| `viewer` |
| resetPasswordTokenHash, resetPasswordExpires | String, Date | Only set during an active reset request |

### RefreshToken
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId (ref) | Owner |
| tokenHash | String | SHA-256 hash — raw token never stored |
| familyId | String (UUID) | Groups all rotations of one login session/lineage |
| isUsed | Boolean | Marks a token as retired after rotation |
| expiresAt | Date | TTL-indexed — MongoDB auto-deletes expired documents |

---

## 5. API Endpoints

| Method | Endpoint | Auth | Rate limited | Validated (zod) |
|---|---|---|---|---|
| POST | `/api/auth/signup` | Public | Yes | Yes |
| POST | `/api/auth/login` | Public | Yes | Yes |
| POST | `/api/auth/google` | Public | No | Yes |
| POST | `/api/auth/refresh` | Refresh cookie | No | N/A |
| POST | `/api/auth/logout` | Refresh cookie | No | N/A |
| GET | `/api/auth/me` | Access token | No | N/A |
| POST | `/api/auth/forgot-password` | Public | Yes | Yes |
| POST | `/api/auth/reset-password/:token` | Token in URL | No | Yes |
| POST | `/api/auth/set-password` | Access token | No | Yes |

---

## 6. Security Design Decisions

| Decision | Rationale |
|---|---|
| bcrypt password hashing | One-way hash; a DB leak reveals nothing usable |
| Access token (15m) / refresh token (7d), separate secrets | Limits blast radius if either secret or token leaks |
| Refresh token in httpOnly cookie | Blocks in-page JS (XSS) from reading it |
| Access token in memory only (React Context) | Never persisted to localStorage |
| Refresh token rotation + reuse detection | Detects and reacts to token theft, not just prevents it (see §8) |
| Generic "invalid email or password" | Prevents user enumeration |
| Google `audience` check on ID token verification | Prevents replay of a token issued for a different app |
| Password reset tokens: random, hashed before storage, 15-min expiry | A leaked DB can't be used to hijack accounts via old reset links |
| Zod validation before any controller logic runs | Rejects malformed/malicious input at the door |
| Rate limiting on login/signup/forgot-password | Slows brute-force and credential-stuffing attempts |
| Helmet | Safe HTTP header defaults |
| Fail-fast missing-env-var check on boot | Refuses to start with `undefined` secrets rather than running insecurely |
| Security notification emails (password changed, new login) | Gives the real account owner a signal if something happened without their knowledge |

---

## 7. Key Flows

**Signup:** validate → check duplicate email → create Organization → bcrypt hash password → create User (role: admin) → issue token pair → set refresh cookie → respond.

**Login:** validate → find user → if no `passwordHash`, reject with "uses Google Sign-In" → bcrypt compare → issue token pair → send new-login email → respond.

**Google Sign-In:** verify ID token signature + audience via Google's public keys → find or create user (+ Organization, if new) → issue token pair → send new-login email (existing users only) → respond.

**Silent session restore (frontend):** on every page load, `AuthContext` calls `/api/auth/refresh` using the httpOnly cookie; if valid, the user stays logged in with zero visible interruption.

**Forgot/Reset Password:** generate random token → store only its SHA-256 hash + 15-min expiry → email the raw token as a link → on submit, hash the incoming token and compare → reset password → send password-changed email.

---

## 8. Refresh Token Rotation & Reuse Detection

**Problem this solves:** a stateless JWT refresh token, once issued, is valid until expiry no matter what — there was no way to revoke a specific session early, and a copied/stolen token would work silently and indefinitely.

**Design:** every refresh token belongs to a `familyId` (one per original login). On each use:
1. The token is looked up by its hash in the `RefreshToken` collection.
2. If not found → reject (token doesn't exist / already fully revoked).
3. If found but `isUsed: true` → **reuse detected**: someone is replaying an already-rotated token. The entire `familyId` is deleted, killing every token in that lineage — both the attacker's and the legitimate user's current session.
4. If found and unused → mark it `isUsed: true`, issue a new token in the same family, continue normally.

**Logout** deletes the entire current family immediately, so a logged-out session's tokens can never be replayed.

**Known, accepted limitation (discovered during development):** if a token is copied and used by someone else *before* the legitimate owner ever uses it again, the server has no way to distinguish "real owner" from "copy holder" on that specific first use — both look identical (valid signature, `isUsed: false`). This is a structural limitation of bearer-token/cookie-based sessions in general (true of Gmail, GitHub, and any cookie-authenticated system), not a defect unique to this implementation. Rotation's real value is limiting the *damage window* once reuse occurs, and alerting the account owner via email — not preventing the very first illegitimate use of an already-valid token.

---

## 9. Development Log / Security Findings

This section is a running log of real issues found and fixed during development — written the way a company would log an internal security review, not polished after the fact.

| Date (relative) | Finding | Fix |
|---|---|---|
| Early build | Google-only accounts had no `passwordHash`, causing a confusing failure on email/password login | Added explicit check + clear message directing the user to Google Sign-In or `set-password` |
| Mid build | localStorage held the access token, readable by any injected script (XSS risk) | Replaced with in-memory storage via React Context + silent refresh via httpOnly cookie |
| Mid build | No protection against brute-force login/signup attempts | Added `express-rate-limit` on login, signup, forgot-password |
| Mid build | Controllers trusted raw `req.body` with manual, inconsistent checks | Introduced zod schemas + a generic `validate(schema)` middleware |
| Late build | Self-testing with a browser cookie-editor extension revealed refresh tokens were valid indefinitely with no revocation path | Implemented refresh token rotation + reuse detection (§8) |
| Late build | Even after rotation, a token copied *before* its first use could still log in undetected | Documented as an accepted structural limitation (§8); added new-login email alerts as a compensating control |

---

## 10. Testing

Manual testing performed via curl/Postman/browser for every endpoint above, including:
- Valid and invalid signups (duplicate email, weak password, malformed email)
- Login with correct/incorrect credentials, and Google-only accounts attempting password login
- Full forgot/reset password loop, including expired and reused tokens
- Rate limit triggering after repeated failed logins
- Refresh token rotation (cookie value changes after each refresh)
- Reuse detection (replaying an old, already-rotated token gets blocked and revokes the session)

**Not yet implemented:** automated test suite (Jest + Supertest + mongodb-memory-server) — design discussed, file structure planned, not yet written into the repo.

---

## 11. Known Gaps / Future Scope

- No automated test suite yet
- No email verification on signup (accounts are usable immediately)
- No device fingerprinting / IP binding on sessions (deliberately out of scope — high complexity, limited benefit for this project's threat model)
- No admin-facing "view active sessions" or manual "log out this device" UI (the backend now supports revocation by family, but there's no frontend surface for it yet)

---

## 12. Tech Stack Used in This Module

Express, MongoDB Atlas + Mongoose, jsonwebtoken, bcryptjs, google-auth-library, zod, express-rate-limit, helmet, nodemailer, crypto (Node built-in) — React, React Router, React Context, Axios, @react-oauth/google, lucide-react (frontend).
