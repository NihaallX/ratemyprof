#!/usr/bin/env python3

import sys
sys.path.append('src')

from lib.database import get_supabase

def check_colleges():
    client = get_supabase()
    
    print("=== COLLEGES IN DATABASE ===")
    result = client.table('colleges').select('*').execute()
    
    print(f"Total colleges: {len(result.data)}")
    print()
    
    for college in result.data:
        print(f"ID: {college['id']}")
        print(f"Name: {college['name']}")
        print(f"Type: {college['college_type']}")
        print(f"Location: {college['location']}")
        print(f"Description: {college.get('description', 'N/A')}")
        print("-" * 50)

if __name__ == "__main__":
    check_colleges()