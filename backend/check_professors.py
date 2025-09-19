#!/usr/bin/env python3
"""Check real professors in our Supabase database."""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_ANON_KEY')

supabase = create_client(supabase_url, supabase_key)

# Get all professors
try:
    result = supabase.table('professors').select('id, name, department').execute()
    print('Real VU Professors in database:')
    for prof in result.data:
        print(f"  ID: {prof['id']}")
        print(f"  Name: {prof['name']}")
        print(f"  Department: {prof['department']}")
        print()
        
    print(f"Total professors: {len(result.data)}")
except Exception as e:
    print(f'Error: {e}')