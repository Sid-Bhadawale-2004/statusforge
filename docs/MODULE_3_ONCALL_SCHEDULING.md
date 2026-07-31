# Module 3 — On-Call Scheduling

**Status:** Backend complete; frontend pending
**Depends on:** Module 1 (Authentication & Multi-Tenancy), Module 2 (Service Management)

---

## 1. Overview

An **On-Call Schedule** defines a rotation rule for a Service — an ordered list of users, how often they rotate (daily/weekly), and when the rotation started. Rather than storing "who's on call today" as a fact that must be manually updated, the system **calculates** the current on-call person on demand from the rule.

---

## 2. Goals

- Let an Admin assign an ordered rotation of team members to a Service
- Automatically compute who is currently on duty, without manual daily/weekly updates
- Guarantee rotation members actually belong to the same organization as the schedule
- Enforce exactly one active schedule per service

---

## 3. Data Model

### OnCallSchedule
| Field | Type | Notes |
|---|---|---|
| organizationId | ObjectId (ref) | Tenant boundary |
| serviceId | ObjectId (ref: Service) | Which service this rotation covers |
| rotationMembers | [ObjectId] (ref: User) | Ordered list — order determines rotation sequence |
| rotationType | String enum | `daily` \| `weekly` |
| startDate | Date | Anchor point the rotation math is calculated from |

**Unique index:** `{ serviceId: 1 }` — exactly one schedule per service; changes go through `PUT`, not a second `POST`.

---

## 4. The Rotation Algorithm

**Formula:** `index = floor(daysElapsed / rotationLengthInDays) % rotationMembers.length`

```
rotationMembers = [Priya, Arjun, Meera]
rotationType    = weekly
startDate       = March 1

Week 0 (Mar 1-7):   index 0 -> Priya
Week 1 (Mar 8-14):  index 1 -> Arjun
Week 2 (Mar 15-21): index 2 -> Meera
Week 3 (Mar 22-28): index 0 -> Priya again (wraps via modulo)
```

Implemented as a **pure function** (`getCurrentOnCallIndex`, `getCurrentOnCallUserId` in `utils/scheduleUtils.js`) — takes a schedule object, returns an answer, touches no database or HTTP layer. This makes the rotation math independently unit-testable without spinning up a server.

**Edge case handled:** if `now < startDate` (the rotation hasn't started yet), the first member (index 0) is treated as on-call by default, rather than returning an error or a negative index.

---

## 5. API Endpoints

| Method | Endpoint | Role required | Validated (zod) |
|---|---|---|---|
| POST | `/api/schedules` | Admin | Yes |
| GET | `/api/schedules/service/:serviceId` | Any logged-in user | N/A |
| PUT | `/api/schedules/:id` | Admin | Yes |
| DELETE | `/api/schedules/:id` | Admin | N/A |

`GET` returns both the raw schedule (with `rotationMembers` populated to `{ name, email }`) and a computed `currentOnCall` object — the frontend never has to re-implement the rotation math itself.

---

## 6. Design Decisions

| Decision | Rationale |
|---|---|
| Rotation math as a pure function, separate from the controller | Independently unit-testable; no DB/HTTP dependency to mock |
| `validateMembersBelongToOrg()` check on create/update | Without it, nothing would stop an admin (accidentally or maliciously) from adding another organization's user ID into a rotation |
| `.populate("rotationMembers", "name email")` | Frontend needs human-readable names, not raw ObjectIds; explicitly limiting populated fields avoids leaking password hashes or other sensitive User fields |
| One schedule per service (unique index on `serviceId`) | A service having two simultaneous, possibly conflicting rotations doesn't make sense; changes are updates, not new schedules |
| `z.coerce.date()` for `startDate` | Incoming JSON always sends dates as strings; without coercion, zod would reject a valid date string for not being a `Date` instance |
| ObjectId format regex validation before DB queries | Rejects garbage IDs early with a clear message instead of a confusing Mongoose cast error |

---

## 7. Key Flow

```
Admin submits schedule form (service, ordered members, rotation type, start date)
   -> zod validates shape + ObjectId format
   -> Service existence + org ownership confirmed
   -> validateMembersBelongToOrg() confirms every member is a real user in this org
   -> OnCallSchedule.create(...)
   -> Unique index blocks a second schedule for the same service (409)

Anyone requests GET /api/schedules/service/:serviceId
   -> schedule fetched + populated
   -> getCurrentOnCallUserId(schedule) computes today's on-call index
   -> response includes both the raw schedule and the resolved current user
```

---

## 8. Testing

Manually tested via curl:
- Created a schedule with 3 rotation members, weekly rotation
- Verified `currentOnCall` changes correctly when `startDate` is adjusted to different past dates, matching manual calculation
- Confirmed rejection when a rotation member ID doesn't belong to the requesting organization
- Confirmed duplicate schedule creation for the same service returns 409

**Not yet implemented:** automated tests; frontend schedule builder UI.

---

## 9. Known Gaps / Future Scope

- No schedule override/exception handling (e.g., "Priya is on vacation this week, swap with Arjun") — a common real-world PagerDuty feature, noted as future scope
- No timezone handling — all rotation math currently assumes a single implicit timezone (server time); a production system would need explicit timezone-aware rotation boundaries
- No frontend yet — this is the next immediate step

---

## 10. Tech Stack Used in This Module

Express, Mongoose (`.populate()`, compound unique index), zod (`z.coerce.date`, regex validation) — pure JS date/modulo arithmetic for the rotation engine, no external scheduling library used.
