"""
Check VU Pune College Review Status
Quick diagnostic script to verify college reviews
"""
import os
from supabase import create_client

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://yfpcuhxlgxhwxzevhsst.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("🔍 VU PUNE COLLEGE REVIEW DIAGNOSTIC")
print("=" * 80)

# Find VU college
print("\n1. Searching for VU Pune college...")
colleges = supabase.table('colleges').select('*').ilike('name', '%vishwakarma%').execute()

if colleges.data:
    for college in colleges.data:
        print(f"   ✅ Found: {college['name']}")
        print(f"      ID: {college['id']}")
        print(f"      Total Reviews: {college.get('total_reviews', 0)}")
        print(f"      Average Rating: {college.get('average_rating', 0)}")
        
        college_id = college['id']
        
        # Check for reviews
        print(f"\n2. Checking reviews for college_id={college_id}...")
        reviews = supabase.table('college_reviews').select('id, status, overall_rating, created_at').eq('college_id', college_id).execute()
        
        if reviews.data:
            print(f"   ✅ Found {len(reviews.data)} review(s):")
            for rev in reviews.data:
                print(f"      - Review ID: {rev['id']}")
                print(f"        Status: {rev['status']}")
                print(f"        Rating: {rev['overall_rating']}")
                print(f"        Created: {rev['created_at']}")
        else:
            print(f"   ❌ No reviews found!")
            
        # Check approved reviews only
        approved = supabase.table('college_reviews').select('id').eq('college_id', college_id).eq('status', 'approved').execute()
        print(f"\n3. Approved reviews: {len(approved.data) if approved.data else 0}")
        
else:
    print("   ❌ VU Pune college not found!")

print("\n" + "=" * 80)
