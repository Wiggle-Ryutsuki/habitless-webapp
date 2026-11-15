#!/usr/bin/env bash
# ==============================================================================
# HabitLess — Production Release Script (Episode 7: Repeatable Release by Digest)
# ==============================================================================
# Resolves the exact container image digest for the Git commit SHA, executes
# the Cloud Run database migration job, and deploys the immutable digest to Cloud Run.
#
# Supports DRY_RUN=1 mode for offline stub verification and CI testing.
# ==============================================================================

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-asia-southeast1}"
IMAGE_TAG="${IMAGE_TAG:-${1:-}}"
DRY_RUN="${DRY_RUN:-0}"

REPO_NAME="habitless"
SQL_INSTANCE="habitless-pg"
SERVICE_NAME="habitless"
MIGRATE_JOB_NAME="habitless-migrate"
SA_NAME="habitless-runner"

SECRET_DB_URL="habitless-db-url"
SECRET_JWT="habitless-jwt-secret"

echo "=== HabitLess GCP Release ==="
echo "Project ID : ${PROJECT_ID:-<not set>}"
echo "Region     : ${REGION}"
echo "Image Tag  : ${IMAGE_TAG:-<not set>}"
echo "Dry Run    : ${DRY_RUN}"
echo "============================="

if [ -z "${IMAGE_TAG}" ]; then
  echo "ERROR: IMAGE_TAG (commit SHA) is required as environment variable or first argument." >&2
  exit 1
fi

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

IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:${IMAGE_TAG}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# 1. Resolve Image Digest
echo "--> [1/3] Resolving image digest for tag ${IMAGE_TAG}..."
if [ "${DRY_RUN}" = "1" ]; then
  DIGEST="sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  echo "[DRY-RUN] Resolved digest: ${DIGEST}"
else
  DIGEST=$(gcloud artifacts docker images describe "${IMAGE_PATH}" --project="${PROJECT_ID}" --format='value(image_summary.digest)')
  if [ -z "${DIGEST}" ]; then
    echo "ERROR: Could not resolve digest for image ${IMAGE_PATH}." >&2
    exit 1
  fi
  echo "Resolved digest: ${DIGEST}"
fi

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}@${DIGEST}"

# 2. Run Database Migrations
echo "--> [2/3] Running database migration job with image digest..."
if [ "${DRY_RUN}" = "1" ]; then
  run_cmd gcloud run jobs update "${MIGRATE_JOB_NAME}" \
    --image="${IMAGE_URI}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}"
  run_cmd gcloud run jobs execute "${MIGRATE_JOB_NAME}" \
    --region="${REGION}" \
    --wait \
    --project="${PROJECT_ID}"
else
  gcloud run jobs update "${MIGRATE_JOB_NAME}" \
    --image="${IMAGE_URI}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}"
  gcloud run jobs execute "${MIGRATE_JOB_NAME}" \
    --region="${REGION}" \
    --wait \
    --project="${PROJECT_ID}"
fi

# 3. Deploy Immutable Image to Cloud Run Service
echo "--> [3/3] Updating Cloud Run service ${SERVICE_NAME} to digest ${DIGEST}..."
run_cmd gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_URI}" \
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
  --set-env-vars="NODE_ENV=production,TZ=Asia/Bangkok" \
  --project="${PROJECT_ID}"

echo "=========================================================================="
echo "Release completed successfully for image: ${IMAGE_URI}"
if [ "${DRY_RUN}" != "1" ]; then
  SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)')
  echo "Service URL: ${SERVICE_URL}"
fi
echo "=========================================================================="
