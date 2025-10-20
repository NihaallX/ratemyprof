"""Rate limiting utilities for RateMyProf platform.

Provides functions to check and enforce rate limits for user actions.
"""
from datetime import date
from typing import Optional
from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session

from src.models.user_activity import UserActivity, DAILY_LIMITS


def check_rate_limit(
    session: Session, 
    user_id: str, 
    action_type: str, 
    request: Optional[Request] = None
) -> None:
    """Check if user has exceeded rate limit for specific action.
    
    Args:
        session: Database session
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
    current_count = UserActivity.get_daily_count(session, user_id, action_type)
    
    if current_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily limit exceeded. You can only perform {limit} {action_type.replace('_', ' ')} actions per day. Current count: {current_count}"
        )


def increment_action_count(
    session: Session,
    user_id: str,
    action_type: str,
    target_id: Optional[str] = None,
    request: Optional[Request] = None
) -> UserActivity:
    """Increment the action count for a user.
    
    Args:
        session: Database session
        user_id: User UUID
        action_type: Type of action performed
        target_id: Optional ID of target object (professor_id, etc.)
        request: Optional FastAPI request object for IP tracking
        
    Returns:
        UserActivity record
    """
    # Get IP address from request if available
    ip_address = None
    if request:
        # Try to get real IP from headers (in case of proxy/load balancer)
        ip_address = (
            request.headers.get("x-forwarded-for") or
            request.headers.get("x-real-ip") or
            getattr(request.client, "host", None) if hasattr(request, "client") else None
        )
    
    return UserActivity.increment_daily_count(
        session, user_id, action_type, target_id, ip_address
    )


def get_remaining_actions(
    session: Session,
    user_id: str,
    action_type: str
) -> dict:
    """Get remaining actions for user for today.
    
    Args:
        session: Database session
        user_id: User UUID
        action_type: Type of action to check
        
    Returns:
        Dict with current count, limit, and remaining actions
    """
    limit = DAILY_LIMITS.get(action_type, 0)
    current_count = UserActivity.get_daily_count(session, user_id, action_type)
    remaining = max(0, limit - current_count)
    
    return {
        "action_type": action_type,
        "current_count": current_count,
        "daily_limit": limit,
        "remaining": remaining,
        "date": date.today().isoformat()
    }


def get_all_user_limits(session: Session, user_id: str) -> dict:
    """Get all rate limit information for a user.
    
    Args:
        session: Database session
        user_id: User UUID
        
    Returns:
        Dict with all action limits and current counts
    """
    result = {}
    
    for action_type in DAILY_LIMITS.keys():
        result[action_type] = get_remaining_actions(session, user_id, action_type)
    
    return {
        "user_id": user_id,
        "date": date.today().isoformat(),
        "limits": result
    }