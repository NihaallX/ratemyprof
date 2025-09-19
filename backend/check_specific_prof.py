#!/usr/bin/env python3
"""Check specific professor details."""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Database connection 
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables")
    exit(1)

supabase: Client = create_client(url, key)

# Check the specific professor used in the test
professor_id = "2470aebd-0e8f-44df-b093-a056986afe97"
print(f"Checking professor: {professor_id}")

try:
    result = supabase.table('professors').select('*').eq('id', professor_id).execute()
    if result.data:
        prof = result.data[0]
        print(f"Professor data:")
        for key, value in prof.items():
            print(f"  {key}: {value}")
    else:
        print("Professor not found")
except Exception as e:
    print(f"Error: {e}")