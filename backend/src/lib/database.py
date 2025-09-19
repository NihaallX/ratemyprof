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
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
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
    """Get Supabase client instance.
    
    Returns:
        Client: Supabase client for database and auth operations
    """
    return supabase


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
