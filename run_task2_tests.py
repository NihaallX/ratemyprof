#!/usr/bin/env python3
"""
Test runner script for Task 2 deliverables
Runs unit tests with coverage reporting
"""

import sys
import subprocess

def run_tests():
    """Run pytest with coverage for event bus and notification worker."""
    print("=" * 70)
    print("Running Task 2 Unit Tests: Event Bus & Notification Worker")
    print("=" * 70)
    print()
    
    # Run tests with coverage
    cmd = [
        "pytest",
        "tests/test_events.py",
        "tests/test_notifications_worker.py",
        "-v",
        "--cov=src.lib.events",
        "--cov=src.tasks.notifications_worker",
        "--cov-report=term-missing",
        "--cov-report=html",
        "--cov-fail-under=80"  # Require 80% coverage
    ]
    
    try:
        result = subprocess.run(cmd, cwd="backend", check=True)
        print()
        print("✅ All tests passed with >80% coverage!")
        print("📊 HTML coverage report: backend/htmlcov/index.html")
        return 0
    except subprocess.CalledProcessError as e:
        print()
        print("❌ Tests failed or coverage below 80%")
        return e.returncode
    except FileNotFoundError:
        print()
        print("❌ pytest not found. Install dependencies first:")
        print("   cd backend && pip install -r requirements.txt")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
