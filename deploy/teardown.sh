#!/usr/bin/env bash
# ==============================================================================
# HabitLess — Teardown Script (Episode 10: Clean up GCP resources)
# ==============================================================================
# Deletes Cloud Run service, migration job, Cloud SQL instance, secrets,
# Artifact Registry repository, and runtime service account.
#
# Supports DRY_RUN=1 mode for preview.
# ==============================================================================

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-asia-southeast1}"
DRY_RUN="${DRY_RUN:-0}"

REPO_NAME="habitless"
SQL_INSTANCE="habitless-pg"
SERVICE_NAME="habitless"
MIGRATE_JOB_NAME="habitless-migrate"
SA_NAME="habitless-runner"

SECRET_DB_URL="habitless-db-url"
SECRET_JWT="habitless-jwt-secret"
SECRET_ADMIN_PASS="habitless-admin-password"
SECRET_DEMO_PASS="habitless-demo-user-password"

echo "=== HabitLess GCP Teardown ==="
echo "Project ID : ${PROJECT_ID:-<not set>}"
echo "Region     : ${REGION}"
echo "Dry Run    : ${DRY_RUN}"
echo "=============================="

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

echo "--> [1/6] Deleting Cloud Run service and migration job..."
run_cmd gcloud run services delete "${SERVICE_NAME}" --region="${REGION}" --project="${PROJECT_ID}" --quiet || true
run_cmd gcloud run jobs delete "${MIGRATE_JOB_NAME}" --region="${REGION}" --project="${PROJECT_ID}" --quiet || true

echo "--> [2/6] Deleting Cloud SQL instance..."
run_cmd gcloud sql instances delete "${SQL_INSTANCE}" --project="${PROJECT_ID}" --quiet || true

echo "--> [3/6] Deleting Secret Manager secrets..."
for s in "${SECRET_DB_URL}" "${SECRET_JWT}" "${SECRET_ADMIN_PASS}" "${SECRET_DEMO_PASS}"; do
  run_cmd gcloud secrets delete "${s}" --project="${PROJECT_ID}" --quiet || true
done

echo "--> [4/6] Deleting Artifact Registry repository..."
run_cmd gcloud artifacts repositories delete "${REPO_NAME}" --location="${REGION}" --project="${PROJECT_ID}" --quiet || true

echo "--> [5/6] Deleting Runtime Service Account..."
run_cmd gcloud iam service-accounts delete "${SA_EMAIL}" --project="${PROJECT_ID}" --quiet || true

echo "=========================================================================="
echo "Teardown Completed!"
echo "=========================================================================="
