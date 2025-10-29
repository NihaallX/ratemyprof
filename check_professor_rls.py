"""Check if professor insert RLS policy exists and is correct."""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Need service role to check policies

client = create_client(supabase_url, supabase_key)

# Check current RLS policies on professors table
query = """
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'professors'
ORDER BY policyname;
"""

result = client.rpc('exec_sql', {'query': query}).execute()
print("Current RLS Policies on professors table:")
print(result.data)
