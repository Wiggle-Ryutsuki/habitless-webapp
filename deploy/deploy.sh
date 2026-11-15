#!/usr/bin/env bash
# ==============================================================================
# HabitLess — GCP Deployment Script (Episode 5: Initial Setup & Cloud Run Deploy)
# ==============================================================================
# Sets up Artifact Registry, Cloud SQL (PostgreSQL 16), Secret Manager, IAM,
# builds the container image via Cloud Build, runs Prisma migrations on Cloud Run,
# and deploys the unified service to Cloud Run.
#
# Supports DRY_RUN=1 mode for safe simulation and testing.
# Ref: https://cloud.google.com/run/docs/deploying
# ==============================================================================

set -euo pipefail

# --- Configuration & Resource Names -------------------------------------------
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-asia-southeast1}"
DRY_RUN="${DRY_RUN:-0}"

REPO_NAME="habitless"
SQL_INSTANCE="habitless-pg"
DB_NAME="habitless_prod"
DB_USER="habitless_user"
SERVICE_NAME="habitless"
MIGRATE_JOB_NAME="habitless-migrate"
SA_NAME="habitless-runner"

SECRET_DB_URL="habitless-db-url"
SECRET_JWT="habitless-jwt-secret"
SECRET_ADMIN_PASS="habitless-admin-password"
SECRET_DEMO_PASS="habitless-demo-user-password"

echo "=== HabitLess GCP Deployment ==="
echo "Project ID : ${PROJECT_ID:-<not set>}"
echo "Region     : ${REGION}"
echo "Dry Run    : ${DRY_RUN}"
echo "================================"

if [ -z "${PROJECT_ID}" ] && [ "${DRY_RUN}" != "1" ]; then
  echo "ERROR: PROJECT_ID environment variable is required." >&2
  exit 1
fi

run_cmd() {
  if [ "${DRY_RUN}" = "1" ]; then
    echo "[DRY-RUN] $*"
  else
    echo "+ $*"
    "$@"
  fi
}

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"

# ------------------------------------------------------------------------------
# Step 1: Enable Google Cloud APIs
# ------------------------------------------------------------------------------
echo "--> [1/8] Enabling Google Cloud APIs..."
run_cmd gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  --project="${PROJECT_ID}"

# ------------------------------------------------------------------------------
# Step 2: Create Artifact Registry Repository
# ------------------------------------------------------------------------------
echo "--> [2/8] Creating Artifact Registry repository..."
if [ "${DRY_RUN}" = "1" ]; then
  run_cmd gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="HabitLess container images" \
    --project="${PROJECT_ID}"
else
  if ! gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    run_cmd gcloud artifacts repositories create "${REPO_NAME}" \
      --repository-format=docker \
      --location="${REGION}" \
      --description="HabitLess container images" \
      --project="${PROJECT_ID}"
  else
    echo "Artifact Registry repository ${REPO_NAME} already exists. Skipping."
  fi
fi

# ------------------------------------------------------------------------------
# Step 3: Create Cloud SQL (PostgreSQL 16) Instance and Database
# ------------------------------------------------------------------------------
echo "--> [3/8] Creating Cloud SQL PostgreSQL instance and database..."
if [ "${DRY_RUN}" = "1" ]; then
  run_cmd gcloud sql instances create "${SQL_INSTANCE}" \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --edition=enterprise \
    --region="${REGION}" \
    --storage-size=10GB \
    --no-storage-auto-increase \
    --project="${PROJECT_ID}"
  run_cmd gcloud sql databases create "${DB_NAME}" \
    --instance="${SQL_INSTANCE}" \
    --project="${PROJECT_ID}"
else
  if ! gcloud sql instances describe "${SQL_INSTANCE}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    run_cmd gcloud sql instances create "${SQL_INSTANCE}" \
      --database-version=POSTGRES_16 \
      --tier=db-f1-micro \
      --edition=enterprise \
      --region="${REGION}" \
      --storage-size=10GB \
      --no-storage-auto-increase \
      --project="${PROJECT_ID}"
  else
    echo "Cloud SQL instance ${SQL_INSTANCE} already exists. Skipping."
  fi

  if ! gcloud sql databases describe "${DB_NAME}" --instance="${SQL_INSTANCE}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    run_cmd gcloud sql databases create "${DB_NAME}" \
      --instance="${SQL_INSTANCE}" \
      --project="${PROJECT_ID}"
  else
    echo "Database ${DB_NAME} already exists. Skipping."
  fi
