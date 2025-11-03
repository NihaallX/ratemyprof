"""Authentication utilities for RateMyProf backend using Supabase Auth.

Provides Supabase authentication integration, user management, and session handling
for securing API endpoints and managing user authentication flows.
"""
import os
import jwt
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client

from src.lib.database import get_supabase, get_supabase_with_token
from src.config.security import SECRET_KEY, ALGORITHM, ADMIN_USERNAME

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)


class AuthError(HTTPException):
    """Custom authentication error."""
    
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user_from_token(supabase: Client, access_token: str) -> Optional[Dict[str, Any]]:
    """Get user information from Supabase access token or admin token.
    
    Args:
        supabase: Supabase client instance
        access_token: JWT access token from Supabase Auth or admin token
        
    Returns:
        dict: User information from Supabase or admin user, or None if invalid token
    """
    # First, try to verify as admin token
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username == ADMIN_USERNAME:
            print(f"✅ Admin token verified for: {username}")
            return {
                "id": "admin-user-id",
                "email": username,
                "username": username,
                "email_confirmed": True,
                "created_at": "2025-01-01T00:00:00Z",
                "updated_at": "2025-01-01T00:00:00Z",
                "user_metadata": {"role": "admin"},
                "app_metadata": {"role": "admin"},
            }
    except jwt.ExpiredSignatureError:
        print("⚠️ Admin token expired")
        return None
    except jwt.PyJWTError as e:
        # Not an admin token, continue to Supabase verification
        print(f"⚠️ Not an admin token (JWT error): {str(e)[:100]}")
        pass
    except Exception as e:
        # Any other error with admin token, continue to Supabase
        print(f"⚠️ Admin token parse error: {str(e)[:100]}")
        pass
    
    # Try Supabase token verification
    try:
        print(f"🔍 Attempting Supabase token verification...")
        # Get current user directly without setting session
        user_response = supabase.auth.get_user(access_token)
        
        if user_response.user:
            user_email = user_response.user.email
            email_confirmed = user_response.user.email_confirmed_at is not None
            
            print(f"✅ Supabase user found: {user_email}, email_confirmed_at: {user_response.user.email_confirmed_at}")
            
            # Force email_confirmed = True for admin users
            if user_email == 'admin@gmail.com' or user_email.endswith('@ratemyprof.in'):
                email_confirmed = True
                print(f"🔧 Forcing email_confirmed=True for admin: {user_email}")
            
            return {
                "id": user_response.user.id,
                "email": user_email,
                "email_confirmed": email_confirmed,
                "created_at": user_response.user.created_at,
                "updated_at": user_response.user.updated_at,
                "user_metadata": user_response.user.user_metadata or {},
                "app_metadata": user_response.user.app_metadata or {},
            }
        print(f"❌ Supabase returned no user")
        return None
    except Exception as e:
        # Log the actual error for debugging
        print(f"❌ Supabase token verification failed: {str(e)}")
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    supabase: Client = Depends(get_supabase)
) -> Dict[str, Any]:
    """Get current authenticated user from Supabase JWT token.
    
    Args:
        credentials: HTTP Bearer token credentials
        supabase: Supabase client instance
        
    Returns:
        dict: Current authenticated user information
        
    Raises:
        AuthError: If token is invalid or user not found
    """
    if not credentials:
        raise AuthError("Authorization header missing")
    
    token = credentials.credentials
    
    user = get_user_from_token(supabase, token)
    if user is None:
        raise AuthError("Invalid token or user not found")
    
    # Check if user is admin (admins bypass email verification)
    user_email = user.get('email', '')
    user_metadata = user.get('user_metadata', {}) or {}
    is_admin = (
        user_email == 'admin@gmail.com' or
        user_email.endswith('@ratemyprof.in') or
        user_metadata.get('role') == 'admin' or
        user_metadata.get('is_moderator') == True
    )
    
    # Require email confirmation for non-admin users only
    if not is_admin and not user.get("email_confirmed", False):
        raise AuthError("Email not verified")
    
    return user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    supabase: Client = Depends(get_supabase)
) -> Optional[Dict[str, Any]]:
    """Get current user if token is provided and valid.
    
    Args:
        credentials: Optional HTTP Bearer token credentials
        supabase: Supabase client instance
        
    Returns:
        dict or None: Current user information, or None if no valid token
    """
    if not credentials:
        return None
    
    try:
        user = get_user_from_token(supabase, credentials.credentials)
        return user
    except Exception:
        return None


async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get current active user (convenience dependency).
    
    Args:
        current_user: Current user from get_current_user
        
    Returns:
        dict: Current active user
    """
    # All Supabase users are considered active by default
    # Additional business logic can be added here if needed
    return current_user


async def get_current_verified_user(
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get current verified user (can submit reviews).
    
    Args:
        current_user: Current user from get_current_active_user
        
    Returns:
        dict: Current verified user
        
    Raises:
        AuthError: If user is not verified
    """
    if not current_user.get("email_confirmed", False):
        raise AuthError("User email is not verified")
    
    return current_user


async def get_authenticated_supabase(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Client:
    """Get Supabase client authenticated with the current user's JWT token.
    
    This is required for RLS policies to work correctly - the client needs
    the user's JWT token so that auth.uid() returns the correct user ID.
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        Client: Authenticated Supabase client
        
    Raises:
        AuthError: If token is missing or invalid
    """
    if not credentials:
        raise AuthError("Authorization header missing")
    
    token = credentials.credentials
    
    # Verify token is valid by getting user first
    anon_supabase = get_supabase()
    user = get_user_from_token(anon_supabase, token)
    if user is None:
        raise AuthError("Invalid token or user not found")
    
    # Return authenticated client with JWT token
    return get_supabase_with_token(token)


def create_auth_response(auth_response) -> dict:
    """Create standardized auth response from Supabase auth response.
    
    Args:
        auth_response: Response from Supabase auth operation
        
    Returns:
        dict: Standardized auth response
    """
    if not auth_response.user or not auth_response.session:
        raise AuthError("Authentication failed")
    
    return {
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
        "expires_in": auth_response.session.expires_in,
        "token_type": "bearer",
        "user": {
            "id": auth_response.user.id,
            "email": auth_response.user.email,
            "email_confirmed": auth_response.user.email_confirmed_at is not None,
            "created_at": auth_response.user.created_at,
            "user_metadata": auth_response.user.user_metadata,
        }
    }
