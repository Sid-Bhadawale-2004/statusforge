# Module 5 — Incident Ingestion

**Status:** Backend complete (webhook + self health-checker); frontend/dashboard pending
**Depends on:** Modules 1-4

---

## 1. Overview

This is the module where an incident first enters StatusForge for real. Three different sources funnel into one shared function (`createIncidentIfNotDuplicate`): a signed webhook from an external monitoring tool, StatusForge's own built-in health-check cron job, and the manual test-trigger from Module 4.

---

## 2. Goals

- Accept incident alerts from an external source without requiring a login (webhooks have no JWT)
- Verify the caller is genuine using HMAC signatures, not just "the URL is hard to guess"
- Provide real, self-contained 24/7 monitoring via a cron job, with zero external dependency
- Avoid duplicate incidents when a flaky service fires the same alert repeatedly
- Auto-resolve an incident when a service recovers on its own
- Keep `Service.currentStatus` in sync with reality at all times

---

## 3. Data Model Changes

### Service (additions)
| Field | Type | Notes |
|---|---|---|
| webhookSecret | String | Generated at creation; used to HMAC-sign webhook payloads |
| healthCheckUrl | String, optional | If set, the self health-checker pings this URL every minute |

---

## 4. API Endpoints

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/incidents/webhook/:serviceId` | **None** (HMAC signature instead) | Public; rate-limited to 30/minute |

---

## 5. Design Decisions

| Decision | Rationale |
|---|---|
| Shared `createIncidentIfNotDuplicate()` service function | Webhook, health-checker, and manual trigger all funnel through one function — a bug fix or behavior change happens in exactly one place |
| Per-service `webhookSecret`, not per-organization | Smallest possible blast radius if one secret ever leaks |
| HMAC-SHA256 signature over the raw request body | Proves the request genuinely came from a holder of the secret, without ever transmitting the secret itself |
| `crypto.timingSafeEqual()` instead of `===` for signature comparison | A plain `===` exits on the first mismatched character, leaking timing information an attacker could exploit to guess the secret byte-by-byte; timingSafeEqual always takes constant time |
| Generic 401 message regardless of failure reason | Doesn't reveal whether a service ID exists or whether the secret was simply wrong |
| Duplicate-incident check (`status: { $in: ["triggered","acknowledged"] }`) before creating a new one | A flaky service alerting every few seconds shouldn't create dozens of incidents — reuses the existing open one |
| `healthCheckUrl` is optional per service | Self-monitoring is opt-in; a service with no meaningful HTTP health endpoint (or a purely manual process) isn't forced into the checker |
| Health-checker uses a 5-second timeout | Prevents one slow/hanging service from stalling the entire per-minute check cycle for every other service |
| Auto-resolve on health-check recovery | Closes the loop without requiring a human to notice and manually resolve — mirrors how real uptime monitors behave |

---

## 6. Key Flow

```
EXTERNAL MONITORING TOOL                 STATUSFORGE'S OWN HEALTH-CHECKER
--------------------------                ---------------------------------
1. Detects failure                       1. Cron runs every minute
2. POSTs to /webhook/:serviceId,         2. GETs each service's healthCheckUrl
   body signed with service's secret     3. Failure/timeout -> same shared
3. Server verifies signature                incident-creation function
   (timingSafeEqual)                     4. Success AND service was "outage"
4. Verified -> shared incident              -> auto-resolve the open incident
   creation function runs                    -> Service.currentStatus reset

Both paths converge here:
   -> No open incident for this service? Create one, start escalation timer
      (Module 4's engine takes over from here), set Service.currentStatus = "outage"
   -> Open incident already exists? Return it unchanged, no duplicate created
```

---

## 7. Testing

Manually tested via curl and a deliberately-broken health check URL:
- Valid signature -> incident created, Service status flips to `outage`
- Invalid/missing signature -> `401`, no incident created
- Repeated webhook calls for the same service while an incident is still open -> no duplicate incidents created
- `healthCheckUrl` pointed at a nonexistent endpoint -> incident auto-created within ~1 minute
- `healthCheckUrl` fixed to point at something healthy -> incident auto-resolved, `Service.currentStatus` returned to `operational`, within ~1 minute

**Not yet implemented:** frontend UI for viewing the webhook secret/URL to configure in an external tool; incident timeline/event log (Module 6-ish); real-time push of incident state to the dashboard (Socket.IO — planned, not built).

---

## 8. Known Gaps / Future Scope

- No incident event timeline yet (created/escalated/acknowledged/resolved as a chronological log) — currently only the final state is stored, not the history of how it got there
- No UI to view/regenerate a service's webhook secret
- Health-checker treats any non-2xx or timeout identically as "down" — no distinction between "slow" (degraded) and "completely unreachable" (outage)
- No webhook secret rotation mechanism

---

## 9. Tech Stack Used in This Module

Node's built-in `crypto` module (HMAC, `timingSafeEqual`), `axios` (health-check HTTP requests), `node-cron` (recurring health checks, separate job from Module 4's escalation checker), `express-rate-limit` (public endpoint protection).