fi

# ------------------------------------------------------------------------------
# Step 4: Create Runtime Service Account & IAM Roles
# ------------------------------------------------------------------------------
echo "--> [4/8] Configuring runtime service account..."
if [ "${DRY_RUN}" = "1" ]; then
  run_cmd gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="HabitLess Cloud Run Runtime Service Account" \
    --project="${PROJECT_ID}"
  run_cmd gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/cloudsql.client"
else
  if ! gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    run_cmd gcloud iam service-accounts create "${SA_NAME}" \
      --display-name="HabitLess Cloud Run Runtime Service Account" \
      --project="${PROJECT_ID}"
  else
    echo "Service account ${SA_NAME} already exists. Skipping."
  fi

  run_cmd gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/cloudsql.client" \
    --condition=None
fi

# ------------------------------------------------------------------------------
# Step 5: Configure Database User & Secret Manager
# ------------------------------------------------------------------------------
echo "--> [5/8] Configuring database user and secrets in Secret Manager..."
if [ "${DRY_RUN}" = "1" ]; then
  run_cmd gcloud sql users create "${DB_USER}" \
    --instance="${SQL_INSTANCE}" \
    --password="[GENERATED_PASSWORD]" \
    --project="${PROJECT_ID}"
  run_cmd gcloud secrets create "${SECRET_DB_URL}" --replication-policy="automatic" --project="${PROJECT_ID}"
  run_cmd gcloud secrets create "${SECRET_JWT}" --replication-policy="automatic" --project="${PROJECT_ID}"
  run_cmd gcloud secrets create "${SECRET_ADMIN_PASS}" --replication-policy="automatic" --project="${PROJECT_ID}"
  run_cmd gcloud secrets create "${SECRET_DEMO_PASS}" --replication-policy="automatic" --project="${PROJECT_ID}"
  run_cmd gcloud secrets add-iam-policy-binding "${SECRET_DB_URL}" --member="serviceAccount:${SA_EMAIL}" --role="roles/secretmanager.secretAccessor" --project="${PROJECT_ID}"
else
  DB_PASSWORD=$(openssl rand -hex 16)
  JWT_SECRET=$(openssl rand -hex 32 | tr -d '\n')
  ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '\n')
  DEMO_PASSWORD=$(openssl rand -base64 16 | tr -d '\n')

  if ! gcloud sql users describe "${DB_USER}" --instance="${SQL_INSTANCE}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    run_cmd gcloud sql users create "${DB_USER}" \
      --instance="${SQL_INSTANCE}" \
      --password="${DB_PASSWORD}" \
      --project="${PROJECT_ID}"
  else
    run_cmd gcloud sql users set-password "${DB_USER}" \
      --instance="${SQL_INSTANCE}" \
      --password="${DB_PASSWORD}" \
      --project="${PROJECT_ID}"
  fi

  DB_URL_VALUE="postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${SQL_INSTANCE}&schema=public"

  create_or_update_secret() {
    local sec_name="$1"
    local sec_val="$2"
    if ! gcloud secrets describe "${sec_name}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
      run_cmd gcloud secrets create "${sec_name}" --replication-policy="automatic" --project="${PROJECT_ID}"
    fi
    echo -n "${sec_val}" | gcloud secrets versions add "${sec_name}" --data-file=- --project="${PROJECT_ID}" >/dev/null
    run_cmd gcloud secrets add-iam-policy-binding "${sec_name}" \
      --member="serviceAccount:${SA_EMAIL}" \
      --role="roles/secretmanager.secretAccessor" \
      --project="${PROJECT_ID}" >/dev/null 2>&1 || true
  }

  create_or_update_secret "${SECRET_DB_URL}" "${DB_URL_VALUE}"
  create_or_update_secret "${SECRET_JWT}" "${JWT_SECRET}"
  create_or_update_secret "${SECRET_ADMIN_PASS}" "${ADMIN_PASSWORD}"
  create_or_update_secret "${SECRET_DEMO_PASS}" "${DEMO_PASSWORD}"
