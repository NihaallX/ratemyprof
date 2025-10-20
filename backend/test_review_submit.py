"""Test script to diagnose review submission issue."""
import sys
sys.path.insert(0, '.')

from src.lib.database import get_supabase, get_supabase_admin

def test_review_creation():
    print("=" * 60)
    print("Testing Review Submission Components")
    print("=" * 60)
    
    # Test 1: Check Supabase clients
    print("\n1. Testing Supabase clients...")
    supabase = get_supabase()
    supabase_admin = get_supabase_admin()
    
    print(f"   ✓ Regular client: {supabase is not None}")
    print(f"   ✓ Admin client: {supabase_admin is not None}")
    
    if not supabase_admin:
        print("   ✗ ERROR: Admin client is None!")
        return False
    
    # Test 2: Check review_author_mappings table exists
    print("\n2. Testing review_author_mappings table...")
    try:
        result = supabase_admin.table('review_author_mappings').select('*').limit(1).execute()
        print(f"   ✓ Table exists, has {len(result.data)} record(s)")
    except Exception as e:
        print(f"   ✗ ERROR: {e}")
        return False
    
    # Test 3: Check reviews table
    print("\n3. Testing reviews table...")
    try:
        result = supabase.table('reviews').select('*').limit(1).execute()
        print(f"   ✓ Table exists, has {len(result.data)} record(s)")
    except Exception as e:
        print(f"   ✗ ERROR: {e}")
        return False
    
    # Test 4: Try to insert a test mapping (then delete it)
    print("\n4. Testing mapping creation...")
    test_mapping = {
        'review_id': '00000000-0000-0000-0000-000000000000',
        'author_id': '00000000-0000-0000-0000-000000000000',
        'ip_address': None,
        'user_agent': 'test'
    }
    
    try:
        result = supabase_admin.table('review_author_mappings').insert(test_mapping).execute()
        print(f"   ✓ Test mapping created successfully")
        
        # Delete the test mapping
        supabase_admin.table('review_author_mappings').delete().eq('review_id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"   ✓ Test mapping deleted successfully")
    except Exception as e:
        print(f"   ✗ ERROR creating mapping: {e}")
        print(f"   Error type: {type(e)}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_review_creation()
    sys.exit(0 if success else 1)
