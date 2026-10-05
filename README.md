# Oradent

**Open-source dental practice management — appointments, patient records, dental chart, billing, imaging.**

**Live:** <https://mukundakatta.github.io/Oradent/>

```
oradent/
├─ packages/
│  ├─ server/    # Express + Prisma + Postgres + Redis + WebSocket
│  └─ web/       # Next.js + Tailwind + React Query
└─ docker-compose.yml   # one-command postgres + redis for local dev
```

Oradent is the back-office software a small dental practice actually
needs — built as a TypeScript monorepo you can self-host, audit, or
fork. No vendor lock-in, no per-seat tax, no surprise PHI sharing.

## What's in the box

| Module | What it does |
|--------|--------------|
| **Patients** | Demographics, medical history, allergies, insurance, consent forms |
| **Appointments** | Multi-chair scheduling, recall reminders, no-show tracking |
| **Dental chart** | Per-tooth status, treatment history, periodontal measurements |
| **Treatments** | CDT-coded procedures, treatment plans, signed consents |
| **Billing** | Per-procedure fees, insurance claims, patient ledger, payments |
| **Imaging** | Bitewing / pano / 3D scan storage with per-image annotations |
| **Reports** | End-of-day production, accounts receivable, recall lists |
| **AI** | Optional summarisation of appointment notes, plan suggestions |
| **Settings** | Provider roster, fee schedules, insurance carriers, holidays |

## Tech

- **Server:** Node.js + TypeScript, Express, Prisma ORM (Postgres),
  Redis (sessions + queue), Socket.io (live chair status), Zod
  validation everywhere.
- **Web:** Next.js 14 App Router, Tailwind, React Query, lucide-react.
- **Infra:** Docker Compose for local dev; Dockerfiles for each
  package; GitHub Actions for CI.

## Get started

```bash
# 1. Spin up Postgres + Redis
npm run docker:up

# 2. Run migrations and seed data
npm run db:migrate
npm run db:seed

# 3. Start both apps
npm run dev
# → server: http://localhost:4000
# → web:    http://localhost:3000
```

The seed script creates a sample practice with two providers, ten
patients, a week of appointments, and one finished treatment plan, so
the UI is non-empty on first boot.

## Repo layout

```
packages/
├── server/
│   └── src/
│       ├── routes/         # one file per resource (patients, appointments, …)
│       ├── services/       # business logic (no Express coupling)
│       ├── jobs/           # cron + queue workers
│       ├── middleware/     # auth, audit, error normalisation
│       ├── websocket/      # real-time chair / hygienist status
│       └── config/         # env + Prisma + Redis bootstraps
└── web/
    └── src/                # Next.js App Router pages + components
```

## Operational notes

- **HIPAA posture.** Oradent ships transport encryption + audit logs +
  per-user RBAC. Backups, BAAs, and physical security are *your*
  responsibility — Oradent is the software, not the compliance.
- **Single-tenant by design.** Run one instance per practice. The
  multi-tenant story is a roadmap item; see below.
- **Postgres + Redis only.** No SaaS dependencies. You can host on a
  laptop, a $5 VPS, or your hospital's existing Kubernetes.

## Roadmap

- **e-Prescribing integration** (Surescripts via a partner API).
- **Patient portal** for online forms, payments, and recall RSVPs.
- **Multi-location org model** — currently a clean refactor, not a new
  product.
- **Audit-log explorer UI** — server already records, web doesn't yet
  surface.

## License

MIT.
