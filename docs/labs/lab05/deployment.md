# HabitLess Deployment & Cloud-Readiness Guide

**Document ID**: DEP-HL-01  
**Version**: 1.0 (Episode 2 Cloud-Ready Baseline)  
**Parent Course**: CPE 334 Software Engineering in the Age of AI Agents (Lab 5)  
**Project**: HabitLess — Habit and Activity Tracking System  
**Reference Document**: `SE_Lab_5_updated.pdf` (Sections 4.1, 4.3, 7, 8) & `Student-Guide-GCP-Deployment-and+CI+CD-V1_1.pdf`  

---

## 1. Application Stack & Architecture

HabitLess follows the reference cloud architecture recommended for CPE 334 Lab 5:

* **Backend Service**: Node.js 20+ runtime with Express 4, TypeScript, and Prisma ORM 5.22.
* **Frontend Web Application**: React 18 Single-Page Application (SPA) built with Vite and React Router.
* **Database & Persistence**: PostgreSQL 16 (local development via Docker; production on Google Cloud SQL for PostgreSQL).
* **Container Runtime**: Containerized with Docker; hosted serverlessly on **Google Cloud Run** with automatic HTTPS and scale-to-zero when idle.
* **Image Management**: Container images versioned by full Git commit SHA and stored in **Google Artifact Registry**.
* **Secret Management**: Runtime secrets (database credentials, JWT signing key, admin seed password) managed securely via **GCP Secret Manager**.
* **Continuous Integration & Delivery (CI/CD)**: **GitHub Actions** using **Workload Identity Federation (WIF)** for keyless authentication with Google Cloud.

### Architecture Comparison to Course Reference Stack
| Component | Reference Stack (TokTickIT) | HabitLess Implementation | Deviation Rationale |
| :--- | :--- | :--- | :--- |
| **API Framework** | Express + TypeScript | Express 4 + TypeScript | None (Identical) |
| **Database ORM** | Prisma + PostgreSQL | Prisma 5.22 + PostgreSQL 16 | None (Identical) |
| **Web UI** | React + Vite | React 18 + Vite | None (Identical) |
| **Persistence Model** | Cloud SQL (PostgreSQL) | Cloud SQL (PostgreSQL 16) | None (Identical) |
| **Hosting Platform** | Cloud Run | Cloud Run (asia-southeast1) | None (Identical) |
| **CI/CD Automation** | GitHub Actions + WIF | GitHub Actions + WIF | None (Identical) |

---

## 2. Environment Variables Inventory

In accordance with requirement **`R-02`**, all application configuration is injected dynamically from the environment. No secrets, credentials, or connection strings are committed to the Git repository.

| Variable Name | Purpose & Description | Secret? | Local Source | Production Source (GCP) | Example / Placeholder Value |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `PORT` | Listening TCP port for Express API | No | `.env` (default 3000) | Injected by Cloud Run (default 8080) | `3000` |
| `NODE_ENV` | Runtime mode (`development`, `test`, `production`) | No | `.env` | Cloud Run environment variable | `production` |
| `DATABASE_URL` | PostgreSQL connection string including user, password, host, port, db name | **Yes** | `server/.env` (local Docker) | Sourced from GCP Secret Manager (`habitless-db-url`) | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Cryptographic secret for signing and validating session tokens | **Yes** | `server/.env` | Sourced from GCP Secret Manager (`habitless-jwt-secret`) | `change-me-to-a-secure-random-secret` |
| `ADMIN_PASSWORD` | Initial password for the seeded Program Manager account | **Yes** | `server/.env` | Sourced from GCP Secret Manager (`habitless-admin-password`) | `change-me-admin-password` |
| `SEED_DEMO_DATA` | Toggle for seeding demo accounts and sample habits | No | `.env` (default `true`) | Cloud Run migration job env | `true` or `false` |
| `DEMO_USER_PASSWORD`| Initial password for seeded participant demo accounts | **Yes** | `server/.env` | Sourced from GCP Secret Manager (`habitless-demo-user-password`) | `change-me-demo-password` |
| `CLIENT_URL` | Allowed origin for CORS headers | No | `.env` | Cloud Run environment variable | `https://habitless-<hash>-as.a.run.app` |

---

## 3. Operational & Lifecycle Commands

### 3.1. Prerequisites & Installation
```bash
# Clone the repository
git clone <repository-url>
cd habitless-webapp

# Install dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 3.2. Local Database & Development Environment
```bash
# Start local PostgreSQL 16 container via Docker Compose
docker compose up -d db

# Verify database container health
docker compose ps

# Generate Prisma Client
npm --prefix server run prisma:generate

# Deploy migrations to local database
npm --prefix server run prisma:deploy

