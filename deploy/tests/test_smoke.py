#!/usr/bin/env python3
"""
Unit tests for deploy/smoke_test.py
Verifies response parsing and success/failure handling offline without hitting live network endpoints.
"""

import os
import sys
import unittest
from unittest.mock import patch

# Add deploy directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import smoke_test


class TestSmokeTestOffline(unittest.TestCase):
    @patch("smoke_test.make_request")
    def test_run_smoke_tests_all_pass(self, mock_request):
        def side_effect(url, method="GET", data=None, headers=None):
            if "/api/health" in url:
                return 200, '{"status":"ok","service":"HabitLess API"}'
            if "/api/ready" in url:
                return 200, '{"status":"ready","db":"connected"}'
            if url.endswith("/"):
                return 200, '<!DOCTYPE html><html><body><div id="root"></div></body></html>'
            return 404, "Not Found"

        mock_request.side_effect = side_effect
        result = smoke_test.run_smoke_tests("https://mock-service.run.app")
        self.assertTrue(result)

    @patch("smoke_test.make_request")
    def test_run_smoke_tests_health_fail(self, mock_request):
        def side_effect(url, method="GET", data=None, headers=None):
            if "/api/health" in url:
                return 500, '{"status":"error"}'
            if "/api/ready" in url:
                return 200, '{"status":"ready","db":"connected"}'
            if url.endswith("/"):
                return 200, '<div id="root"></div>'
            return 404, "Not Found"

        mock_request.side_effect = side_effect
        result = smoke_test.run_smoke_tests("https://mock-service.run.app")
        self.assertFalse(result)

    @patch("smoke_test.make_request")
    def test_run_smoke_tests_ready_fail(self, mock_request):
        def side_effect(url, method="GET", data=None, headers=None):
            if "/api/health" in url:
                return 200, '{"status":"ok"}'
            if "/api/ready" in url:
                return 503, '{"status":"down","db":"disconnected"}'
            if url.endswith("/"):
                return 200, '<div id="root"></div>'
            return 404, "Not Found"

        mock_request.side_effect = side_effect
        result = smoke_test.run_smoke_tests("https://mock-service.run.app")
        self.assertFalse(result)


if __name__ == "__main__":
    unittest.main()
