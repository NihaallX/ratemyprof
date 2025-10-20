import sys
from src.lib.database import get_supabase_admin

print("Checking review_author_mappings table...")
try:
    sb = get_supabase_admin()
    if not sb:
        print("ERROR: Admin client is None!")
        sys.exit(1)
    
    result = sb.table('review_author_mappings').select('*').limit(1).execute()
    print(f"✓ Table exists")
    print(f"✓ Record count: {len(result.data)}")
    
    if result.data:
        print(f"✓ Columns: {list(result.data[0].keys())}")
    else:
        print("  No data in table yet")
        
    print("\nTable is accessible!")
except Exception as e:
    print(f"ERROR: {e}")
    print(f"Error type: {type(e).__name__}")
    sys.exit(1)