fi

# ------------------------------------------------------------------------------
# Step 6: Build Container Image via Cloud Build
# ------------------------------------------------------------------------------
echo "--> [6/8] Building container image via Cloud Build..."
run_cmd gcloud builds submit \
  --tag="${IMAGE_TAG}" \
  --project="${PROJECT_ID}"

# ------------------------------------------------------------------------------
# Step 7: Create & Execute Database Migration Job on Cloud Run
# ------------------------------------------------------------------------------
echo "--> [7/8] Creating and running Prisma migration job..."
if [ "${DRY_RUN}" = "1" ]; then
  run_cmd gcloud run jobs create "${MIGRATE_JOB_NAME}" \
    --image="${IMAGE_TAG}" \
    --region="${REGION}" \
    --service-account="${SA_EMAIL}" \
    --set-cloudsql-instances="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}" \
    --set-secrets="DATABASE_URL=${SECRET_DB_URL}:latest,ADMIN_PASSWORD=${SECRET_ADMIN_PASS}:latest,DEMO_USER_PASSWORD=${SECRET_DEMO_PASS}:latest" \
    --set-env-vars="NODE_ENV=production,SEED_DEMO_DATA=true" \
    --command="sh" \
    --args="-c,npx prisma migrate deploy && npm run db:seed" \
    --project="${PROJECT_ID}"
  run_cmd gcloud run jobs execute "${MIGRATE_JOB_NAME}" --region="${REGION}" --wait --project="${PROJECT_ID}"
else
  if ! gcloud run jobs describe "${MIGRATE_JOB_NAME}" --region="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    run_cmd gcloud run jobs create "${MIGRATE_JOB_NAME}" \
      --image="${IMAGE_TAG}" \
      --region="${REGION}" \
      --service-account="${SA_EMAIL}" \
      --set-cloudsql-instances="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}" \
      --set-secrets="DATABASE_URL=${SECRET_DB_URL}:latest,ADMIN_PASSWORD=${SECRET_ADMIN_PASS}:latest,DEMO_USER_PASSWORD=${SECRET_DEMO_PASS}:latest" \
      --set-env-vars="NODE_ENV=production,SEED_DEMO_DATA=true" \
      --command="sh" \
      --args="-c,npx prisma migrate deploy && npm run db:seed" \
      --project="${PROJECT_ID}"
  else
    run_cmd gcloud run jobs update "${MIGRATE_JOB_NAME}" \
      --image="${IMAGE_TAG}" \
      --region="${REGION}" \
      --project="${PROJECT_ID}"
  fi

  run_cmd gcloud run jobs execute "${MIGRATE_JOB_NAME}" --region="${REGION}" --wait --project="${PROJECT_ID}"
fi

# ------------------------------------------------------------------------------
# Step 8: Deploy Unified Service to Cloud Run
# ------------------------------------------------------------------------------
echo "--> [8/8] Deploying HabitLess service to Cloud Run..."
run_cmd gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_TAG}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --min-instances=0 \
  --max-instances=3 \
  --memory=512Mi \
  --service-account="${SA_EMAIL}" \
  --set-cloudsql-instances="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}" \
  --set-secrets="DATABASE_URL=${SECRET_DB_URL}:latest,JWT_SECRET=${SECRET_JWT}:latest" \
  --set-env-vars="NODE_ENV=production,TZ=Asia/Bangkok,PORT=3000" \
  --project="${PROJECT_ID}"

echo "=========================================================================="
echo "Deployment Completed!"
if [ "${DRY_RUN}" != "1" ]; then
  SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)')
  echo "Service URL : ${SERVICE_URL}"
  echo "Health Check: ${SERVICE_URL}/api/health"
  echo "DB Ready    : ${SERVICE_URL}/api/ready"
fi
echo "=========================================================================="
