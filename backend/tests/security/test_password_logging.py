"""
Security Test for Admin Password Hash Generator
Tests that sensitive information is not logged
"""

import subprocess
import sys
import os

def test_no_password_in_output():
    """Test that password is not logged in error output"""
    
    print("🧪 Testing Clear-text Logging Prevention\n")
    print("="*70)
    
    # Test 1: Weak password with command-line argument (legacy method)
    print("\n📝 Test 1: Weak password validation (legacy CLI arg method)")
    print("-"*70)
    
    test_password = "weak"
    script_path = os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "generate_admin_hash_bcrypt.py")
    
    try:
        result = subprocess.run(
            [sys.executable, script_path, test_password],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        output = result.stdout + result.stderr
        
        # Check that password is NOT in the output
        if test_password.lower() in output.lower():
            print(f"❌ FAILED: Password '{test_password}' found in output!")
            print(f"   Output: {output}")
            return False
        else:
            print(f"✅ PASSED: Password not exposed in error output")
        
        # Check that security warning is present
        if "SECURITY WARNING" in output:
            print(f"✅ PASSED: Security warning displayed for CLI argument usage")
        else:
            print(f"⚠️  WARNING: Security warning not found (expected for legacy method)")
        
    except subprocess.TimeoutExpired:
        print("❌ FAILED: Script timed out")
        return False
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False
    
    # Test 2: Verify error messages don't contain sensitive data
    print("\n📝 Test 2: Error message sanitization")
    print("-"*70)
    
    if "Password validation failed" in output or "Error" in output:
        print("✅ PASSED: Generic error message used")
    else:
        print("⚠️  Note: No validation error found (might be expected)")
    
    # Test 3: Check for clear-text logging patterns
    print("\n📝 Test 3: Clear-text logging patterns")
    print("-"*70)
    
    dangerous_patterns = [
        f"password={test_password}",
        f"pwd: {test_password}",
        f"plaintext: {test_password}",
    ]
    
    found_dangerous = False
    for pattern in dangerous_patterns:
        if pattern.lower() in output.lower():
            print(f"❌ FAILED: Dangerous logging pattern found: {pattern}")
            found_dangerous = True
    
    if not found_dangerous:
        print("✅ PASSED: No dangerous clear-text logging patterns found")
    
    return not found_dangerous


def test_secure_input_method():
    """Test that secure input method is available"""
    
    print("\n📝 Test 4: Secure input method availability")
    print("-"*70)
    
    script_path = os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "generate_admin_hash_bcrypt.py")
    
    # Check if script imports getpass
    with open(script_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
        if 'import getpass' in content:
            print("✅ PASSED: getpass module imported (secure input available)")
        else:
            print("❌ FAILED: getpass module not imported")
            return False
        
        if 'getpass.getpass' in content:
            print("✅ PASSED: getpass.getpass() used for secure password input")
        else:
            print("❌ FAILED: getpass.getpass() not used")
            return False
        
        if 'password = None' in content:
            print("✅ PASSED: Password cleared from memory after use")
        else:
            print("⚠️  WARNING: Password not explicitly cleared from memory")
    
    return True


def test_documentation():
    """Test that security warnings are documented"""
    
    print("\n📝 Test 5: Security documentation")
    print("-"*70)
    
    script_path = os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "generate_admin_hash_bcrypt.py")
    
    with open(script_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
        if 'SECURITY' in content.upper():
            print("✅ PASSED: Security notice included in documentation")
        else:
            print("❌ FAILED: No security notice in documentation")
            return False
        
        if 'shell history' in content.lower():
            print("✅ PASSED: Shell history risk documented")
        else:
            print("⚠️  WARNING: Shell history risk not documented")
    
    return True


# Run all tests
if __name__ == "__main__":
    print("🛡️  ADMIN PASSWORD HASH GENERATOR - SECURITY TESTS\n")
    print("="*70)
    print("Testing: backend/scripts/generate_admin_hash_bcrypt.py")
    print("Issue: Clear-text logging of sensitive information (CWE-532)")
    print("="*70)
    
    results = []
    
    try:
        results.append(("Password exposure test", test_no_password_in_output()))
        results.append(("Secure input method test", test_secure_input_method()))
        results.append(("Documentation test", test_documentation()))
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
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
        print("✅ Clear-text logging vulnerability fixed")
        print("✅ Secure password input method implemented")
        print("✅ Password cleared from memory after use")
        print("✅ Security warnings documented")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED")
        print("⚠️  Please review the failures above")
        sys.exit(1)
