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


def get_supabase_with_token(token: str) -> Client:
    """Get Supabase client authenticated with user's JWT token.
    
    Args:
        token: User's JWT access token
        
    Returns:
        Client: Authenticated Supabase client for user-specific operations
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("Supabase configuration missing")
    
    # Create a new client with the user's token
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Set the auth header directly on the client's headers
    # This ensures all subsequent requests include the user's JWT
    print(f"🔑 Setting JWT token on client (length: {len(token)})")
    print(f"🔑 Token preview: {token[:50]}..." if len(token) > 50 else f"🔑 Token: {token}")
    client.postgrest.auth(token)
    
    # Verify the auth header was set
    print(f"🔑 Client auth headers: {client.postgrest.session.headers.get('Authorization', 'NOT SET')[:80]}...")
    
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
