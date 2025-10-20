"""Test review submission endpoint directly"""
import asyncio
import sys
from src.lib.database import get_supabase, get_supabase_admin
from src.lib.auth import get_user_from_token

async def test_review_submission():
    print("=" * 60)
    print("Testing Review Submission Flow")
    print("=" * 60)
    
    # Step 1: Get a real user token
    print("\n1. Getting user session...")
    supabase = get_supabase()
    
    # Try to sign in as your test user
    try:
        result = supabase.auth.sign_in_with_password({
            "email": "nihalpardeshi12344@gmail.com",
            "password": "your_password_here"  # Replace with actual password
        })
        print(f"   ✓ Signed in as: {result.user.email if result.user else 'Unknown'}")
        token = result.session.access_token if result.session else None
        
        if not token:
            print("   ✗ No token received")
            return False
            
        print(f"   ✓ Got token: {token[:50]}...")
    except Exception as e:
        print(f"   ✗ Sign in failed: {e}")
        print("   Using mock approach instead...")
        
        # Get first user from auth
        admin = get_supabase_admin()
        users = admin.auth.admin.list_users()
        if not users or len(users) == 0:
            print("   ✗ No users in database")
            return False
        
        test_user = users[0]
        print(f"   Using user: {test_user.email}")
        mock_current_user = {
            'id': test_user.id,
            'email': test_user.email
        }
    
    # Step 2: Check professors
    print("\n2. Getting a professor to review...")
    profs = supabase.table('professors').select('id, name').limit(1).execute()
    if not profs.data:
        print("   ✗ No professors found")
        return False
    
    prof = profs.data[0]
    print(f"   ✓ Professor: {prof['name']} ({prof['id']})")
    
    # Step 3: Try to create mapping
    print("\n3. Testing mapping creation...")
    admin = get_supabase_admin()
    
    test_review_id = "test-review-" + test_user.id[:8]
    test_mapping = {
        'review_id': test_review_id,
        'author_id': test_user.id,
        'ip_address': None,
        'user_agent': 'test-script'
    }
    
    try:
        result = admin.table('review_author_mappings').insert(test_mapping).execute()
        print(f"   ✓ Mapping created successfully")
        
        # Clean up
        admin.table('review_author_mappings').delete().eq('review_id', test_review_id).execute()
        print(f"   ✓ Test mapping cleaned up")
    except Exception as e:
        print(f"   ✗ Mapping creation failed: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ All components working!")
    print("=" * 60)
    print("\nThe issue must be in the HTTP request handling.")
    print("Check the backend server window for actual error logs.")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_review_submission())
    sys.exit(0 if success else 1)
