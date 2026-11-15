# HabitLess — Habit and Activity Tracking System

[![CI & Docker Build](https://github.com/Wiggle-Ryutsuki/habitless-webapp/actions/workflows/ci-docker.yml/badge.svg)](https://github.com/Wiggle-Ryutsuki/habitless-webapp/actions/workflows/ci-docker.yml)
[![Deploy demo](https://github.com/Wiggle-Ryutsuki/habitless-webapp/actions/workflows/deploy.yml/badge.svg)](https://github.com/Wiggle-Ryutsuki/habitless-webapp/actions/workflows/deploy.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Google Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-Deployed-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/run)

HabitLess is a modern, full-stack wellness and habit tracking platform designed for both individual participants and wellness program directors. 

Developed as part of **CPE 334 Software Engineering in the Age of AI Agents (Lab 5)**, HabitLess demonstrates an end-to-end cloud-native architecture incorporating containerization, strict quality gates, keyless Workload Identity Federation, automated deployment pipelines, and persistent data surviving deployments and rollbacks.

---

## 🌟 Core Features (Sprint 1)

* **F1: Role-Based Access Control & Authentication**:
  * Dual-role architecture: **Participant** (`PARTICIPANT`) and **Program Manager** (`PROGRAM_MANAGER`).
  * JWT-based session management with secure cookie/header authentication and bcrypt password hashing.
  * Role-specific dashboard routing and view-only permissions for inactive accounts.
* **F2: Habit Creation & Today Checklist**:
  * Custom frequency options: Daily, Weekdays, 3-Times Weekly, Weekly, Monthly, or Custom Days.
  * One-tap completion checklist for today with instant progress calculation.
  * Visual feedback with custom color-coded badges and completion streaks.
* **F3: Interactive Calendar Matrix & Habit Goals**:
  * Month-view completion grid mapping daily progress against target habit goals.
  * Daily reflection notes linked directly to calendar days.
* **F4: Challenge Programs & Group Enrollments**:
  * Program Managers can draft, publish, and manage structured wellness programs.
  * Participants can browse and enroll in programs, with automatic progress synchronization.

---

## 🏗️ Architecture & Cloud Stack

HabitLess follows the reference cloud architecture recommended for CPE 334:

```
                            +-----------------------------------+
                            |   GitHub Actions (CI/CD)          |
                            |   - test-and-docker (Gate)        |
                            |   - Deploy demo (WIF OIDC)        |
                            +-----------------+-----------------+
                                              | Keyless Auth (WIF)
                                              v
+-----------------------+   Deploy Digest   +--------------------+
| Google Artifact Reg.  | +---------------> |  Google Cloud Run  | <---+ Users
| (habitless repository)|                   |  (Port 3000 / SPA) |     (HTTPS)
+-----------------------+                   +---------+----------+
                                                      |
                         +----------------------------+
                         | Unix Socket Proxy (/cloudsql/...)
                         v
              +----------------------+      +----------------------+
              | Google Cloud SQL     |      | GCP Secret Manager   |
              | (PostgreSQL 16)      | <--- | (DB URL, Passwords,  |
              | habitless_prod       |      |  JWT Secret)         |
              +----------------------+      +----------------------+
```

| Component | Technology | Cloud Provider / Service |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite, TypeScript, React Router | Built into unified production container |
| **Backend API** | Node.js 20+, Express 4, TypeScript | Google Cloud Run (`asia-southeast1`) |
| **Database ORM** | Prisma ORM 5.22 | PostgreSQL 16 on Google Cloud SQL (`habitless-pg`) |
| **Containerization** | Multi-stage Dockerfile (Alpine Linux) | Google Artifact Registry (`habitless`) |
| **Secret Management**| Environment variables | Google Secret Manager (`habitless-*`) |
| **Identity Federation**| OpenID Connect (OIDC) | Google Workload Identity Federation (WIF) |
| **CI / Quality Gate**| GitHub Actions | Automated checks on Pull Requests |

---

## 📁 Repository Structure

```text
habitless-webapp/
├── .github/
│   └── workflows/
│       ├── ci-docker.yml       # PR quality gate (test-and-docker)
│       └── deploy.yml          # Automated Cloud Run release & rollback
├── client/                     # React 18 frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/         # UI components (TodayChecklist, Calendar, etc.)
│   │   ├── pages/              # App pages (Dashboard, Habits, Login, etc.)
│   │   └── types/              # Client-side data models
│   ├── Dockerfile              # Development frontend Dockerfile
│   └── package.json
├── server/                     # Node.js backend (Express + Prisma)
│   ├── src/
│   │   ├── routes/             # REST endpoints (/api/habits, /api/auth, etc.)
│   │   ├── middleware/         # Auth, validation, error handlers
│   │   └── index.ts            # Server entrypoint
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL schema & relation models
│   │   ├── seed.ts             # Initial manager and demo accounts
│   │   └── migrations/         # Tracked schema migrations
│   ├── Dockerfile              # Development backend Dockerfile
│   └── package.json
├── deploy/                     # Cloud automation & testing scripts
│   ├── deploy.sh               # Cloud Shell initial GCP setup & deploy
│   ├── release.sh              # Digest-based rollout & migration runner
│   ├── smoke_test.py           # Post-deployment live endpoint smoke tester
│   ├── teardown.sh             # Cloud resource cleanup utility
│   └── tests/                  # Offline dry-run verification tests
├── Dockerfile                  # Production unified multi-stage Dockerfile
├── docker-compose.yml          # Local full-stack development environment
└── package.json                # Workspace orchestration scripts
```

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Docker & Docker Compose**: v24 or higher

### 2. Installation
Clone the repository and install all workspace dependencies:
```bash
git clone https://github.com/Wiggle-Ryutsuki/habitless-webapp.git
cd habitless-webapp

# Install root, backend, and frontend packages
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Start Local Database with Docker Compose
```bash
# Start local PostgreSQL 16 container
docker compose up -d db

# Run database migrations and seed demo data
npm --prefix server run prisma:generate
npm --prefix server run prisma:deploy
npm --prefix server run db:seed
```

### 4. Run Development Servers
```bash
# Run server (port 3000) and client (Vite on port 5173) concurrently:
npm run dev:server
npm run dev:client
```

---

## 🧪 Testing & Quality Gates

HabitLess enforces comprehensive testing at every stage of development:

### 1. Run Unit & Component Tests
```bash
# Run all server and client tests
npm test

# Run server unit & API tests only (Vitest + Supertest)
npm run test:server

# Run client component tests only (Vitest + React Testing Library)
npm run test:client
```

### 2. Run End-to-End Tests (Playwright)
```bash
npx playwright test
```

### 3. Verify Deployment Scripts Offline
```bash
bash deploy/tests/test_deploy_stub.sh
bash deploy/tests/test_release_stub.sh
python3 deploy/tests/test_smoke.py
```

---

## 🚀 CI/CD & Deployment Workflow

### 1. Pull Request Merge Gate (`ci-docker.yml`)
- Every Pull Request into `staging-1` or `main` automatically runs the `test-and-docker` check.
- Enforced by GitHub Ruleset **`protect-main`**:
  - Direct pushes to `main` are blocked.
  - Deletions and force pushes are disabled.
  - Merging is strictly blocked if `test-and-docker` fails or branches are out of date.

### 2. Automated Continuous Deployment (`deploy.yml`)
Merging into `main` automatically triggers the **Deploy demo** pipeline:
1. **Quality Check**: Reuses `ci-docker.yml` to verify all tests pass.
2. **Keyless Authentication**: Signs in to Google Cloud using Workload Identity Federation (no service account JSON keys).
3. **Build & Versioning**: Builds the unified Dockerfile and tags the image with the full Git commit SHA (`${{ github.sha }}`).
4. **Database Migration**: Executes Cloud Run Job `habitless-migrate` (`npx prisma migrate deploy && npm run db:seed`).
5. **Zero-Downtime Rollout**: Deploys the new revision to Cloud Run using the immutable image digest (`@sha256:...`).
6. **Live Smoke Testing**: Runs `deploy/smoke_test.py` against `/api/health`, `/api/ready`, `/`, and optional authentication endpoints.
7. **Release Summary**: Publishes commit tag, image digest, and service URL to GitHub Job Summary.

### 3. Instant Rollback Capability
If an issue occurs in production:
1. Navigate to **Actions** $\rightarrow$ **Deploy demo** $\rightarrow$ **Run workflow**.
2. Select branch `main` and enter the 40-character commit SHA of a previous good release into `image_tag`.
3. The pipeline skips the build and tests, immediately pointing Cloud Run traffic (100%) back to the verified image digest.

---

## 🔒 Security & Environment Variables

In compliance with requirement **`R-02`**, zero secrets, passwords, or database connection strings are committed to this repository.

| Variable Name | Purpose | Production Source |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | GCP Secret Manager (`habitless-db-url`) |
| `JWT_SECRET` | Signing key for auth session tokens | GCP Secret Manager (`habitless-jwt-secret`) |
| `ADMIN_PASSWORD` | Initial password for seeded Program Director | GCP Secret Manager (`habitless-admin-password`) |
| `DEMO_USER_PASSWORD` | Initial password for seeded Participant demo users | GCP Secret Manager (`habitless-demo-user-password`) |
| `PORT` | Container listening port (3000) | Managed by Cloud Run runtime |
| `NODE_ENV` | Application environment (`production`) | Cloud Run environment variable |
| `TZ` | Container timezone (`Asia/Bangkok`) | Cloud Run environment variable |

---

## 👥 Demo Accounts (Seeded)

| Account Role | Email Address | Access Level |
| :--- | :--- | :--- |
| **Program Manager** | `manager@habitless.internal` | Create/edit programs, view all participants |
| **Participant 1** | `participant1@habitless.internal` | Manage personal habits, checklists, daily notes |
| **Participant 2** | `participant2@habitless.internal` | Manage personal habits, checklists, daily notes |

*(Production passwords are generated dynamically at deploy time and retrieved via Secret Manager)*:
```bash
gcloud secrets versions access latest --secret=habitless-admin-password
```

---

## 📄 License
Educational project for **CPE 334 Software Engineering in the Age of AI Agents**. All rights reserved.
