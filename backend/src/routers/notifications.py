"""
Notifications API endpoints
Handles user notifications, read status, and admin broadcasting
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from ..lib.database import get_supabase
from ..lib.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


# Pydantic Models
class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    expires_at: datetime
    metadata: dict = {}


class NotificationsListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total_count: int
    unread_count: int


class BroadcastNotificationRequest(BaseModel):
    title: str
    message: str
    type: str = "custom"
    metadata: dict = {}


class BroadcastNotificationResponse(BaseModel):
    success: bool
    message: str
    notification_count: int


@router.get("", response_model=NotificationsListResponse)
async def get_user_notifications(
    limit: int = Query(default=3, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    include_read: bool = Query(default=True),
    current_user = Depends(get_current_user)
):
    """
    Get user's notifications (most recent 3 by default)
    Auto-filters out expired notifications
    """
    supabase = get_supabase()
    user_id = current_user.id
    
    # Build query
    query = supabase.table("notifications").select("*", count="exact")
    query = query.eq("user_id", user_id)
    query = query.gte("expires_at", datetime.utcnow().isoformat())
    
    if not include_read:
        query = query.eq("is_read", False)
    
    # Get total count
    total_response = query.execute()
    total_count = total_response.count if hasattr(total_response, 'count') else len(total_response.data)
    
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
        .gte("expires_at", datetime.utcnow().isoformat())\
        .execute()
    
    unread_count = unread_response.count if hasattr(unread_response, 'count') else len(unread_response.data)
    
    return {
        "notifications": notifications,
        "total_count": total_count,
        "unread_count": unread_count
    }


@router.post("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    """Mark a single notification as read"""
    supabase = get_supabase()
    user_id = current_user.id
    
    # Verify notification belongs to user and update
    response = supabase.table("notifications")\
        .update({"is_read": True})\
        .eq("id", notification_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True, "message": "Notification marked as read"}


@router.post("/read-all")
async def mark_all_notifications_as_read(
    current_user = Depends(get_current_user)
):
    """Mark all user's notifications as read"""
    supabase = get_supabase()
    user_id = current_user.id
    
    response = supabase.table("notifications")\
        .update({"is_read": True})\
        .eq("user_id", user_id)\
        .eq("is_read", False)\
        .execute()
    
    count = len(response.data) if response.data else 0
    
    return {
        "success": True,
        "message": f"Marked {count} notifications as read",
        "count": count
    }


@router.post("/broadcast", response_model=BroadcastNotificationResponse)
async def broadcast_notification(
    notification: BroadcastNotificationRequest,
    current_user = Depends(get_current_user)
):
    """
    Admin only: Send custom notification to all users
    """
    supabase = get_supabase()
    
    # Check if user is admin
    user_email = current_user.email
    user_metadata = getattr(current_user, 'user_metadata', {}) or {}
    is_admin = (
        user_email and user_email.endswith('@ratemyprof.in') or
        user_metadata.get('role') == 'admin'
    )
    
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can broadcast notifications"
        )
    
    # Call the database function to create notifications for all users
    try:
        result = supabase.rpc(
            'create_broadcast_notification',
            {
                'p_title': notification.title,
                'p_message': notification.message,
                'p_type': notification.type,
                'p_metadata': notification.metadata
            }
        ).execute()
        
        notification_count = result.data if result.data else 0
        
        return {
            "success": True,
            "message": f"Notification sent to {notification_count} users",
            "notification_count": notification_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to broadcast notification: {str(e)}"
        )


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    """Delete a notification (user can delete their own, admin can delete any)"""
    supabase = get_supabase()
    user_id = current_user.id
    
    # Try to delete (RLS will handle permissions)
    response = supabase.table("notifications")\
        .delete()\
        .eq("id", notification_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True, "message": "Notification deleted"}


@router.post("/cleanup-expired")
async def cleanup_expired_notifications(
    current_user = Depends(get_current_user)
):
    """
    Admin only: Manually trigger cleanup of expired notifications
    (Usually runs automatically via cron)
    """
    supabase = get_supabase()
    
    # Check if user is admin
    user_email = current_user.email
    user_metadata = getattr(current_user, 'user_metadata', {}) or {}
    is_admin = (
        user_email and user_email.endswith('@ratemyprof.in') or
        user_metadata.get('role') == 'admin'
    )
    
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can trigger cleanup"
        )
    
    try:
        result = supabase.rpc('cleanup_expired_notifications').execute()
        deleted_count = result.data if result.data else 0
        
        return {
            "success": True,
            "message": f"Cleaned up {deleted_count} expired notifications",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cleanup notifications: {str(e)}"
        )
