"""
Notification API Router - Simplified CRUD
Handles basic notification operations without event system.

This router handles:
- Reading user notifications (from notifications table)
- Marking notifications as read
- Admin broadcast capabilities (direct database operations)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from ..lib.database import get_supabase, get_supabase_service
from ..lib.auth import get_current_user

router = APIRouter(tags=["notifications"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class NotificationResponse(BaseModel):
    """Single notification response"""
    id: str
    title: str
    body: str
    category: str
    priority: int
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime
    metadata: dict = {}


class NotificationsListResponse(BaseModel):
    """List of notifications with counts"""
    notifications: List[NotificationResponse]
    total_count: int
    unread_count: int


class MarkReadRequest(BaseModel):
    """Request to mark notification(s) as read"""
    notification_ids: Optional[List[str]] = None  # If None, mark all as read


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def check_admin(current_user: dict) -> bool:
    """Check if user is admin/moderator"""
    user_email = current_user.get('email', '')
    user_metadata = current_user.get('user_metadata', {}) or {}
    
    return (
        user_email == 'admin@gmail.com' or
        user_email.endswith('@ratemyprof.in') or
        user_metadata.get('role') == 'admin' or
        user_metadata.get('is_moderator') == True
    )


# ============================================================================
# USER NOTIFICATION ENDPOINTS
# ============================================================================

@router.get("", response_model=NotificationsListResponse)
async def get_user_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    include_read: bool = Query(default=True),
    category: Optional[str] = Query(default=None),
    current_user = Depends(get_current_user)
):
    """
    Get user's notifications with pagination.
    
    Query params:
    - limit: Max notifications to return (default 20, max 100)
    - offset: Pagination offset
    - include_read: Include read notifications (default true)
    - category: Filter by category (engagement, achievement, moderation, digest)
    """
    supabase = get_supabase_service()
    user_id = current_user.get('id')
    
    # Build query
    query = supabase.table("notifications").select("*", count="exact")
    query = query.eq("user_id", user_id)
    
    if not include_read:
        query = query.eq("is_read", False)
    
    if category:
        query = query.eq("category", category)
    
    # Get total count first
    count_response = query.execute()
    total_count = count_response.count if hasattr(count_response, 'count') else len(count_response.data or [])
    
    # Get paginated results
    query = query.order("created_at", desc=True)
    query = query.limit(limit).offset(offset)
    
    response = query.execute()
    notifications = response.data if response.data else []
    
    # Get unread count separately
    unread_response = supabase.table("notifications")\
        .select("id", count="exact")\
        .eq("user_id", user_id)\
        .eq("is_read", False)\
        .execute()
    
    unread_count = unread_response.count if hasattr(unread_response, 'count') else len(unread_response.data or [])
    
    return {
        "notifications": notifications,
        "total_count": total_count,
        "unread_count": unread_count
    }


@router.get("/unread-count")
async def get_unread_count(current_user = Depends(get_current_user)):
    """Get count of unread notifications (fast endpoint for badges)"""
    supabase = get_supabase_service()
    user_id = current_user.get('id')
    
    response = supabase.table("notifications")\
        .select("id", count="exact")\
        .eq("user_id", user_id)\
        .eq("is_read", False)\
        .execute()
    
    count = response.count if hasattr(response, 'count') else len(response.data or [])
    
    return {"unread_count": count}


@router.post("/mark-read")
async def mark_notifications_read(
    request: MarkReadRequest,
    current_user = Depends(get_current_user)
):
    """
    Mark notifications as read.
    
    - If notification_ids provided: mark those specific notifications
    - If notification_ids is null/empty: mark ALL unread notifications
    """
    supabase = get_supabase_service()
    user_id = current_user.get('id')
    
    if request.notification_ids and len(request.notification_ids) > 0:
        # Mark specific notifications
        response = supabase.table("notifications")\
            .update({"is_read": True, "read_at": datetime.utcnow().isoformat()})\
            .eq("user_id", user_id)\
            .in_("id", request.notification_ids)\
            .execute()
    else:
        # Mark all unread
        response = supabase.table("notifications")\
            .update({"is_read": True, "read_at": datetime.utcnow().isoformat()})\
            .eq("user_id", user_id)\
            .eq("is_read", False)\
            .execute()
    
    count = len(response.data) if response.data else 0
    
    return {
        "success": True,
        "message": f"Marked {count} notification(s) as read",
        "count": count
    }


@router.patch("/{notification_id}/read")
async def mark_single_notification_read(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    """Mark a single notification as read"""
    supabase = get_supabase_service()
    user_id = current_user.get('id')
    
    response = supabase.table("notifications")\
        .update({"is_read": True, "read_at": datetime.utcnow().isoformat()})\
        .eq("id", notification_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {
        "success": True,
        "message": "Notification marked as read"
    }


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    """Delete a specific notification (soft delete)"""
    supabase = get_supabase_service()
    user_id = current_user.get('id')
    
    response = supabase.table("notifications")\
        .delete()\
        .eq("id", notification_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True, "message": "Notification deleted"}


# ============================================================================
# ADMIN ENDPOINTS - BROADCASTING
# ============================================================================

@router.post("/admin/broadcast")
async def broadcast_notification(
    title: str,
    body: str,
    category: str = "custom",
    action_url: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    current_user = Depends(get_current_user)
):
    """
    Admin only: Broadcast custom notification to all users.
    Creates notifications directly in the database.
    """
    if not check_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    supabase = get_supabase_service()
    
    try:
        # Get all user IDs
        users_response = supabase.table("users").select("id").execute()
        user_ids = [user["id"] for user in (users_response.data or [])]
        
        if not user_ids:
            return {
                "success": True,
                "message": "No users found",
                "notification_count": 0
            }
        
        # Create notifications for all users
        notifications = []
        for user_id in user_ids:
            notifications.append({
                "user_id": user_id,
                "title": title,
                "body": body,
                "category": category,
                "action_url": action_url,
                "priority": 1,  # High priority for broadcasts
                "is_read": False,
                "metadata": metadata or {},
                "created_at": datetime.utcnow().isoformat()
            })
        
        # Batch insert
        result = supabase.table("notifications").insert(notifications).execute()
        
        count = len(result.data) if result.data else 0
        
        return {
            "success": True,
            "message": f"Broadcast sent to {count} users",
            "notification_count": count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to broadcast notification: {str(e)}"
        )


@router.post("/admin/send-to-user")
async def send_to_specific_user(
    user_id: str,
    title: str,
    body: str,
    category: str = "custom",
    action_url: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    current_user = Depends(get_current_user)
):
    """
    Admin only: Send notification to a specific user.
    Creates notification directly.
    """
    if not check_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    supabase = get_supabase_service()
    
    try:
        result = supabase.table("notifications").insert({
            "user_id": user_id,
            "title": title,
            "body": body,
            "category": category,
            "action_url": action_url,
            "priority": 1,
            "is_read": False,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        if result.data:
            return {
                "success": True,
                "message": f"Notification sent to user {user_id}",
                "notification_id": result.data[0]["id"]
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create notification")
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send notification: {str(e)}"
        )


# ============================================================================
# ADMIN UTILITIES
# ============================================================================

@router.delete("/admin/delete-all")
async def delete_all_notifications(current_user = Depends(get_current_user)):
    """
    Admin only: Delete ALL notifications (for testing/cleanup).
    WARNING: Destructive operation!
    """
    if not check_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    supabase = get_supabase_service()
    
    try:
        # Delete all notifications
        result = supabase.table("notifications")\
            .delete()\
            .neq("id", "00000000-0000-0000-0000-000000000000")\
            .execute()
        
        count = len(result.data) if result.data else 0
        
        return {
            "success": True,
            "message": f"Deleted {count} notifications",
            "deleted_count": count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete notifications: {str(e)}"
        )
