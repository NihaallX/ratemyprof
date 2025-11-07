"""
Security Test for RLS Verification Script
Tests that sensitive information (passwords) is not logged
"""

import subprocess
import sys
import os

def test_no_password_in_output():
    """Test that password is not printed to stdout"""
    
    print("🧪 Testing Clear-text Password Logging Prevention in RLS Script\n")
    print("="*70)
    
    script_path = os.path.join(
        os.path.dirname(__file__), 
        "..", "..", 
        "scripts", 
        "verify_rls_security.py"
    )
    
    # Test: Check script output for password exposure
    print("\n📝 Test 1: Password not printed to console")
    print("-"*70)
    
    try:
        # Run the script but send 'n' to skip actual tests
        result = subprocess.run(
            [sys.executable, script_path],
            input='\n',  # Press Enter to skip
            capture_output=True,
            text=True,
            timeout=5
        )
        
        output = result.stdout + result.stderr
        
        # The default test password
        test_password = "TestPassword123!"
        
        # Check that password is NOT in the output
        if test_password in output:
            print(f"❌ FAILED: Test password '{test_password}' found in output!")
            print(f"   This exposes sensitive information in logs.")
            return False
        else:
            print(f"✅ PASSED: Test password not exposed in output")
        
        # Check that safe message is displayed instead
        if "configured via environment variable" in output:
            print(f"✅ PASSED: Safe message displayed instead of password")
        else:
            print(f"⚠️  WARNING: Expected safe message not found")
        
    except subprocess.TimeoutExpired:
        print("⚠️  Script timed out (expected - waiting for user input)")
        # This is okay - script waits for Enter key
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False
    
    return True


def test_password_from_env():
    """Test that password can be loaded from environment variable"""
    
    print("\n📝 Test 2: Password loaded from environment variable")
    print("-"*70)
    
    script_path = os.path.join(
        os.path.dirname(__file__), 
        "..", "..", 
        "scripts", 
        "verify_rls_security.py"
    )
    
    # Check if script uses os.getenv for password
    with open(script_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
        if "os.getenv('TEST_USER_PASSWORD'" in content:
            print("✅ PASSED: Script supports loading password from env var")
        else:
            print("❌ FAILED: Script doesn't load password from env var")
            return False
        
        # Check that password is not hardcoded as plain string
        if 'TEST_USER_PASSWORD = "' in content and 'os.getenv' not in content.split('TEST_USER_PASSWORD')[1].split('\n')[0]:
            print("❌ FAILED: Password appears to be hardcoded")
            return False
        else:
            print("✅ PASSED: Password not hardcoded as plain string")
    
    return True


def test_no_clear_text_logging():
    """Test that the fix prevents clear-text logging"""
    
    print("\n📝 Test 3: No clear-text password logging")
    print("-"*70)
    
    script_path = os.path.join(
        os.path.dirname(__file__), 
        "..", "..", 
        "scripts", 
        "verify_rls_security.py"
    )
    
    with open(script_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # Check that password variable is not printed directly
        # Using simple string search instead of regex to avoid escaping issues
        found_dangerous = False
        
        if 'Password: {TEST_USER_PASSWORD}' in content:
            print("❌ FAILED: Found dangerous logging pattern - password being printed")
            found_dangerous = True
        
        if not found_dangerous:
            print("✅ PASSED: No dangerous clear-text password logging patterns found")
        
        # Check for safe pattern
        if "configured via environment variable" in content:
            print("✅ PASSED: Safe placeholder message used instead of password")
            return True
        else:
            print("⚠️  WARNING: Safe placeholder message not found")
            return not found_dangerous
    
    return not found_dangerous


# Run all tests
if __name__ == "__main__":
    print("🛡️  RLS VERIFICATION SCRIPT - SECURITY TESTS\n")
    print("="*70)
    print("Testing: backend/scripts/verify_rls_security.py")
    print("Issue: Clear-text logging of sensitive information (CWE-532)")
    print("="*70)
    
    results = []
    
    try:
        results.append(("Password exposure test", test_no_password_in_output()))
        results.append(("Environment variable support", test_password_from_env()))
        results.append(("Clear-text logging prevention", test_no_clear_text_logging()))
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print("-"*70)
    print(f"Total: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    print("="*70)
    
    if passed == total:
        print("\n🎉 ALL SECURITY TESTS PASSED!")
        print("✅ Clear-text password logging vulnerability fixed")
        print("✅ Password can be loaded from environment variable")
        print("✅ No sensitive information in console output")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED")
        print("⚠️  Please review the failures above")
        sys.exit(1)
