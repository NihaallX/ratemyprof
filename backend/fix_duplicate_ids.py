#!/usr/bin/env python3
"""Clean up duplicate college IDs and professors."""

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

print("=== CLEANING UP DUPLICATE IDs ===\n")

# Strategy:
# 1. Keep 'VU-PUNE-001' as the primary college ID (it's more readable)
# 2. Update all professors with college_id='312303501027' to use 'VU-PUNE-001'  
# 3. Delete the duplicate college entry '312303501027'
# 4. Delete duplicate professor entries

print("1. UPDATING PROFESSORS to use consistent college ID...")
try:
    # Update professors from numeric ID to readable ID
    result = supabase.table('professors').update({
        'college_id': 'VU-PUNE-001'
    }).eq('college_id', '312303501027').execute()
    
    print(f"   ✅ Updated {len(result.data)} professor records to use VU-PUNE-001")
    
except Exception as e:
    print(f"   ❌ Error updating professors: {e}")

print("\n2. REMOVING DUPLICATE COLLEGE ENTRY...")
try:
    # Delete the numeric college ID entry
    result = supabase.table('colleges').delete().eq('id', '312303501027').execute()
    print(f"   ✅ Removed duplicate college entry: 312303501027")
    
except Exception as e:
    print(f"   ❌ Error deleting college: {e}")

print("\n3. FINDING DUPLICATE PROFESSORS...")
try:
    # Get all professors
    professors = supabase.table('professors').select('*').execute()
    
    # Group by name and department to find duplicates
    prof_groups = {}
    for prof in professors.data:
        key = (prof['name'], prof['department'])
        if key not in prof_groups:
            prof_groups[key] = []
        prof_groups[key].append(prof)
    
    # Find duplicates (same name + department)
    duplicates_to_remove = []
    for key, profs in prof_groups.items():
        if len(profs) > 1:
            print(f"   Found duplicate: {profs[0]['name']} ({profs[0]['department']})")
            # Keep the first one, mark others for deletion
            for prof in profs[1:]:
                duplicates_to_remove.append(prof['id'])
                print(f"     -> Will remove ID: {prof['id']}")
    
    print(f"\n4. REMOVING {len(duplicates_to_remove)} DUPLICATE PROFESSORS...")
    
    for prof_id in duplicates_to_remove:
        try:
            result = supabase.table('professors').delete().eq('id', prof_id).execute()
            print(f"   ✅ Removed duplicate professor: {prof_id}")
        except Exception as e:
            print(f"   ❌ Error removing professor {prof_id}: {e}")
            
except Exception as e:
    print(f"Error in duplicate removal: {e}")

print("\n5. FINAL VERIFICATION...")
try:
    # Check final state
    professors = supabase.table('professors').select('name, department, college_id').execute()
    colleges = supabase.table('colleges').select('id, name').execute()
    
    print(f"   📊 Final count: {len(professors.data)} professors, {len(colleges.data)} colleges")
    
    # Verify no duplicates
    names = [f"{p['name']} ({p['department']})" for p in professors.data]
    unique_names = set(names)
    
    if len(names) == len(unique_names):
        print("   ✅ No duplicate professors found!")
    else:
        print(f"   ⚠️  Still have {len(names) - len(unique_names)} duplicates")
    
    # Show final list
    print("\n   Final professor list:")
    for prof in professors.data:
        print(f"     - {prof['name']} ({prof['department']}) -> {prof['college_id']}")
        
except Exception as e:
    print(f"Error in verification: {e}")

print("\n✅ CLEANUP COMPLETE!")