# Seed initial admin and demo data
npm --prefix server run db:seed
```

### 3.3. Testing & Quality Gates
```bash
# Run all unit, component, and API tests
npm test

# Run client tests in isolation (React Testing Library + Vitest)
npm run test:client

# Run server unit & API tests (requires running PostgreSQL)
npm run test:server
```

### 3.4. Building & Running Locally
```bash
# Run server in dev mode (tsx watch on 0.0.0.0:3000)
npm run dev:server

# Run client dev server (Vite on localhost:5173)
npm run dev:client

# Production build
npm run build:client
```

---

## 4. Google Cloud Platform (GCP) Resource Architecture

The following resource names and conventions are defined for Google Cloud deployment (Episodes 5–8):

| Resource Type | Resource Name | Region / Zone | Purpose & Notes |
| :--- | :--- | :--- | :--- |
| **GCP Project** | `cpe334-sec31-habitless` *(or team ID)* | `global` | Shared course project under GCP Free Trial |
| **Region** | `asia-southeast1` | Singapore | Low-latency region for Thailand |
| **Artifact Registry**| `habitless` | `asia-southeast1` | Docker container image repository |
| **Cloud SQL Instance**| `habitless-pg` | `asia-southeast1` | PostgreSQL 16 Enterprise (`db-f1-micro`, storage auto-increase disabled) |
| **Cloud SQL Database**| `habitless_prod` | `asia-southeast1` | Application database |
| **Cloud Run Service** | `habitless` | `asia-southeast1` | Web service container (min instances: 0, max instances: 3) |
| **Cloud Run Job** | `habitless-migrate` | `asia-southeast1` | One-shot migration job executed prior to service deployment |
| **Service Account (App)**| `habitless-runner` | `global` | Runtime account with `Cloud SQL Client` & Secret Manager access |
| **Service Account (CI)** | `habitless-deployer` | `global` | CI deployment account used by GitHub Actions via WIF |
| **Workload Identity Pool**| `github-actions-pool` | `global` | OIDC federation pool for GitHub repository |
| **Workload Provider** | `github-actions-provider`| `global` | OpenID Connect provider for `token.actions.githubusercontent.com` |

### Secrets Managed in GCP Secret Manager:
1. `habitless-db-url`: Full PostgreSQL connection string (`postgresql://habitless_user:<pass>@/habitless_prod?host=/cloudsql/<project>:<region>:habitless-pg`)
2. `habitless-jwt-secret`: 32+ character cryptographically random string
3. `habitless-admin-password`: Program Manager account password for UAT
4. `habitless-demo-user-password`: Demo participant password for UAT

---

## 5. Release & Rollback Procedure (`R-07`, `R-08`)

### 5.1. Standard Release Pipeline
1. **Feature Development**:
   * Create an Issue on GitHub project board.
   * Create a feature branch off `staging` (e.g., `feature/<issue>-<description>`).
   * Implement changes and ensure local tests pass (`npm test`).
2. **Pull Request into `staging`**:
   * Open Pull Request into `staging`.
   * Automated CI (`ci-docker.yml`) runs builds and test checks.
   * Teammate completes code review and approves PR (self-approval forbidden per `R-09`).
   * Merge PR into `staging`.
3. **Release Pull Request into `main`**:
   * Open Release PR from `staging` into `main`.
   * Passing CI checks are required to merge (`R-06`).
   * Teammate approves and merges into `main`.
4. **Automated Continuous Deployment**:
   * Merging into `main` triggers GitHub Actions deployment workflow (`deploy.yml`).
   * Workflow builds container image tagged with the full Git commit SHA (`${{ github.sha }}`) and pushes to Artifact Registry.
   * Cloud Run migration job runs `npx prisma migrate deploy`.
   * Cloud Run service is updated to the newly built image digest.
   * Automated post-deployment smoke test executes against the public URL.

### 5.2. How to Identify the Running Release Commit (`R-08`)
* **Cloud Run Console**: The active revision description and image URL explicitly display the full Git commit SHA as the image tag (`asia-southeast1-docker.pkg.dev/<project>/habitless/habitless:<commit-sha>`).
* **Cloud Health Endpoint**: `GET /api/health` returns the deployment status and metadata.
* **GitHub Actions Run**: The workflow run on `main` links directly to the deployed Git commit SHA.

### 5.3. Rollback Procedure
If a bad release reaches production:
1. Identify the full Git commit SHA of the previous known good release.
2. Navigate to **Actions** $\rightarrow$ **Deploy to Cloud Run** in GitHub.
3. Click **Run workflow**, select branch `main`, and enter the target commit SHA in the `image_tag` parameter.
4. The pipeline skips rebuild and immediately switches Cloud Run traffic (100%) to the verified image digest.
5. Additive migrations guarantee that the previous container version continues to operate seamlessly with the database schema.
