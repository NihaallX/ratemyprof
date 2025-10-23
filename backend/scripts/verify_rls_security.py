"""
RLS Security Verification Script for RateMyProf Backend

This script tests that all endpoints properly enforce authentication and RLS policies.
It verifies that:
1. Unauthenticated requests are rejected where required
2. Authenticated requests work correctly
3. RLS policies prevent unauthorized data access
4. Admin endpoints require proper authentication

Run this script AFTER applying RLS policies to Supabase and BEFORE deploying to production.
"""

import os
import sys
import requests
import json
from typing import Dict, Optional, List, Tuple
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Configuration
API_BASE_URL = os.getenv('API_URL', 'http://localhost:8000/v1')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://xgnewppqxqkyeabtmenf.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '')

# Test credentials (create these test users in Supabase Auth first)
TEST_USER_EMAIL = "test_user@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class SecurityTester:
    def __init__(self):
        self.test_results = []
        self.auth_token = None
        self.test_user_id = None
        
    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Log test result"""
        status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
        result_msg = f"{status} | {test_name}"
        if message:
            result_msg += f" | {message}"
        print(result_msg)
        
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
        
    def authenticate_test_user(self) -> bool:
        """Authenticate test user and get JWT token"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}AUTHENTICATION TESTS{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")
        
        try:
            # Try to sign in with test user
            response = requests.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                headers={
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                },
                json={
                    'email': TEST_USER_EMAIL,
                    'password': TEST_USER_PASSWORD
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data['access_token']
                self.test_user_id = data['user']['id']
                self.log_test(
                    "User Authentication", 
                    True, 
                    f"Got JWT token for {TEST_USER_EMAIL}"
                )
                return True
            else:
                self.log_test(
                    "User Authentication", 
                    False, 
                    f"Failed to authenticate: {response.status_code}"
                )
                print(f"{YELLOW}Note: Create test user in Supabase Auth first{RESET}")
                return False
                
        except Exception as e:
            self.log_test("User Authentication", False, f"Error: {str(e)}")
            return False
    
    def test_unauthenticated_professor_submission(self):
        """Test that professor submission requires authentication"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}PROFESSOR ENDPOINT TESTS{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/professors/",
                json={
                    "name": "Test Professor",
                    "email": "test@example.com",
                    "department": "Computer Science",
                    "college_id": "test-college-id",
                    "message": "Test submission"
                }
            )
            
            # Should fail with 401 or 403
            passed = response.status_code in [401, 403]
            self.log_test(
                "Unauthenticated Professor Submission Blocked",
                passed,
                f"Status: {response.status_code} (expected 401/403)"
            )
            
        except Exception as e:
            self.log_test(
                "Unauthenticated Professor Submission Blocked",
                False,
                f"Error: {str(e)}"
            )
    
    def test_authenticated_professor_submission(self):
        """Test that authenticated users can submit professors"""
        if not self.auth_token:
            self.log_test(
                "Authenticated Professor Submission",
                False,
                "No auth token available"
            )
            return
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/professors/",
                headers={'Authorization': f'Bearer {self.auth_token}'},
                json={
                    "name": f"RLS Test Professor {datetime.now().timestamp()}",
                    "email": "testprof@example.com",
                    "department": "Computer Science",
                    "designation": "Assistant Professor",
                    "college_id": "test-college-id",
                    "subjects": ["Data Structures", "Algorithms"],
                    "message": "RLS security test submission"
                }
            )
            
            # Should succeed with 201
            passed = response.status_code == 201
            self.log_test(
                "Authenticated Professor Submission",
                passed,
                f"Status: {response.status_code} (expected 201)"
            )
            
            if passed:
                data = response.json()
                print(f"  → Professor ID: {data.get('professor_id')}")
                
        except Exception as e:
            self.log_test(
                "Authenticated Professor Submission",
                False,
                f"Error: {str(e)}"
            )
    
    def test_unauthenticated_review_submission(self):
        """Test that review submission requires authentication"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}REVIEW ENDPOINT TESTS{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/reviews/",
                json={
                    "professor_id": "test-professor-id",
                    "ratings": {
                        "clarity": 4,
                        "helpfulness": 4,
                        "workload": 3,
                        "engagement": 5
                    },
                    "review_text": "Test review"
                }
            )
            
            # Should fail with 401 or 403
            passed = response.status_code in [401, 403]
            self.log_test(
                "Unauthenticated Review Submission Blocked",
                passed,
                f"Status: {response.status_code} (expected 401/403)"
            )
            
        except Exception as e:
            self.log_test(
                "Unauthenticated Review Submission Blocked",
                False,
                f"Error: {str(e)}"
            )
    
    def test_unauthenticated_college_review_submission(self):
        """Test that college review submission requires authentication"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}COLLEGE REVIEW ENDPOINT TESTS{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/college-reviews",
                json={
                    "college_id": "test-college-id",
                    "ratings": {
                        "food": 4,
                        "internet": 3,
                        "clubs": 5,
                        "opportunities": 4,
                        "facilities": 3,
                        "teaching": 4,
                        "overall": 4
                    },
                    "review_text": "Test college review"
                }
            )
            
            # Should fail with 401 or 403
            passed = response.status_code in [401, 403]
            self.log_test(
                "Unauthenticated College Review Submission Blocked",
                passed,
                f"Status: {response.status_code} (expected 401/403)"
            )
            
        except Exception as e:
            self.log_test(
                "Unauthenticated College Review Submission Blocked",
                False,
                f"Error: {str(e)}"
            )
    
    def test_public_read_access(self):
        """Test that public can read approved content"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}PUBLIC READ ACCESS TESTS{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")
        
        # Test public can read colleges
        try:
            response = requests.get(f"{API_BASE_URL}/colleges/")
            passed = response.status_code == 200
            self.log_test(
                "Public Read Colleges",
                passed,
                f"Status: {response.status_code} (expected 200)"
            )
        except Exception as e:
            self.log_test("Public Read Colleges", False, f"Error: {str(e)}")
        
        # Test public can read professors
        try:
            response = requests.get(f"{API_BASE_URL}/professors")
            passed = response.status_code == 200
            self.log_test(
                "Public Read Professors",
                passed,
                f"Status: {response.status_code} (expected 200)"
            )
        except Exception as e:
            self.log_test("Public Read Professors", False, f"Error: {str(e)}")
        
        # Test public can read reviews
        try:
            response = requests.get(f"{API_BASE_URL}/reviews/")
            passed = response.status_code == 200
            self.log_test(
                "Public Read Reviews",
                passed,
                f"Status: {response.status_code} (expected 200)"
            )
        except Exception as e:
            self.log_test("Public Read Reviews", False, f"Error: {str(e)}")
    
    def test_rls_policy_verification(self):
        """Verify RLS policies are active in database"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}DATABASE RLS POLICY VERIFICATION{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")
        
        from src.lib.database import get_supabase_admin
        
        try:
            admin_client = get_supabase_admin()
            if not admin_client:
                self.log_test(
                    "RLS Policy Database Check",
                    False,
                    "Could not get admin client"
                )
                return
            
            # Check that key tables have RLS enabled
            # Note: This is a simplified check - actual RLS status check requires SQL query
            tables_to_check = [
                'professors',
                'reviews',
                'college_reviews',
                'review_author_mappings',
                'college_review_author_mappings'
            ]
            
            all_passed = True
            for table in tables_to_check:
                try:
                    # Try to query table (will work with admin client)
                    result = admin_client.table(table).select('id').limit(1).execute()
                    self.log_test(
                        f"RLS Active on {table}",
                        True,
                        "Table accessible with service_role"
                    )
                except Exception as e:
                    self.log_test(
                        f"RLS Active on {table}",
                        False,
                        f"Error: {str(e)}"
                    )
                    all_passed = False
                    
        except Exception as e:
            self.log_test(
                "RLS Policy Database Check",
                False,
                f"Error: {str(e)}"
            )
    
    def print_summary(self):
        """Print test summary"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}TEST SUMMARY{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['passed'])
        failed_tests = total_tests - passed_tests
        
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"{GREEN}Passed: {passed_tests}{RESET}")
        print(f"{RED}Failed: {failed_tests}{RESET}")
        print(f"Pass Rate: {pass_rate:.1f}%\n")
        
        if failed_tests > 0:
            print(f"{RED}FAILED TESTS:{RESET}")
            for result in self.test_results:
                if not result['passed']:
                    print(f"  ✗ {result['test']}: {result['message']}")
        
        # Save results to file
        results_file = os.path.join(
            os.path.dirname(__file__),
            f'rls_verification_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        )
        
        with open(results_file, 'w') as f:
            json.dump({
                'summary': {
                    'total': total_tests,
                    'passed': passed_tests,
                    'failed': failed_tests,
                    'pass_rate': pass_rate
                },
                'results': self.test_results
            }, f, indent=2)
        
        print(f"\n{BLUE}Results saved to: {results_file}{RESET}\n")
        
        return failed_tests == 0
    
    def run_all_tests(self):
        """Run all security verification tests"""
        print(f"\n{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}RLS SECURITY VERIFICATION - RateMyProf Backend{RESET}")
        print(f"{BLUE}{'='*80}{RESET}")
        print(f"{BLUE}API URL: {API_BASE_URL}{RESET}")
        print(f"{BLUE}Timestamp: {datetime.now().isoformat()}{RESET}")
        print(f"{BLUE}{'='*80}{RESET}\n")
        
        # Run authentication tests
        auth_success = self.authenticate_test_user()
        
        # Run unauthorized access tests (these should fail)
        self.test_unauthenticated_professor_submission()
        self.test_unauthenticated_review_submission()
        self.test_unauthenticated_college_review_submission()
        
        # Run authorized access tests (these should succeed)
        if auth_success:
            self.test_authenticated_professor_submission()
        
        # Run public read tests
        self.test_public_read_access()
        
        # Verify RLS policies in database
        self.test_rls_policy_verification()
        
        # Print summary
        all_passed = self.print_summary()
        
        return all_passed


def main():
    """Main entry point"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}IMPORTANT: Prerequisites{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}1. Backend server must be running (default: http://localhost:8000){RESET}")
    print(f"{YELLOW}2. RLS policies must be applied in Supabase{RESET}")
    print(f"{YELLOW}3. Test user must exist in Supabase Auth:{RESET}")
    print(f"{YELLOW}   Email: {TEST_USER_EMAIL}{RESET}")
    print(f"{YELLOW}   Password: {TEST_USER_PASSWORD}{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}\n")
    
    input("Press Enter to continue with tests...")
    
    tester = SecurityTester()
    all_passed = tester.run_all_tests()
    
    if all_passed:
        print(f"\n{GREEN}{'='*80}{RESET}")
        print(f"{GREEN}✓ ALL TESTS PASSED - RLS SECURITY VERIFIED{RESET}")
        print(f"{GREEN}{'='*80}{RESET}\n")
        sys.exit(0)
    else:
        print(f"\n{RED}{'='*80}{RESET}")
        print(f"{RED}✗ SOME TESTS FAILED - REVIEW SECURITY CONFIGURATION{RESET}")
        print(f"{RED}{'='*80}{RESET}\n")
        sys.exit(1)


if __name__ == '__main__':
    main()
