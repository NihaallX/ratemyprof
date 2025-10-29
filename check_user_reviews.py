"""
Check review mappings for a specific user ID
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('backend/.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Missing Supabase credentials in backend/.env")
    exit(1)

# Create admin client (bypasses RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

USER_ID = "1bee37ff-7b6d-476d-9e97-860300ad28da"

print(f"🔍 Checking reviews for user ID: {USER_ID}\n")

# Check professor review mappings
print("=" * 60)
print("PROFESSOR REVIEW MAPPINGS (review_author_mappings)")
print("=" * 60)
try:
    prof_mappings = supabase.table('review_author_mappings').select('*').eq('author_id', USER_ID).execute()
    print(f"Found {len(prof_mappings.data)} professor review mappings")
    
    if prof_mappings.data:
        for i, mapping in enumerate(prof_mappings.data, 1):
            print(f"\n{i}. Mapping ID: {mapping['id']}")
            print(f"   Review ID: {mapping['review_id']}")
            print(f"   Created: {mapping.get('created_at', 'N/A')}")
            
            # Get the actual review
            review = supabase.table('reviews').select('*, professors(name, department)').eq('id', mapping['review_id']).execute()
            if review.data:
                r = review.data[0]
                prof = r.get('professors', {})
                print(f"   Professor: {prof.get('name', 'Unknown')}")
                print(f"   Department: {prof.get('department', 'Unknown')}")
                print(f"   Rating: {r.get('overall_rating', 0)}/5")
                print(f"   Status: {r.get('status', 'unknown')}")
                print(f"   Course: {r.get('course_name', 'N/A')}")
    else:
        print("❌ No professor review mappings found for this user!")
        
except Exception as e:
    print(f"❌ Error checking professor mappings: {e}")

# Check college review mappings
print("\n" + "=" * 60)
print("COLLEGE REVIEW MAPPINGS (college_review_author_mappings)")
print("=" * 60)
try:
    college_mappings = supabase.table('college_review_author_mappings').select('*').eq('author_id', USER_ID).execute()
    print(f"Found {len(college_mappings.data)} college review mappings")
    
    if college_mappings.data:
        for i, mapping in enumerate(college_mappings.data, 1):
            print(f"\n{i}. Mapping ID: {mapping['id']}")
            print(f"   Review ID: {mapping['review_id']}")
            print(f"   Created: {mapping.get('created_at', 'N/A')}")
            
            # Get the actual review
            review = supabase.table('college_reviews').select('*, colleges(name, city, state)').eq('id', mapping['review_id']).execute()
            if review.data:
                r = review.data[0]
                college = r.get('colleges', {})
                print(f"   College: {college.get('name', 'Unknown')}")
                print(f"   City: {college.get('city', 'Unknown')}")
                print(f"   Rating: {r.get('overall_rating', 0)}/5")
                print(f"   Status: {r.get('status', 'unknown')}")
    else:
        print("❌ No college review mappings found for this user!")
        
except Exception as e:
    print(f"❌ Error checking college mappings: {e}")

# Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
total_prof = len(prof_mappings.data) if 'prof_mappings' in locals() and prof_mappings.data else 0
total_college = len(college_mappings.data) if 'college_mappings' in locals() and college_mappings.data else 0
total = total_prof + total_college

print(f"Professor Reviews: {total_prof}")
print(f"College Reviews: {total_college}")
print(f"Total Reviews: {total}")

if total == 0:
    print("\n⚠️ WARNING: No reviews found for this user!")
    print("   This could mean:")
    print("   1. Reviews were submitted but mappings weren't created")
    print("   2. Reviews were deleted")
    print("   3. Wrong user ID")
    print("   4. RLS migration issue - old reviews without mappings")
