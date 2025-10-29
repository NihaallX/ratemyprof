"""
Test if college_reviews join with colleges works now
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('backend/.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

USER_ID = "1bee37ff-7b6d-476d-9e97-860300ad28da"

print("🔍 Testing the /college-reviews/my-reviews endpoint logic...\n")

# Step 1: Get mappings
print("Step 1: Get user's college review mappings")
mappings = supabase.table('college_review_author_mappings').select('review_id').eq('author_id', USER_ID).execute()
print(f"✅ Found {len(mappings.data)} mapping(s): {[m['review_id'] for m in mappings.data]}")

if mappings.data:
    review_ids = [m['review_id'] for m in mappings.data]
    
    # Step 2: Try the join (this is what's failing)
    print("\nStep 2: Fetch reviews with college details (WITH JOIN)")
    try:
        reviews = supabase.table('college_reviews').select(
            '*, colleges(id, name, city, state)'
        ).in_('id', review_ids).order('created_at', desc=True).execute()
        
        print(f"✅ SUCCESS! Got {len(reviews.data)} review(s)")
        for r in reviews.data:
            print(f"\nReview ID: {r['id']}")
            print(f"College: {r.get('colleges', {})}")
            print(f"Overall Rating: {r.get('overall_rating')}")
            
    except Exception as e:
        print(f"❌ FAILED with error: {e}")
        
        # Try without join
        print("\n🔄 Trying WITHOUT join (fallback)...")
        reviews = supabase.table('college_reviews').select('*').in_('id', review_ids).execute()
        print(f"✅ Got {len(reviews.data)} review(s) without join")
        
        # Manually get college details
        for r in reviews.data:
            college_id = r.get('college_id')
            college = supabase.table('colleges').select('id, name, city, state').eq('id', college_id).execute()
            print(f"\nReview ID: {r['id']}")
            print(f"College ID: {college_id}")
            if college.data:
                print(f"College: {college.data[0]}")
            else:
                print(f"❌ College not found!")
else:
    print("No mappings found for this user")
