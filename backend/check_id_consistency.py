#!/usr/bin/env python3
"""Check ID consistency between professors and colleges."""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables")
    exit(1)

supabase: Client = create_client(url, key)

print("=== ID CONSISTENCY CHECK ===\n")

# Check all college IDs
print("1. COLLEGE IDs:")
try:
    colleges = supabase.table('colleges').select('id, name').execute()
    for college in colleges.data:
        print(f"  College ID: '{college['id']}' -> {college['name']}")
except Exception as e:
    print(f"Error fetching colleges: {e}")

print("\n2. PROFESSOR COLLEGE_IDs:")
try:
    professors = supabase.table('professors').select('id, name, college_id').execute()
    college_ids = set()
    for prof in professors.data:
        college_ids.add(prof['college_id'])
        print(f"  Professor: {prof['name'][:20]:<20} -> college_id: '{prof['college_id']}'")
    
    print(f"\n3. UNIQUE COLLEGE_IDs IN PROFESSORS: {list(college_ids)}")
    
except Exception as e:
    print(f"Error fetching professors: {e}")

print("\n4. ID MISMATCH ANALYSIS:")
try:
    # Get all college IDs from colleges table
    colleges = supabase.table('colleges').select('id').execute()
    actual_college_ids = {c['id'] for c in colleges.data}
    
    # Get all college_ids referenced by professors
    professors = supabase.table('professors').select('college_id').execute()
    referenced_college_ids = {p['college_id'] for p in professors.data}
    
    print(f"  Actual college IDs: {actual_college_ids}")
    print(f"  Referenced by professors: {referenced_college_ids}")
    
    missing = referenced_college_ids - actual_college_ids
    if missing:
        print(f"  ❌ MISSING COLLEGES: {missing}")
    else:
        print("  ✅ All professor college_ids match existing colleges")
        
except Exception as e:
    print(f"Error in analysis: {e}")