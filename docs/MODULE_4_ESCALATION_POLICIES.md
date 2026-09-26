# Module 4 — Escalation Policy Engine

**Status:** Backend complete (policy CRUD + engine + test-trigger); frontend pending
**Depends on:** Module 1 (Auth), Module 2 (Services), Module 3 (On-Call Scheduling)

---

## 1. Overview

An Escalation Policy defines what happens when an on-call responder doesn't acknowledge an incident in time: an ordered chain of steps, each notifying a different person after a configured timeout. This module also introduces StatusForge's first **background job** — a recurring process that acts on its own, independent of any user request — plus a minimal `Incident` model (a small piece of Module 5, pulled forward because the engine is untestable without something to escalate).

---

## 2. Goals

- Let an Admin define an ordered escalation chain per service, each step with its own timeout and notify-target
- Guarantee escalation timing survives server restarts/redeploys — no reliance on in-memory timers
- Automatically advance an incident through the chain if it isn't acknowledged in time
- Stop escalation immediately and permanently once an incident is acknowledged or resolved
- Notify escalation targets via email, and optionally a real phone call (Twilio, free-tier)

---

## 3. The Core Architectural Decision

**Problem:** `setTimeout(() => escalate(), timeoutMs)` is unreliable — if the Node process restarts (crash, redeploy, or a free-tier host spinning down an idle server), every pending in-memory timer is wiped instantly. An incident seconds from escalating would simply never escalate, silently.

**Solution:** store the *next escalation time* as a plain timestamp in the database (`Incident.nextEscalationAt`), and run a **recurring checker** (cron job, every minute) that asks "what's overdue right now?" This re-derives the answer fresh from the database on every run — a crash costs at most a minute of delay, never a lost escalation.

```
Incident triggered -> nextEscalationAt saved in MongoDB -> checker runs every minute
   -> is anything overdue? -> yes: notify next step, advance, set new nextEscalationAt
                            -> no:  do nothing, check again in 60 seconds
```

---

## 4. Data Models

### EscalationPolicy
| Field | Type | Notes |
|---|---|---|
| organizationId | ObjectId (ref) | Tenant boundary |
| serviceId | ObjectId (ref: Service) | One policy per service (unique index) |
| steps | Array<{ order, timeoutMinutes, notifyUserId }> | Ordered chain; subdocuments use `{ _id: false }` since steps are never referenced independently |

### Incident (minimal version — Module 5 will expand this)
| Field | Type | Notes |
|---|---|---|
| organizationId, serviceId | ObjectId (ref) | Ownership |
| title | String | Human-readable summary |
| status | String enum | `triggered` \| `acknowledged` \| `resolved` |
| severity | String enum | `P1`-`P4` |
| currentEscalationStep | Number | Index into the policy's steps array |
| nextEscalationAt | Date, nullable | The database-backed replacement for an in-memory timer. `null` means "not currently escalating" |
| resolvedAt | Date | Set when resolved |

---

## 5. API Endpoints

| Method | Endpoint | Role | Notes |
|---|---|---|---|
| POST | `/api/escalation-policies` | Admin | Create a policy for a service |
| GET | `/api/escalation-policies/service/:serviceId` | Any | Fetch a service's policy, steps populated with user name/email |
| PUT | `/api/escalation-policies/:id` | Admin | Update steps |
| DELETE | `/api/escalation-policies/:id` | Admin | Remove a policy |
| POST | `/api/incidents/test-trigger` | Any (temporary) | Manually create a test incident — stand-in for Module 5's real webhook ingestion |
| GET | `/api/incidents` | Any | List org's incidents |
| POST | `/api/incidents/:id/acknowledge` | Any | Stops escalation (`nextEscalationAt` cleared) |
| POST | `/api/incidents/:id/resolve` | Any | Closes the incident, stops escalation |

---

## 6. Design Decisions

| Decision | Rationale |
|---|---|
| `nextEscalationAt` stored in DB, checked by a recurring cron job | Survives server restarts — the actual reliability fix this module exists to provide |
| Cron runs every 1 minute (`node-cron`, `"* * * * *"`) | Coarse enough to be cheap, fine-grained enough that escalation delay is never more than ~60 seconds off |
| `validateStepUsersBelongToOrg()` before saving a policy | Same multi-tenant integrity check as Module 3's rotation members — prevents notifying a user outside the organization |
| Steps sorted by `order` before saving | Guarantees the engine always walks the chain in the intended sequence, regardless of what order the client submitted them in |
| `if (!nextStep)` guard when the policy is exhausted | Without it, indexing past the end of the steps array returns `undefined`, and calling `.notifyUserId` on it would crash the entire job — taking down escalation checking for every incident, not just this one |
| Acknowledge/resolve set `nextEscalationAt: null` | This is the entire "stop escalating" mechanism — no timer to cancel, just an absence of a due date the checker will ever match |
| Email is mandatory; phone call is optional (`if (user.phone)`) | Calling is a bonus channel layered on top of a channel that always works, not a replacement for it |
| Twilio + Twimlets URL (`twimlets.com/message`) instead of a custom TwiML endpoint | Avoids needing a publicly reachable server just to test calling locally, before deployment exists |

---

## 7. Key Flow

```
Admin defines policy: [Step 0: notify on-call, 5 min] -> [Step 1: notify lead, 10 min]

Incident triggered (test-trigger, later: real webhook)
   -> currentEscalationStep = 0, nextEscalationAt = now + step[0].timeoutMinutes

Every minute, the checker asks: "status=triggered AND nextEscalationAt <= now?"
   -> match found -> look up steps[currentEscalationStep + 1]
      -> exists -> email (+ call if phone set) that user, advance step, set new nextEscalationAt
      -> doesn't exist -> policy exhausted, clear nextEscalationAt, leave incident open for a human

Responder acknowledges or resolves at any point
   -> nextEscalationAt set to null -> incident becomes invisible to the checker, permanently
```

---

## 8. Testing

Manually tested via curl:
- Created a 2-step policy with 1-minute timeouts for fast iteration
- Triggered a test incident, confirmed it escalated to step 1 after ~60 seconds (email received, log line printed)
- Confirmed a third check correctly logged "policy exhausted" instead of crashing
- Acknowledged a fresh incident immediately and confirmed no further escalation email arrived after waiting several minutes
- Verified a Twilio-verified phone number receives an actual spoken call alongside the email

**Not yet implemented:** automated tests for the cron logic; frontend UI for building/viewing escalation policies; real webhook-based incident ingestion (Module 5 replaces `test-trigger`).

---

## 9. Known Gaps / Future Scope

- No retry/backoff if sending the notification email or placing the call itself fails mid-escalation (currently just logged and skipped)
- No "acknowledge via reply" (e.g., replying to the email or pressing a key during the call) — acknowledgment currently requires opening the dashboard
- Twilio free trial requires each recipient's phone number to be manually verified in the console and expires after 30 days — documented as a demo-scale limitation, not a production path
- Escalation timing doesn't account for timezones (same limitation noted in Module 3)

---

## 10. Tech Stack Used in This Module

`node-cron` (recurring job scheduling), Mongoose (subdocument arrays, `{ _id: false }`), zod (nested array/object validation), `twilio` SDK + Twimlets (voice calls), reused `sendEmail` utility from Module 1.
