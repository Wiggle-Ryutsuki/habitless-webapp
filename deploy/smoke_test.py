#!/usr/bin/env python3
"""
HabitLess — Post-Deployment Smoke Test
Validates public endpoints after Cloud Run deployment (Episode 5 and Episode 7).

Checks:
- GET /api/health : API service is running (200 OK)
- GET /api/ready  : Database connectivity established (200 OK, status: ready, db: connected)
- GET /           : SPA frontend served with HTML root element (200 OK)
- POST /api/auth/login : Optional smoke test login if SMOKE_EMAIL & SMOKE_PASSWORD are set
"""

import os
import sys
import json
import urllib.request
import urllib.error


def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as response:
        status_code = response.getcode()
        body = response.read().decode("utf-8")
        return status_code, body


def run_smoke_tests(base_url):
    base_url = base_url.rstrip("/")
    print(f"=== Starting Smoke Test for HabitLess at: {base_url} ===")
    failures = []

    # 1. Health check
    health_url = f"{base_url}/api/health"
    try:
        code, body = make_request(health_url)
        if code == 200 and '"status":"ok"' in body.replace(" ", ""):
            print("PASS /api/health")
        else:
            msg = f"FAIL /api/health - expected 200 with status ok, got {code}: {body[:100]}"
            print(msg)
            failures.append(msg)
    except Exception as e:
        msg = f"FAIL /api/health - exception: {e}"
        print(msg)
        failures.append(msg)

    # 2. Database readiness check
    ready_url = f"{base_url}/api/ready"
    try:
        code, body = make_request(ready_url)
        if code == 200 and '"status":"ready"' in body.replace(" ", "") and '"db":"connected"' in body.replace(" ", ""):
            print("PASS /api/ready")
        else:
            msg = f"FAIL /api/ready - expected 200 with ready and connected db, got {code}: {body[:100]}"
            print(msg)
            failures.append(msg)
    except Exception as e:
        msg = f"FAIL /api/ready - exception: {e}"
        print(msg)
        failures.append(msg)

    # 3. Frontend SPA check
    home_url = f"{base_url}/"
    try:
        code, body = make_request(home_url)
        if code == 200 and ("<div id=\"root\">" in body or "HabitLess" in body or "<!DOCTYPE html>" in body):
            print("PASS /")
        else:
            msg = f"FAIL / - expected 200 HTML page, got {code}: {body[:100]}"
            print(msg)
            failures.append(msg)
    except Exception as e:
        msg = f"FAIL / - exception: {e}"
        print(msg)
        failures.append(msg)

    # 4. Optional Login check
    smoke_email = os.environ.get("SMOKE_EMAIL")
    smoke_password = os.environ.get("SMOKE_PASSWORD")
    if smoke_email and smoke_password:
        login_url = f"{base_url}/api/auth/login"
        try:
            code, body = make_request(login_url, method="POST", data={"email": smoke_email, "password": smoke_password})
            if code == 200 and '"token"' in body:
                print(f"PASS login ({smoke_email})")
            else:
                msg = f"FAIL login - expected 200 with token, got {code}: {body[:100]}"
                print(msg)
                failures.append(msg)
        except Exception as e:
            msg = f"FAIL login - exception: {e}"
            print(msg)
            failures.append(msg)
    else:
        print("SKIP login (SMOKE_EMAIL and SMOKE_PASSWORD not set)")

    print("==========================================================================")
    if failures:
        print(f"Smoke test FAILED with {len(failures)} error(s).")
        return False
    else:
        print("All smoke test checks PASSED successfully.")
        return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 smoke_test.py <SERVICE_URL>")
        sys.exit(1)
    
    url = sys.argv[1]
    success = run_smoke_tests(url)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
