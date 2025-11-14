"""
Notifications API endpoints
Handles user notifications, read status, and admin broadcasting
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
from ..lib.database import get_supabase, supabase_admin
from ..lib.auth import get_current_user
from ..lib.notification_templates import (
    NotificationTemplate,
    NotificationService,
    TEMPLATES
)

router = APIRouter(tags=["notifications"])


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


class TemplateInfo(BaseModel):
    """Information about a notification template"""
    id: str
    title: str
    message: str
    icon: str
    type: str
    required_fields: List[str]


class TemplateListResponse(BaseModel):
    """Response containing all available templates"""
    templates: List[TemplateInfo]


class BroadcastNotificationRequest(BaseModel):
    # Support both template-based and custom notifications
    template_id: Optional[str] = None  # Template enum name (e.g., "PROFESSOR_TRENDING")
    template_data: Optional[Dict[str, Any]] = None  # Data to fill template placeholders
    
    # Legacy fields for custom notifications
    title: Optional[str] = None
    message: Optional[str] = None
    type: str = "custom"
    metadata: dict = {}


class BroadcastNotificationResponse(BaseModel):
    success: bool
    message: str
    notification_count: int


class SingleUserNotificationRequest(BaseModel):
    """Request to send notification to a specific user"""
    user_id: str
    template_id: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    title: Optional[str] = None
    message: Optional[str] = None
    type: str = "custom"
    metadata: dict = {}


@router.get("/templates", response_model=TemplateListResponse)
async def get_notification_templates(current_user = Depends(get_current_user)):
    """
    Get all available notification templates for admin use
    Returns template metadata including required fields
    """
    # Check if user is admin (consistent with moderation.py logic)
    user_email = current_user.get('email', '')
    user_metadata = current_user.get('user_metadata', {}) or {}
    
    is_admin = (
        user_email == 'admin@gmail.com' or
        user_email.endswith('@ratemyprof.in') or
        user_metadata.get('role') == 'admin' or
        user_metadata.get('is_moderator') == True
    )
    
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can access notification templates"
        )
    
    # Get all templates with their info
    templates = []
    for template_id in NotificationTemplate:
        info = NotificationService.get_template_info(template_id)
        templates.append({
            "id": template_id.name,
            "title": info["title"],
            "message": info["message"],
            "icon": info["icon"],
            "type": info["type"],
            "required_fields": info["required_fields"]
        })
    
    return {"templates": templates}


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
    user_id = current_user.get('id')
    
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
    user_id = current_user.get('id')
    
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
    user_id = current_user.get('id')
    
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
    
    # Check if user is admin (consistent with moderation.py logic)
    user_email = current_user.get('email', '')
    user_metadata = current_user.get('user_metadata', {}) or {}
    
    is_admin = (
        user_email == 'admin@gmail.com' or
        user_email.endswith('@ratemyprof.in') or
        user_metadata.get('role') == 'admin' or
        user_metadata.get('is_moderator') == True
    )
    
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can broadcast notifications"
        )
    
    # Determine if using template or custom message
    title = notification.title
    message = notification.message
    notification_type = notification.type
    
    if notification.template_id:
        # Template-based notification
        try:
            template_enum = NotificationTemplate[notification.template_id]
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid template_id: {notification.template_id}"
            )
        
        # Render template with provided data
        rendered = NotificationService.render_template(
            template_enum,
            notification.template_data or {}
        )
        
        title = rendered["title"]
        message = rendered["message"]
        notification_type = rendered["type"]
    else:
        # Custom notification - require title and message
        if not title or not message:
            raise HTTPException(
                status_code=400,
                detail="Either template_id or both title and message must be provided"
            )
    
    # Call the database function to create notifications for all users
    try:
        result = supabase.rpc(
            'create_broadcast_notification',
            {
                'p_title': title,
                'p_message': message,
                'p_type': notification_type,
                'p_metadata': notification.metadata
            }
        ).execute()
        
        notification_count = result.data if result.data else 0
        
        return {
            "success": True,
            "message": f"Notification sent to {notification_count} users",
            "notification_count": notification_count,
            "template_used": notification.template_id is not None
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to broadcast notification: {str(e)}"
        )


@router.post("/send-to-user", response_model=BroadcastNotificationResponse)
async def send_notification_to_user(
    notification: SingleUserNotificationRequest,
    current_user = Depends(get_current_user)
):
    """
    Admin only: Send notification to a specific user
    """
    supabase = get_supabase()
    
    # Check if user is admin
    user_email = current_user.get('email', '')
    user_metadata = current_user.get('user_metadata', {}) or {}
    
    is_admin = (
        user_email == 'admin@gmail.com' or
        user_email.endswith('@ratemyprof.in') or
        user_metadata.get('role') == 'admin' or
        user_metadata.get('is_moderator') == True
    )
    
    if not is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can send notifications"
        )
    
    # Determine if using template or custom message
    title = notification.title
    message = notification.message
    notification_type = notification.type
    
    if notification.template_id:
        # Template-based notification
        try:
            template_enum = NotificationTemplate[notification.template_id]
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid template_id: {notification.template_id}"
            )
        
        # Render template with provided data
        rendered = NotificationService.render_template(
            template_enum,
            notification.template_data or {}
        )
        
        title = rendered["title"]
        message = rendered["message"]
        notification_type = rendered["type"]
    else:
        # Custom notification - require title and message
        if not title or not message:
            raise HTTPException(
                status_code=400,
                detail="Either template_id or both title and message must be provided"
            )
    
    # Insert notification for specific user using admin client
    try:
        # Use service role client to bypass RLS
        admin_client = supabase_admin if supabase_admin else supabase
        
        result = admin_client.table("notifications").insert({
            "user_id": notification.user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "metadata": notification.metadata,
            "is_read": False,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(days=4)).isoformat()
        }).execute()
        
        if result.data:
            return {
                "success": True,
                "message": f"Notification sent to user {notification.user_id}",
                "notification_count": 1
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to create notification"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send notification: {str(e)}"
        )


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    """Delete a notification (user can delete their own, admin can delete any)"""
    supabase = get_supabase()
    user_id = current_user.get('id')
    
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
    
    # Check if user is admin (consistent with moderation.py logic)
    user_email = current_user.get('email', '')
    user_metadata = current_user.get('user_metadata', {}) or {}
    
    is_admin = (
        user_email == 'admin@gmail.com' or
        user_email.endswith('@ratemyprof.in') or
        user_metadata.get('role') == 'admin' or
        user_metadata.get('is_moderator') == True
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

