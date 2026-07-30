# Module 2 — Service Management

**Status:** Complete (backend + frontend)
**Depends on:** Module 1 (Authentication & Multi-Tenancy)

---

## 1. Overview

A **Service** represents one thing an engineering team is responsible for keeping alive (e.g., "Payments API," "Login Service"). It's the stable anchor point every later module attaches to — On-Call Schedules, Escalation Policies, and eventually Incidents all reference a Service, not the other way around.

---

## 2. Goals

- Let an Admin register the services their organization wants monitored
- Let any team member (Admin, Responder, Viewer) view the list, but only Admins modify it
- Enforce that a service name is unique *within* an organization, but not globally
- Guarantee no organization can ever read or modify another organization's services

---

## 3. Data Model

### Service
| Field | Type | Notes |
|---|---|---|
| organizationId | ObjectId (ref) | Tenant boundary |
| name | String | e.g. "Payments API" |
| currentStatus | String enum | `operational` \| `degraded` \| `outage`, defaults to `operational` |
| description | String, optional | Shown on internal dashboard / future public status page |

**Compound unique index:** `{ organizationId: 1, name: 1 }` — allows "Payments API" to exist in two different organizations, while blocking a duplicate name within the same one.

---

## 4. API Endpoints

| Method | Endpoint | Role required | Validated (zod) |
|---|---|---|---|
| POST | `/api/services` | Admin | Yes |
| GET | `/api/services` | Any logged-in user | N/A |
| GET | `/api/services/:id` | Any logged-in user | N/A |
| PUT | `/api/services/:id` | Admin | Yes |
| DELETE | `/api/services/:id` | Admin | N/A |

All routes require `requireAuth`; write routes additionally require `requireRole("admin")`.

---

## 5. Design Decisions

| Decision | Rationale |
|---|---|
| Every query scoped by `{ _id, organizationId }`, never `_id` alone | Prevents one org from reading/modifying another org's service by guessing or leaking an ID |
| Compound unique index (`organizationId + name`) instead of a global unique `name` | A global unique index would block every other tenant from ever using a common service name |
| Role check enforced server-side (`requireRole("admin")`), not just hidden in the UI | Frontend role checks are a UX convenience only; the backend is the actual security boundary |
| Zod validation on create/update | Rejects empty names and malformed input before it reaches the database |

---

## 6. Key Flow

```
Admin submits "Add Service" form
   → zod validates { name, description }
   → requireRole("admin") confirms permission
   → Service.create({ organizationId: req.user.organizationId, ... })
   → Mongo enforces the compound unique index (duplicate -> 409)
   → New service returned, inserted at top of frontend list without a re-fetch
```

---

## 7. Frontend

- `ServicesPage.jsx` — fetches the org's services on mount (`useEffect`), renders a list with a `StatusBadge`, and (Admin-only) an add-service form and delete buttons.
- `StatusBadge.jsx` — small reusable component mapping `operational` / `degraded` / `outage` to consistent colors, reused later on the incident view and public status page.
- Role gating (`isAdmin = user?.role === "admin"`) hides admin-only controls for Responders/Viewers — cosmetic only; real enforcement is server-side.

---

## 8. Testing

Manually tested via curl and browser:
- Create, list, and duplicate-name rejection (409)
- Invalid input rejection (empty name -> 400 via zod)
- Cross-role behavior: Admin sees add/delete controls; Responder/Viewer see read-only list
- Confirmed a service ID from one organization cannot be fetched/modified/deleted using another organization's access token

**Not yet implemented:** automated test suite for this module.

---

## 9. Known Gaps / Future Scope

- No pagination — fine at current scale, would need addressing if an organization had hundreds of services
- No service history/audit log (who changed status and when) — planned for the Analytics/Audit Logs module later
- No bulk import of services

---

## 10. Tech Stack Used in This Module

Express, Mongoose (compound index), zod — React, `useState`/`useEffect`, Axios (no new libraries beyond what Module 1 already introduced).
