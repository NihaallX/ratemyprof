"""
Check college_reviews table schema
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('backend/.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("🔍 Checking college_reviews table structure...\n")

# Try to fetch one college review with college details
try:
    result = supabase.table('college_reviews').select('*, colleges(*)').limit(1).execute()
    print("✅ Foreign key relationship EXISTS!")
    print(f"Sample data: {result.data}")
except Exception as e:
    print(f"❌ Foreign key relationship MISSING!")
    print(f"Error: {e}")
    
    # Try without the join
    print("\n🔄 Trying without join...")
    result = supabase.table('college_reviews').select('*').limit(1).execute()
    if result.data:
        print("✅ Table exists and has data")
        print(f"Sample review: {result.data[0]}")
        print(f"\nCollege ID in review: {result.data[0].get('college_id')}")
        
        # Check if college exists
        college_id = result.data[0].get('college_id')
        if college_id:
            college = supabase.table('colleges').select('*').eq('id', college_id).execute()
            if college.data:
                print(f"✅ College EXISTS: {college.data[0].get('name')}")
            else:
                print(f"❌ College NOT FOUND for ID: {college_id}")
