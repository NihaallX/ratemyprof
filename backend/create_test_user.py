"""Create a test user for notification testing"""
import sys
sys.path.insert(0, '.')

from src.lib.database import get_supabase_service

supabase = get_supabase_service()

# The user ID that exists in review_author_mappings
existing_user_id = "1bee37ff-7b6d-476d-9e97-860300ad28da"

print(f"Creating test user with ID: {existing_user_id}")

try:
    result = supabase.table("users").insert({
        "id": existing_user_id,
        "email": "test@ratemyprof.in",
        "name": "Test User",
        "college_id": None
    }).execute()
    
    print("✅ Test user created successfully!")
    print(f"   Email: test@ratemyprof.in")
    
except Exception as e:
    if "duplicate key" in str(e).lower():
        print("✅ User already exists")
    else:
        print(f"❌ Error: {e}")
