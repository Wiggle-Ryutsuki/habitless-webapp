#!/usr/bin/env bash
# ==============================================================================
# HabitLess — Offline Verification of release.sh (Stub Test)
# ==============================================================================
# Verifies that deploy/release.sh properly resolves digest, updates migration job,
# and issues Cloud Run deploy commands in DRY_RUN mode.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "Testing release.sh offline dry run..."

OUTPUT=$(DRY_RUN=1 PROJECT_ID="habitless-ci-test" REGION="asia-southeast1" IMAGE_TAG="abc123def456" bash "${ROOT_DIR}/deploy/release.sh")

assert_contains() {
  local pattern="$1"
  if ! echo "${OUTPUT}" | grep -q "${pattern}"; then
    echo "FAILED: release.sh dry-run output does not contain expected pattern: ${pattern}" >&2
    exit 1
  fi
}

assert_contains "Resolving image digest for tag abc123def456"
assert_contains "run jobs update habitless-migrate"
assert_contains "run jobs execute habitless-migrate"
assert_contains "run deploy habitless"
assert_contains "Release completed successfully"

echo "✓ test_release_stub passed: release.sh dry run executed correctly."
