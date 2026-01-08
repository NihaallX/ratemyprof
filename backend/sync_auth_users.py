"""
Sync users from Supabase Auth (auth.users) to application users table (public.users)
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client with service role
client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

print("=== SYNCING AUTH USERS TO APPLICATION USERS TABLE ===\n")

# Get all auth users
auth_users = client.auth.admin.list_users()
print(f"Found {len(auth_users)} users in auth.users")

# Prepare user records for insertion
user_records = []
for auth_user in auth_users:
    user_record = {
        "id": str(auth_user.id),
        "email": auth_user.email,
        "password_hash": "oauth_user",  # Placeholder for OAuth users (password managed by Supabase Auth)
        "role": "student",  # Default role
        "created_at": auth_user.created_at.isoformat() if auth_user.created_at else None
    }
    user_records.append(user_record)

# Insert into public.users table (upsert to avoid conflicts)
if user_records:
    result = client.table("users").upsert(
        user_records,
        on_conflict="id"
    ).execute()
    
    print(f"\nSuccessfully synced {len(result.data)} users to public.users table")
    print("\nSample users:")
    for user in result.data[:5]:
        print(f"  - {user['email']} ({user['id']})")
else:
    print("No users to sync")

# Verify sync
verify_result = client.table("users").select("id").execute()
print(f"\nVerification: public.users now has {len(verify_result.data)} users")
