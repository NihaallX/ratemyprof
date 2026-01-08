import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client with service role
client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Query users table
result = client.table("users").select("*").execute()

print(f"=== USERS TABLE ===")
print(f"Total users: {len(result.data)}")
print()

if result.data:
    for user in result.data:
        print(f"ID: {user.get('id')}")
        print(f"Email: {user.get('email')}")
        print(f"Created: {user.get('created_at')}")
        print(f"Role: {user.get('role')}")
        print("-" * 50)
else:
    print("No users found")
