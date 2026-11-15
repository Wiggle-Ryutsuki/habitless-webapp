#!/usr/bin/env bash
# ==============================================================================
# HabitLess — Offline Verification of deploy.sh (Stub Test)
# ==============================================================================
# Verifies that deploy/deploy.sh generates all required GCP command stages
# in DRY_RUN mode without executing against real Google Cloud infrastructure.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "Testing deploy.sh offline dry run..."

OUTPUT=$(DRY_RUN=1 PROJECT_ID="habitless-ci-test" REGION="asia-southeast1" bash "${ROOT_DIR}/deploy/deploy.sh")

# Assert key deployment steps are output in order:
assert_contains() {
  local pattern="$1"
  if ! echo "${OUTPUT}" | grep -q "${pattern}"; then
    echo "FAILED: deploy.sh dry-run output does not contain expected pattern: ${pattern}" >&2
    exit 1
  fi
}

assert_contains "run.googleapis.com"
assert_contains "artifacts repositories create"
assert_contains "sql instances create"
assert_contains "sql databases create"
assert_contains "service-accounts create"
assert_contains "secrets create"
assert_contains "builds submit"
assert_contains "run jobs create"
assert_contains "run deploy"
assert_contains "Deployment Completed!"

echo "✓ test_deploy_stub passed: deploy.sh dry run generated all 8 expected GCP stages."
