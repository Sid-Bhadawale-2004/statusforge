# StatusForge

**Incident Management, Status Page & On-Call Scheduling Platform**

A self-built alternative to PagerDuty / Atlassian Opsgenie / Statuspage — receives incident alerts, escalates them through an on-call chain until someone responds, and communicates live service health to the public, without anyone needing to refresh a page.

> Built solo as an MCA final-year project, engineered to production-quality standards rather than as a classroom exercise.

---

## Why this exists

When a production service goes down, two things need to happen at once:
1. **The right engineer gets woken up** — not everyone, just whoever is on-call, escalating automatically if they don't respond in time.
2. **Affected users get told the truth, immediately** — instead of flooding support with "is your site down?" tickets.

Every real SaaS company solves this with tools like PagerDuty, Opsgenie, or Better Stack. StatusForge rebuilds that exact workflow from scratch — escalation engine, on-call rotations, real-time dashboards, and a public status page — as a fully working system.

---

## Current Status

This project is being built and documented incrementally — this README reflects real progress, not a finished-product fiction.

| Module | Status |
|---|---|
| Authentication (JWT + Google OAuth + Forgot/Reset Password) | ✅ Complete |
| Organization & Multi-Tenant Data Model | ✅ Complete |
| Service Management | ✅ Complete |
| On-Call Scheduling | 🔧 In Progress |
| Escalation Policy Engine | ⏳ Planned |
| Incident Ingestion (Webhook API) | ⏳ Planned |
| Incident Dashboard & Timeline | ⏳ Planned |
| Public Status Page (Real-Time) | ⏳ Planned |
| AI-Generated Postmortems | ⏳ Planned (stretch goal) |

---

## Features Implemented So Far

- **JWT authentication** — short-lived access tokens + httpOnly-cookie refresh tokens, with silent session restoration on page reload
- **Google Sign-In (OAuth)** — verified server-side via Google's public keys, with automatic account linking for existing email/password users
- **Forgot / Reset Password** — one-time hashed reset tokens, 15-minute expiry, generic responses that don't leak which emails are registered
- **Set Password** — lets a Google-only account add a password later, without needing email re-verification
- **Role-Based Access Control** — Admin / Responder / Viewer roles enforced server-side via middleware
- **Multi-tenant data isolation** — every user, service, and future incident is scoped to an `organizationId`; no tenant can query another tenant's data, even by guessing an ID

---

## Tech Stack

**Frontend**
- React (Vite)
- React Router
- Tailwind CSS v4
- Axios
- React Context (in-memory auth state — no tokens in localStorage)

**Backend**
- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT (`jsonwebtoken`) + `bcryptjs`
- `google-auth-library` (Google OAuth verification)
- Nodemailer (password reset emails)
- Socket.IO *(planned — real-time dashboard/status page updates)*
- node-cron *(planned — escalation timeout checks)*

**Tooling**
- Git & GitHub
- Postman / curl for API testing
- Docker *(planned for deployment)*
- GitHub Actions *(planned CI/CD)*

---

## Architecture

```
┌────────────────┐        REST API         ┌─────────────────────┐
│  React Frontend │ ───────────────────────▶│   Express Backend    │
│  (Vite + Tailwind)│◀──────────────────────│  (Node.js + JWT)     │
└────────────────┘                          └──────────┬───────────┘
                                                         │
                                              ┌──────────┴───────────┐
                                              │   MongoDB Atlas       │
                                              │ (Organizations, Users,│
                                              │  Services, Incidents) │
                                              └───────────────────────┘

Planned once Incident Ingestion is built:

External Monitoring Tool ──(signed webhook)──▶ Incident Ingestion API
                                                       │
                                            Escalation Engine (timers)
                                                       │
                                     Notification Service (Email/SMS)
                                                       │
                                Socket.IO ──▶ Live Dashboard + Public Status Page
```

Every request that touches data is scoped by `organizationId`, extracted from the verified JWT — never trusted from the request body — enforcing tenant isolation at the query level, not just the UI level.

---

## Getting Started

### Prerequisites
- Node.js (LTS)
- A free MongoDB Atlas cluster
- A Google Cloud OAuth Client ID (for Google Sign-In)
- A Gmail account with an App Password (for password-reset emails)

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/statusforge.git
cd statusforge
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret
JWT_REFRESH_SECRET=your_other_random_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
GOOGLE_CLIENT_ID=your_google_oauth_client_id
CLIENT_URL=http://localhost:5173
```

Run it:
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Run it:
```bash
npm run dev
```

Visit `http://localhost:5173/login`.

---

## API Reference (Implemented So Far)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Create organization + first admin user |
| POST | `/api/auth/login` | Public | Email/password login |
| POST | `/api/auth/google` | Public | Google Sign-In (verifies ID token server-side) |
| POST | `/api/auth/refresh` | Refresh cookie | Issue a new access token |
| POST | `/api/auth/logout` | Access token | Clear refresh cookie |
| GET | `/api/auth/me` | Access token | Get current logged-in user |
| POST | `/api/auth/forgot-password` | Public | Request a password reset email |
| POST | `/api/auth/reset-password/:token` | Public (token) | Reset password using emailed token |
| POST | `/api/auth/set-password` | Access token | Add a password to a Google-only account |

*(Service, Schedule, Escalation, and Incident endpoints will be added here as each module is completed.)*

---

## Security Notes

- Passwords hashed with bcrypt — never stored or logged in plain text
- Refresh tokens stored in httpOnly cookies — inaccessible to JavaScript, mitigating XSS token theft
- Access tokens held in memory only (React Context), never in localStorage
- Google ID tokens verified server-side against Google's public keys, with `audience` checked to prevent token replay from other apps
- Password-reset tokens are hashed before storage — a leaked database can't be used to reset accounts
- Generic, non-revealing error messages on login/reset flows to avoid leaking which emails are registered

---

## Project Documentation

Full project documentation (Introduction, ERD, Data Dictionary, Use Case Diagrams, Test Plan, User Manual) is maintained separately in college-submission format and updated as each module ships.

---

## Roadmap

- [ ] Service Management (CRUD + frontend)
- [ ] On-Call Scheduling (rotations)
- [ ] Escalation Policy Engine (timeout-based, queued)
- [ ] Signed webhook-based Incident Ingestion
- [ ] Real-time Incident Dashboard (Socket.IO)
- [ ] Public Status Page (no login required)
- [ ] AI-generated incident postmortems
- [ ] Docker + CI/CD + public deployment

---

## Author

Built solo as part of an MCA final-year project, designed to demonstrate production-grade backend architecture, real-time systems, and secure multi-tenant application design.
