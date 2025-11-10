from supabase import create_client
import os

# Supabase credentials
SUPABASE_URL = "https://baojiybimxnugalrbwaa.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhb2ppeWJpbXhudWdhbHJid2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg2NTM4MjYsImV4cCI6MjA0NDIyOTgyNn0.B3T8jTrXy0p3bL-Hv5_zDdxHY8kXzkF9PjR5X4wYZBk"

client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=== Top 20 Verified Professors ===")
result = client.table('professors').select('name, college_id, average_rating, total_reviews, is_verified').eq('is_verified', True).order('average_rating', desc=True).order('total_reviews', desc=True).limit(20).execute()

print(f"Total verified professors with ratings: {len(result.data)}\n")

for i, p in enumerate(result.data, 1):
    print(f"{i}. {p['name']}")
    print(f"   College: {p['college_id']}")
    print(f"   Rating: {p['average_rating']} | Reviews: {p['total_reviews']}")
    print()

print("\n=== Filtering for professors with reviews > 0 ===")
filtered = [p for p in result.data if p['average_rating'] > 0 and p['total_reviews'] > 0]
print(f"Count after filtering: {len(filtered)}\n")

for i, p in enumerate(filtered[:10], 1):
    print(f"{i}. {p['name']} - Rating: {p['average_rating']} ({p['total_reviews']} reviews) - {p['college_id']}")

print("\n=== All Verified Professors Count ===")
count_result = client.table('professors').select('*', count='exact').eq('is_verified', True).execute()
print(f"Total verified professors in DB: {count_result.count}")
