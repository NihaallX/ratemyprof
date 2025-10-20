"""Rate limiting utilities for Supabase-based RateMyProf platform.

Provides functions to check and enforce rate limits for user actions using Supabase.
"""
from datetime import date, datetime
from typing import Optional
from fastapi import HTTPException, status, Request
from supabase import Client


# Rate limiting constants
DAILY_LIMITS = {
    'professor_create': 3,
    'review_create': 10,  # Future use
    'college_review_create': 5,  # Future use
    'flag_create': 20,  # Future use
}


def check_rate_limit(
    supabase: Client, 
    user_id: str, 
    action_type: str, 
    request: Optional[Request] = None
) -> None:
    """Check if user has exceeded rate limit for specific action.
    
    Args:
        supabase: Supabase client
        user_id: User UUID
        action_type: Type of action to check
        request: Optional FastAPI request object for IP tracking
        
    Raises:
        HTTPException: If rate limit is exceeded
    """
    # Get the limit for this action type
    limit = DAILY_LIMITS.get(action_type)
    if limit is None:
        # No limit defined for this action type
        return
    
    # Check current daily count
    current_count = get_daily_count(supabase, user_id, action_type)
    
    if current_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily limit exceeded. You can only perform {limit} {action_type.replace('_', ' ')} actions per day. Current count: {current_count}. Please try again tomorrow."
        )


def get_daily_count(supabase: Client, user_id: str, action_type: str, target_date: Optional[date] = None) -> int:
    """Get count of actions performed by user on specific date.
    
    Args:
        supabase: Supabase client
        user_id: User UUID
        action_type: Type of action to count
        target_date: Date to check (defaults to today)
        
    Returns:
        Number of actions performed on the date
    """
    if target_date is None:
        target_date = date.today()
    
    try:
        result = supabase.table('user_activities').select('action_count').eq(
            'user_id', user_id
        ).eq(
            'action_type', action_type
        ).eq(
            'action_date', target_date.isoformat()
        ).single().execute()
        
        return result.data['action_count'] if result.data else 0
    except Exception:
        # No record found or error - assume 0 count
        return 0


def increment_action_count(
    supabase: Client,
    user_id: str,
    action_type: str,
    target_id: Optional[str] = None,
    request: Optional[Request] = None
) -> dict:
    """Increment the action count for a user.
    
    Args:
        supabase: Supabase client
        user_id: User UUID
        action_type: Type of action performed
        target_id: Optional ID of target object (professor_id, etc.)
        request: Optional FastAPI request object for IP tracking
        
    Returns:
        UserActivity record
    """
    today = date.today()
    now = datetime.utcnow()
    
    # Get IP address from request if available
    ip_address = None
    if request:
        # Try to get real IP from headers (in case of proxy/load balancer)
        ip_address = (
            request.headers.get("x-forwarded-for") or
            request.headers.get("x-real-ip") or
            getattr(request.client, "host", None) if hasattr(request, "client") else None
        )
    
    try:
        # Try to get existing record for today
        existing = supabase.table('user_activities').select('*').eq(
            'user_id', user_id
        ).eq(
            'action_type', action_type
        ).eq(
            'action_date', today.isoformat()
        ).single().execute()
        
        if existing.data:
            # Update existing record
            updated = supabase.table('user_activities').update({
                'action_count': existing.data['action_count'] + 1,
                'last_action_at': now.isoformat(),
                'target_id': target_id,
                'ip_address': ip_address,
                'updated_at': now.isoformat()
            }).eq('id', existing.data['id']).execute()
            
            return updated.data[0] if updated.data else existing.data
            
    except Exception:
        # No existing record found, create new one
        pass
    
    # Create new record
    new_activity = {
        'user_id': user_id,
        'action_type': action_type,
        'action_date': today.isoformat(),
        'action_count': 1,
        'last_action_at': now.isoformat(),
        'target_id': target_id,
        'ip_address': ip_address,
        'created_at': now.isoformat(),
        'updated_at': now.isoformat()
    }
    
    result = supabase.table('user_activities').insert(new_activity).execute()
    return result.data[0] if result.data else new_activity


def get_remaining_actions(
    supabase: Client,
    user_id: str,
    action_type: str
) -> dict:
    """Get remaining actions for user for today.
    
    Args:
        supabase: Supabase client
        user_id: User UUID
        action_type: Type of action to check
        
    Returns:
        Dict with current count, limit, and remaining actions
    """
    limit = DAILY_LIMITS.get(action_type, 0)
    current_count = get_daily_count(supabase, user_id, action_type)
    remaining = max(0, limit - current_count)
    
    return {
        "action_type": action_type,
        "current_count": current_count,
        "daily_limit": limit,
        "remaining": remaining,
        "date": date.today().isoformat()
    }


def get_all_user_limits(supabase: Client, user_id: str) -> dict:
    """Get all rate limit information for a user.
    
    Args:
        supabase: Supabase client
        user_id: User UUID
        
    Returns:
        Dict with all action limits and current counts
    """
    result = {}
    
    for action_type in DAILY_LIMITS.keys():
        result[action_type] = get_remaining_actions(supabase, user_id, action_type)
    
    return {
        "user_id": user_id,
        "date": date.today().isoformat(),
        "limits": result
    }