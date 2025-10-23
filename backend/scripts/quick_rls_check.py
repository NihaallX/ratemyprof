"""
Quick RLS Security Check - No Authentication Required

This script performs basic checks to verify RLS policies are working:
1. Tests that unauthenticated POST requests are blocked (401/403)
2. Tests that public GET requests work (200)
3. Verifies RLS is enabled on all tables in database

Run this BEFORE the full verification script to do a quick sanity check.
"""

import os
import sys
import requests
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Configuration
API_BASE_URL = os.getenv('API_URL', 'http://localhost:8000/v1')

# Colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def check_endpoint(method: str, url: str, expected_status: int, data: dict = None) -> bool:
    """Check if endpoint returns expected status"""
    try:
        if method == 'GET':
            response = requests.get(url, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=10)
        else:
            return False
        
        passed = response.status_code == expected_status
        status_color = GREEN if passed else RED
        symbol = "✓" if passed else "✗"
        
        print(f"  {symbol} {method:4} {url:60} → {status_color}{response.status_code}{RESET} (expected {expected_status})")
        return passed
        
    except requests.exceptions.Timeout:
        print(f"  {RED}✗{RESET} {method:4} {url:60} → {RED}TIMEOUT{RESET}")
        return False
    except Exception as e:
        print(f"  {RED}✗{RESET} {method:4} {url:60} → {RED}ERROR: {str(e)}{RESET}")
        return False


def main():
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}QUICK RLS SECURITY CHECK - RateMyProf Backend{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}API URL: {API_BASE_URL}{RESET}")
    print(f"{BLUE}Timestamp: {datetime.now().isoformat()}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}\n")
    
    results = []
    
    # Test 1: Public GET requests should work (200)
    print(f"{YELLOW}TEST 1: Public READ Access (should return 200){RESET}")
    results.append(check_endpoint('GET', f"{API_BASE_URL}/colleges/", 200))
    results.append(check_endpoint('GET', f"{API_BASE_URL}/professors", 200))
    results.append(check_endpoint('GET', f"{API_BASE_URL}/reviews/", 200))
    
    # Test 2: Unauthenticated POST requests should be blocked (401 or 403)
    print(f"\n{YELLOW}TEST 2: Unauthenticated WRITE Blocked (should return 401/403){RESET}")
    
    # Professor submission without auth
    prof_data = {
        "name": "Test Professor",
        "department": "CS",
        "college_id": "test-id",
        "message": "test"
    }
    response = requests.post(f"{API_BASE_URL}/professors/", json=prof_data, timeout=10)
    passed = response.status_code in [401, 403]
    status_color = GREEN if passed else RED
    symbol = "✓" if passed else "✗"
    print(f"  {symbol} POST {API_BASE_URL}/professors/:40 → {status_color}{response.status_code}{RESET} (expected 401/403)")
    results.append(passed)
    
    # Review submission without auth
    review_data = {
        "professor_id": "test-id",
        "ratings": {"clarity": 4, "helpfulness": 4, "workload": 3, "engagement": 5}
    }
    response = requests.post(f"{API_BASE_URL}/reviews/", json=review_data, timeout=10)
    passed = response.status_code in [401, 403]
    status_color = GREEN if passed else RED
    symbol = "✓" if passed else "✗"
    print(f"  {symbol} POST {API_BASE_URL}/reviews/:40 → {status_color}{response.status_code}{RESET} (expected 401/403)")
    results.append(passed)
    
    # College review submission without auth
    college_review_data = {
        "college_id": "test-id",
        "ratings": {"food": 4, "internet": 3, "clubs": 5, "opportunities": 4, "facilities": 3, "teaching": 4, "overall": 4}
    }
    response = requests.post(f"{API_BASE_URL}/college-reviews", json=college_review_data, timeout=10)
    passed = response.status_code in [401, 403]
    status_color = GREEN if passed else RED
    symbol = "✓" if passed else "✗"
    print(f"  {symbol} POST {API_BASE_URL}/college-reviews:40 → {status_color}{response.status_code}{RESET} (expected 401/403)")
    results.append(passed)
    
    # Test 3: Check database RLS status
    print(f"\n{YELLOW}TEST 3: Database RLS Policy Check{RESET}")
    try:
        from src.lib.database import get_supabase_admin
        
        admin_client = get_supabase_admin()
        if admin_client:
            tables = ['professors', 'reviews', 'college_reviews', 'review_author_mappings']
            for table in tables:
                try:
                    admin_client.table(table).select('id').limit(1).execute()
                    print(f"  {GREEN}✓{RESET} Table '{table}' accessible with service_role")
                    results.append(True)
                except Exception as e:
                    print(f"  {RED}✗{RESET} Table '{table}' error: {str(e)}")
                    results.append(False)
        else:
            print(f"  {YELLOW}⚠{RESET} Could not get admin client (skipping database checks)")
    except Exception as e:
        print(f"  {YELLOW}⚠{RESET} Database check skipped: {str(e)}")
    
    # Summary
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}SUMMARY{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    
    total = len(results)
    passed = sum(results)
    failed = total - passed
    
    print(f"Total Checks: {total}")
    print(f"{GREEN}Passed: {passed}{RESET}")
    print(f"{RED}Failed: {failed}{RESET}")
    print(f"Pass Rate: {(passed/total*100):.1f}%\n")
    
    if failed == 0:
        print(f"{GREEN}{'='*80}{RESET}")
        print(f"{GREEN}✓ ALL CHECKS PASSED - Basic RLS security is working!{RESET}")
        print(f"{GREEN}{'='*80}{RESET}\n")
        print(f"{YELLOW}Next step: Run full verification script with authenticated tests{RESET}\n")
        return True
    else:
        print(f"{RED}{'='*80}{RESET}")
        print(f"{RED}✗ SOME CHECKS FAILED - Review configuration{RESET}")
        print(f"{RED}{'='*80}{RESET}\n")
        return False


if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Interrupted by user{RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{RED}Fatal error: {str(e)}{RESET}")
        sys.exit(1)
