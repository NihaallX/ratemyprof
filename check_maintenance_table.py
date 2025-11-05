#!/usr/bin/env python3
"""Quick script to verify site_settings table exists and test maintenance mode API."""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from backend.src.lib.database import get_supabase


def check_table():
    """Check if site_settings table exists and show current status."""
    
    print("🔍 Checking site_settings table...")
    print("=" * 60)
    
    try:
        supabase = get_supabase()
        
        # Try to query the table
        result = supabase.table('site_settings').select('*').execute()
        
        print("✅ Table 'site_settings' exists!")
        print()
        
        if result.data:
            print("📊 Current settings:")
            for row in result.data:
                print(f"  - {row['setting_key']}: {row['setting_value']}")
                print(f"    Updated: {row.get('updated_at', 'N/A')}")
                print(f"    Updated by: {row.get('updated_by', 'N/A')}")
        else:
            print("⚠️  No settings found in table (this is okay, it will be created on first toggle)")
        
        print()
        print("✅ Database setup complete!")
        print("   You can now use the maintenance mode toggle in admin panel")
        return True
        
    except Exception as e:
        error_msg = str(e)
        if "does not exist" in error_msg.lower() or "not found" in error_msg.lower():
            print("❌ Table 'site_settings' does not exist!")
            print("   Please run the SQL script in Supabase SQL Editor")
            print()
            print("SQL file location: backend/scripts/create_site_settings_table.sql")
        else:
            print(f"❌ Error: {error_msg}")
        return False


if __name__ == "__main__":
    print()
    success = check_table()
    print("=" * 60)
    print()
    
    if success:
        print("🎉 Ready to test! Next steps:")
        print("1. Start your backend: cd backend && uvicorn src.main:app --reload")
        print("2. Open admin panel → Settings tab")
        print("3. Toggle maintenance mode")
        print("4. Check site in incognito window")
    else:
        print("⚠️  Please create the table first")
    print()
