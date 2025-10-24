"""Test if the import works"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

print("Testing imports...")
print()

# Test wrong import (what's in production)
print("1. Testing WRONG import: from lib.database import get_supabase_admin")
try:
    from lib.database import get_supabase_admin
    print("   ✅ SUCCESS - This import works!")
except ImportError as e:
    print(f"   ❌ FAILED - ImportError: {e}")
    print("   This means the production deployment will FAIL when flagging/voting")

print()

# Test correct import (what we fixed)
print("2. Testing CORRECT import: from src.lib.database import get_supabase_admin")
try:
    from src.lib.database import get_supabase_admin
    print("   ✅ SUCCESS - This import works!")
except ImportError as e:
    print(f"   ❌ FAILED - ImportError: {e}")

print()
print("=" * 70)
print("CONCLUSION:")
print("=" * 70)
print("If test #1 FAILED: Production flagging/voting is BROKEN right now")
print("If test #1 PASSED: Production is working (unusual but possible)")
print()
print("Your partner's code has wrong import, so it's likely BROKEN in production")
print("You need to commit and push the fix!")
