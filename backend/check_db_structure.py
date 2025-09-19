#!/usr/bin/env python3
"""Check complete database structure for RateMyProf."""

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

print("=== CHECKING DATABASE STRUCTURE ===\n")

# Check professor structure with one record
print("1. PROFESSOR STRUCTURE:")
try:
    result = supabase.table('professors').select('*').limit(1).execute()
    if result.data:
        print("Sample professor record:")
        prof = result.data[0]
        for key, value in prof.items():
            print(f"  {key}: {value} ({type(value).__name__})")
    else:
        print("No professors found")
except Exception as e:
    print(f"Error accessing professors: {e}")

print("\n2. COLLEGES STRUCTURE:")
try:
    result = supabase.table('colleges').select('*').limit(1).execute()
    if result.data:
        print("Sample college record:")
        college = result.data[0]
        for key, value in college.items():
            print(f"  {key}: {value} ({type(value).__name__})")
    else:
        print("No colleges found")
except Exception as e:
    print(f"Error accessing colleges: {e}")

print("\n3. REVIEWS STRUCTURE:")
try:
    result = supabase.table('reviews').select('*').limit(1).execute()
    if result.data:
        print("Sample review record:")
        review = result.data[0]
        for key, value in review.items():
            print(f"  {key}: {value} ({type(value).__name__})")
    else:
        print("No reviews found")
except Exception as e:
    print(f"Error accessing reviews: {e}")

print("\n4. TABLE EXISTENCE CHECK:")
tables_to_check = ['professors', 'colleges', 'reviews', 'users']
for table in tables_to_check:
    try:
        result = supabase.table(table).select('id').limit(1).execute()
        print(f"  {table}: ✓ EXISTS (count check)")
    except Exception as e:
        print(f"  {table}: ✗ ERROR - {e}")