"""Database configuration and session management for RateMyProf backend.

This module sets up Supabase client for database operations and authentication,
replacing the custom PostgreSQL + JWT setup with Supabase's integrated solution.
"""
import os
from typing import AsyncGenerator, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Load environment variables
import pathlib
# The .env file is in the backend directory (2 levels up from src/lib/)
backend_env_path = pathlib.Path(__file__).parent.parent.parent / ".env"

# Load from backend directory
if backend_env_path.exists():
    load_dotenv(backend_env_path)
    print(f"✅ Loaded .env from backend directory: {backend_env_path}")
else:
    print(f"⚠️ .env not found at: {backend_env_path}")
    print(f"Current file: {__file__}")
    print(f"Calculated backend path: {backend_env_path}")

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print(f"SUPABASE_URL: {SUPABASE_URL}")
    print(f"SUPABASE_ANON_KEY: {SUPABASE_ANON_KEY}")
    raise ValueError("Missing required Supabase configuration. Please check your .env file.")

# Create Supabase clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Service role client for admin operations (if available)
supabase_admin: Optional[Client] = None
if SUPABASE_SERVICE_ROLE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# For direct SQL operations, we can still use SQLAlchemy with Supabase's PostgreSQL connection
# This allows us to keep our existing models while using Supabase for auth
DATABASE_URL = f"postgresql+asyncpg://postgres:[YOUR-DB-PASSWORD]@db.{SUPABASE_URL.split('//')[1].split('.')[0]}.supabase.co:5432/postgres"

# Note: We'll primarily use Supabase client for auth and simple queries,
# but keep SQLAlchemy for complex relationships and our existing models

# Base class for models (keeping for now, might migrate to Supabase tables later)
Base = declarative_base()


def get_supabase() -> Client:
    """Get Supabase client instance (anon key - for public operations).
    
    Returns:
        Client: Supabase client for database and auth operations
    """
    return supabase


def get_supabase_service() -> Client:
    """Get Supabase service role client for backend operations that bypass RLS.
    
    This should be used for all backend database writes (inserts, updates, deletes)
    where RLS policies should be bypassed since authentication is handled at the
    application layer.
    
    Returns:
        Client: Supabase client with service role key (bypasses RLS)
        
    Raises:
        ValueError: If service role key is not configured
    """
    if not supabase_admin:
        raise ValueError("Service role key not configured")
    return supabase_admin


def get_supabase_with_token(token: str) -> Client:
    """Get Supabase client authenticated with user's JWT token.
    
    Args:
        token: User's JWT access token
        
    Returns:
        Client: Authenticated Supabase client for user-specific operations
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("Supabase configuration missing")
    
    # Debug: Decode JWT to see what role it has
    import base64
    import json
    try:
        # Decode JWT payload (second part)
        parts = token.split('.')
        if len(parts) >= 2:
            # Add padding if needed
            payload = parts[1]
            padding = 4 - len(payload) % 4
            if padding != 4:
                payload += '=' * padding
            decoded = base64.b64decode(payload)
            jwt_data = json.loads(decoded)
            print(f"🔍 JWT DECODED - role: {jwt_data.get('role', 'NONE')}, aud: {jwt_data.get('aud', 'NONE')}")
            print(f"🔍 JWT claims: {list(jwt_data.keys())}")
    except Exception as e:
        print(f"⚠️ Could not decode JWT: {e}")
    
    # Create a new client with the user's token
    # IMPORTANT: We need to set the Authorization header for RLS to work
    print(f"🔑 Setting JWT token on client (length: {len(token)})")
    print(f"🔑 Token preview: {token[:50]}..." if len(token) > 50 else f"🔑 Token: {token}")
    
    # Create a fresh client instance
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Set the JWT token on the postgrest client
    # This is the critical step for RLS to recognize the authenticated user
    client.postgrest.auth(token)
    
    # CRITICAL: Manually set the Authorization header on the session
    # The postgrest.auth() method should do this, but we'll ensure it's set
    client.postgrest.session.headers['Authorization'] = f"Bearer {token}"
    client.postgrest.session.headers['apikey'] = SUPABASE_ANON_KEY
    
    # Verify the auth header was set correctly
    auth_header = client.postgrest.session.headers.get('Authorization', 'NOT SET')
    print(f"🔑 Authorization header set: {auth_header[:80]}...")
    
    if not auth_header.startswith('Bearer ey'):
        print(f"⚠️ ERROR: Authorization header is not properly set!")
        print(f"⚠️ Header value: {auth_header}")
    else:
        print(f"✅ Authorization header correctly set with JWT token")
    
    return client


def get_supabase_admin() -> Optional[Client]:
    """Get Supabase admin client for admin operations.
    
    Returns:
        Client: Supabase admin client with elevated permissions, or None if not configured
    """
    return supabase_admin


async def init_db() -> None:
    """Initialize database tables.
    
    With Supabase, we can create tables through the dashboard or migrations.
    This function is kept for compatibility with existing code.
    """
    print("🔗 Connected to Supabase database")
    print(f"📍 Project URL: {SUPABASE_URL}")
    
    # TODO: We could run SQL migrations here or use Supabase migrations
    # For now, we'll create tables through Supabase dashboard


async def close_db() -> None:
    """Close database connections.
    
    Supabase client connections are handled automatically.
    This function is kept for compatibility.
    """
    print("✅ Supabase connections closed")
