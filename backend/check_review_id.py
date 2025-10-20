from src.lib.database import get_supabase

sb = get_supabase()
result = sb.table('reviews').select('*').limit(1).execute()

if result.data:
    review = result.data[0]
    print(f"Review ID: {review['id']}")
    print(f"Review ID type: {type(review['id'])}")
    print(f"Is UUID format: {len(str(review['id'])) == 36 and '-' in str(review['id'])}")
    print(f"\nAll columns: {list(review.keys())}")
else:
    print("No reviews found")
