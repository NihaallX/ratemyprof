"""User rate limit API routes for RateMyProf backend.

Provides endpoints for users to check their current rate limit status.
"""
from fastapi import APIRouter, Depends
from supabase import Client

from src.lib.database import get_supabase
from src.lib.auth import get_current_user
from src.lib.rate_limiting_supabase import get_all_user_limits, get_remaining_actions

router = APIRouter()


@router.get("/limits")
async def get_user_rate_limits(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get all rate limit information for the current user.
    
    Returns current usage and remaining actions for all rate-limited activities.
    """
    return get_all_user_limits(supabase, current_user['id'])


@router.get("/limits/{action_type}")
async def get_specific_rate_limit(
    action_type: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get rate limit information for a specific action type.
    
    Args:
        action_type: Type of action (professor_create, review_create, etc.)
    """
    return get_remaining_actions(supabase, current_user['id'], action_type)