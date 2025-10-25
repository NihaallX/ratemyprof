"""
Script to recalculate all professor ratings based on approved reviews only
Run this once to fix all existing professor data
"""
import os
from supabase import create_client

def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        return
    
    supabase = create_client(url, key)
    
    print("=" * 60)
    print("Recalculating Professor Ratings (Approved Reviews Only)")
    print("=" * 60)
    
    # Get all professors
    professors_result = supabase.table("professors").select("id, full_name").execute()
    
    if not professors_result.data:
        print("❌ No professors found")
        return
    
    total_professors = len(professors_result.data)
    print(f"📊 Found {total_professors} professors")
    print()
    
    updated_count = 0
    unchanged_count = 0
    
    for prof in professors_result.data:
        prof_id = prof['id']
        prof_name = prof['full_name']
        
        # Get ONLY approved reviews for this professor
        reviews_result = supabase.table("reviews").select("overall_rating").eq(
            "professor_id", prof_id
        ).eq("status", "approved").execute()
        
        if reviews_result.data and len(reviews_result.data) > 0:
            total_reviews = len(reviews_result.data)
            average_rating = sum(r['overall_rating'] for r in reviews_result.data) / total_reviews
            average_rating = round(average_rating, 1)
            
            # Update professor
            supabase.table("professors").update({
                'average_rating': average_rating,
                'total_reviews': total_reviews
            }).eq('id', prof_id).execute()
            
            print(f"✅ {prof_name}: {average_rating} ({total_reviews} approved reviews)")
            updated_count += 1
        else:
            # No approved reviews, set to 0
            supabase.table("professors").update({
                'average_rating': 0.0,
                'total_reviews': 0
            }).eq('id', prof_id).execute()
            
            print(f"⚪ {prof_name}: 0.0 (0 approved reviews)")
            unchanged_count += 1
    
    print()
    print("=" * 60)
    print(f"🎉 Complete! Updated {updated_count} professors with reviews")
    print(f"   {unchanged_count} professors have no approved reviews")
    print("=" * 60)

if __name__ == "__main__":
    main()
