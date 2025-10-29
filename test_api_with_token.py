"""
Test the actual API endpoint with a real token
You need to provide your actual access token from the browser
"""
import requests
import sys

# You need to get this from your browser:
# 1. Go to ratemyprof.me
# 2. Open DevTools (F12)
# 3. Go to Application tab → Local Storage → session
# 4. Copy the access_token value
ACCESS_TOKEN = input("Paste your access_token from browser localStorage: ").strip()

if not ACCESS_TOKEN:
    print("❌ No token provided")
    sys.exit(1)

API_URL = "https://ratemyprof-production.up.railway.app"

print(f"🔍 Testing API with your token...\n")

# Test professor reviews
print("=" * 60)
print("Testing /v1/reviews/my-reviews")
print("=" * 60)
response = requests.get(
    f"{API_URL}/v1/reviews/my-reviews",
    headers={
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
)
print(f"Status: {response.status_code}")
if response.ok:
    data = response.json()
    print(f"✅ SUCCESS! Got {data.get('total', 0)} professor reviews")
    print(f"Reviews: {len(data.get('reviews', []))}")
else:
    print(f"❌ FAILED: {response.text}")

# Test college reviews
print("\n" + "=" * 60)
print("Testing /v1/college-reviews/my-reviews")
print("=" * 60)
response = requests.get(
    f"{API_URL}/v1/college-reviews/my-reviews",
    headers={
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
)
print(f"Status: {response.status_code}")
if response.ok:
    data = response.json()
    print(f"✅ SUCCESS! Got {data.get('total', 0)} college reviews")
    print(f"Reviews: {len(data.get('reviews', []))}")
    if data.get('reviews'):
        print(f"\nFirst review:")
        print(f"  College: {data['reviews'][0].get('collegeName')}")
        print(f"  Rating: {data['reviews'][0].get('ratings', {}).get('overall')}")
else:
    print(f"❌ FAILED: {response.text}")
