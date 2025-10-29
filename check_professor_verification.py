"""Check professor verification status in database."""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# Load .env from backend directory
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment")
    print(f"   Tried loading from: {env_path}")
    print(f"   File exists: {os.path.exists(env_path)}")
    sys.exit(1)

client = create_client(supabase_url, supabase_key)

print("=" * 80)
print("CHECKING PROFESSOR VERIFICATION STATUS")
print("=" * 80)

# Get all professors with their verification status
result = client.table('professors').select(
    'id, name, department, college_id, is_verified, created_at, updated_at'
).order('created_at', desc=True).limit(20).execute()

if result.data:
    print(f"\n📊 Found {len(result.data)} recent professors:\n")
    
    for prof in result.data:
        status = "✅ VERIFIED" if prof.get('is_verified') else "⏳ PENDING"
        print(f"{status} | {prof['name']}")
        print(f"   ID: {prof['id']}")
        print(f"   Department: {prof.get('department', 'N/A')}")
        print(f"   College ID: {prof.get('college_id', 'N/A')}")
        print(f"   Created: {prof.get('created_at', 'N/A')}")
        print(f"   Updated: {prof.get('updated_at', 'N/A')}")
        print()
else:
    print("❌ No professors found")

# Check specifically for "Test" professors
print("=" * 80)
print("SEARCHING FOR 'TEST' PROFESSORS")
print("=" * 80)

test_profs = client.table('professors').select('*').ilike('name', '%test%').execute()

if test_profs.data:
    print(f"\n🔍 Found {len(test_profs.data)} professors with 'test' in name:\n")
    for prof in test_profs.data:
        status = "✅ VERIFIED" if prof.get('is_verified') else "⏳ PENDING"
        print(f"{status} | {prof['name']}")
        print(f"   ID: {prof['id']}")
        print(f"   is_verified: {prof.get('is_verified')}")
        print()
else:
    print("❌ No test professors found")

# Check pending professors count
print("=" * 80)
print("PENDING PROFESSORS SUMMARY")
print("=" * 80)

pending = client.table('professors').select('id, name', count='exact').eq('is_verified', False).execute()
verified = client.table('professors').select('id, name', count='exact').eq('is_verified', True).execute()

print(f"\n⏳ Pending (is_verified=False): {pending.count if hasattr(pending, 'count') else len(pending.data)}")
print(f"✅ Verified (is_verified=True): {verified.count if hasattr(verified, 'count') else len(verified.data)}")

if pending.data:
    print("\nPending professors:")
    for prof in pending.data:
        print(f"  - {prof['name']} (ID: {prof['id']})")
