import os
import sys
sys.path.insert(0, 'backend')

from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv('backend/.env')

# Create Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Get total count
result = supabase.table('professors').select('id', count='exact').execute()
print(f'✅ Total professors in table: {result.count}')

# Get verified count
verified = supabase.table('professors').select('id', count='exact').eq('is_verified', True).execute()
print(f'✅ Verified (is_verified=True): {verified.count}')

# Get unverified count
unverified = supabase.table('professors').select('id', count='exact').eq('is_verified', False).execute()
print(f'⚠️  Unverified (is_verified=False): {unverified.count}')

# Get NULL count
is_null = supabase.table('professors').select('id', count='exact').is_('is_verified', 'null').execute()
print(f'❓ is_verified=NULL: {is_null.count}')

print(f'\n📊 Breakdown:')
print(f'   Verified: {verified.count}')
print(f'   Unverified: {unverified.count}')
print(f'   NULL: {is_null.count}')
print(f'   Total: {verified.count + unverified.count + is_null.count}')
