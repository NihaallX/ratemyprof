"""
User communication system for moderation actions.

This module provides notification templates, user communication,
and appeal submission capabilities for the moderation system.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel
from supabase import Client

logger = logging.getLogger(__name__)

class NotificationType(str, Enum):
    """Types of notifications that can be sent to users."""
    REVIEW_APPROVED = "review_approved"
    REVIEW_REJECTED = "review_rejected"
    PROFESSOR_VERIFIED = "professor_verified"
    PROFESSOR_REJECTED = "professor_rejected"
    ACCOUNT_WARNED = "account_warned"
    ACCOUNT_BANNED = "account_banned"
    ACCOUNT_UNBANNED = "account_unbanned"
    FLAG_RESOLVED = "flag_resolved"
    APPEAL_RECEIVED = "appeal_received"
    APPEAL_RESOLVED = "appeal_resolved"

class NotificationTemplate(BaseModel):
    """Template for user notifications."""
    subject: str
    body: str
    action_required: bool = False
    appeal_allowed: bool = False

class AppealRequest(BaseModel):
    """User appeal request model."""
    moderation_action_id: str
    user_id: str
    appeal_reason: str
    additional_info: Optional[str] = None

class UserCommunicationSystem:
    """System for communicating moderation actions to users."""
    
    def __init__(self, supabase: Client):
        """Initialize the communication system."""
        self.supabase = supabase
        self.templates = self._load_notification_templates()
    
    def _load_notification_templates(self) -> Dict[NotificationType, NotificationTemplate]:
        """Load standardized notification templates."""
        return {
            NotificationType.REVIEW_APPROVED: NotificationTemplate(
                subject="Your review has been approved",
                body="""Dear User,

Your review for {professor_name} has been approved and is now visible on our platform.

Thank you for contributing to our community with quality content.

Review Details:
- Professor: {professor_name}
- Course: {course_name}
- Submitted: {created_at}

Best regards,
RateMyProf Moderation Team""",
                action_required=False,
                appeal_allowed=False
            ),
            
            NotificationType.REVIEW_REJECTED: NotificationTemplate(
                subject="Your review has been removed",
                body="""Dear User,

Your review for {professor_name} has been removed due to policy violations.

Reason for removal: {reason}

Our content policy ensures that all reviews are:
- Respectful and constructive
- Free from inappropriate language
- Based on actual academic experience
- Not spam or promotional content

You can submit a new review that follows our guidelines, or appeal this decision if you believe it was made in error.

Review Details:
- Professor: {professor_name}
- Course: {course_name}
- Submitted: {created_at}
- Reason: {reason}

Best regards,
RateMyProf Moderation Team""",
                action_required=False,
                appeal_allowed=True
            ),
            
            NotificationType.PROFESSOR_VERIFIED: NotificationTemplate(
                subject="Professor profile verified",
                body="""Dear User,

The professor profile you submitted has been verified and is now live on our platform.

Thank you for helping expand our database with accurate information.

Professor Details:
- Name: {professor_name}
- Department: {department}
- College: {college_name}
- Submitted: {created_at}

Students can now find and review this professor. Your contribution helps the entire academic community!

Best regards,
RateMyProf Moderation Team""",
                action_required=False,
                appeal_allowed=False
            ),
            
            NotificationType.PROFESSOR_REJECTED: NotificationTemplate(
                subject="Professor profile submission not approved",
                body="""Dear User,

Unfortunately, the professor profile you submitted could not be verified at this time.

Reason: {reason}

Common reasons for rejection include:
- Insufficient or inaccurate information
- Professor not found in college directory
- Duplicate submission
- Missing required details

You're welcome to submit a new profile with corrected information.

Professor Details:
- Name: {professor_name}
- Department: {department}
- College: {college_name}
- Submitted: {created_at}
- Reason: {reason}

Best regards,
RateMyProf Moderation Team""",
                action_required=False,
                appeal_allowed=True
            ),
            
            NotificationType.ACCOUNT_WARNED: NotificationTemplate(
                subject="Account Warning - Action Required",
                body="""Dear User,

Your account has received a warning due to policy violations.

Warning Reason: {reason}
Warning Date: {created_at}
{duration_info}

This warning serves as a reminder to follow our community guidelines:
- Be respectful and constructive in all interactions
- Provide honest, accurate reviews
- Avoid spam, harassment, or inappropriate content
- Respect the academic community

Future violations may result in temporary or permanent account restrictions.

If you believe this warning was issued in error, you can submit an appeal.

Best regards,
RateMyProf Moderation Team""",
                action_required=True,
                appeal_allowed=True
            ),
            
            NotificationType.ACCOUNT_BANNED: NotificationTemplate(
                subject="Account Temporarily Restricted",
                body="""Dear User,

Your account has been temporarily restricted due to repeated policy violations.

Restriction Details:
- Reason: {reason}
- Start Date: {created_at}
- {duration_info}

During this restriction period, you will not be able to:
- Submit new reviews
- Flag content
- Add professor profiles
- Participate in community features

This action was taken to maintain the quality and safety of our platform for all users.

You can appeal this decision if you believe it was made in error.

To prevent future restrictions:
- Review our community guidelines
- Ensure all content follows our policies
- Be respectful in all interactions

Best regards,
RateMyProf Moderation Team""",
                action_required=True,
                appeal_allowed=True
            ),
            
            NotificationType.ACCOUNT_UNBANNED: NotificationTemplate(
                subject="Account Access Restored",
                body="""Dear User,

Your account access has been restored. You can now resume using all platform features.

Restoration Date: {created_at}
Previous Restriction: {reason}

Please ensure that all future activity follows our community guidelines to avoid any restrictions.

Welcome back to RateMyProf!

Best regards,
RateMyProf Moderation Team""",
                action_required=False,
                appeal_allowed=False
            ),
            
            NotificationType.FLAG_RESOLVED: NotificationTemplate(
                subject="Your flag report has been resolved",
                body="""Dear User,

Thank you for reporting content that violated our community guidelines. We have reviewed your report and taken appropriate action.

Report Details:
- Content Type: {content_type}
- Flag Reason: {flag_reason}
- Submitted: {created_at}
- Resolution: {resolution}

Your vigilance helps maintain the quality and safety of our platform for all users.

Best regards,
RateMyProf Moderation Team""",
                action_required=False,
                appeal_allowed=False
            ),
            
            NotificationType.APPEAL_RECEIVED: NotificationTemplate(
                subject="Appeal Request Received",
                body="""Dear User,

We have received your appeal request and will review it thoroughly.

Appeal Details:
- Appeal ID: {appeal_id}
- Original Action: {original_action}
- Submitted: {created_at}

Our moderation team will review your appeal within 2-3 business days. You will receive a notification once a decision has been made.

Thank you for your patience.

Best regards,
RateMyProf Moderation Team""",
                action_required=False,
                appeal_allowed=False
            ),
            
            NotificationType.APPEAL_RESOLVED: NotificationTemplate(
                subject="Appeal Decision - {appeal_status}",
                body="""Dear User,

Your appeal has been reviewed and a decision has been made.

Appeal Details:
- Appeal ID: {appeal_id}
- Original Action: {original_action}
- Decision: {appeal_status}
- Review Date: {created_at}

{resolution_details}

If you have questions about this decision, please contact our support team.

Best regards,
RateMyProf Moderation Team""",
                action_required=False,
                appeal_allowed=False
            )
        }
    
    async def send_notification(
        self, 
        user_id: str, 
        notification_type: NotificationType, 
        context_data: Dict[str, Any]
    ) -> bool:
        """
        Send a notification to a user.
        
        Args:
            user_id: ID of the user to notify
            notification_type: Type of notification to send
            context_data: Data to populate the template
            
        Returns:
            Boolean indicating if notification was sent successfully
        """
        try:
            template = self.templates.get(notification_type)
            if not template:
                logger.error(f"No template found for notification type: {notification_type}")
                return False
            
            # Format the template with context data
            subject = template.subject.format(**context_data)
            body = template.body.format(**context_data)
            
            # Store notification in database
            notification_data = {
                'user_id': user_id,
                'notification_type': notification_type.value,
                'subject': subject,
                'body': body,
                'action_required': template.action_required,
                'appeal_allowed': template.appeal_allowed,
                'read': False,
                'created_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('user_notifications').insert(notification_data).execute()
            
            if result.data:
                logger.info(f"Notification sent to user {user_id}: {notification_type.value}")
                return True
            else:
                logger.error(f"Failed to store notification for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending notification to user {user_id}: {str(e)}")
            return False
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get notifications for a user.
        
        Args:
            user_id: ID of the user
            unread_only: Whether to return only unread notifications
            limit: Maximum number of notifications to return
            
        Returns:
            List of notification dictionaries
        """
        try:
            query = self.supabase.table('user_notifications').select(
                'id, notification_type, subject, body, action_required, '
                'appeal_allowed, read, created_at'
            ).eq('user_id', user_id)
            
            if unread_only:
                query = query.eq('read', False)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting notifications for user {user_id}: {str(e)}")
            return []
    
    async def mark_notification_read(self, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read."""
        try:
            result = self.supabase.table('user_notifications').update({
                'read': True,
                'read_at': datetime.utcnow().isoformat()
            }).eq('id', notification_id).eq('user_id', user_id).execute()
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            return False
    
    async def submit_appeal(
        self, 
        user_id: str, 
        moderation_action_id: str,
        appeal_reason: str,
        additional_info: Optional[str] = None
    ) -> Optional[str]:
        """
        Submit an appeal for a moderation action.
        
        Args:
            user_id: ID of the user submitting the appeal
            moderation_action_id: ID of the moderation action being appealed
            appeal_reason: Reason for the appeal
            additional_info: Additional information to support the appeal
            
        Returns:
            Appeal ID if successful, None if failed
        """
        try:
            appeal_data = {
                'user_id': user_id,
                'moderation_action_id': moderation_action_id,
                'appeal_reason': appeal_reason,
                'additional_info': additional_info,
                'status': 'pending',
                'created_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('appeals').insert(appeal_data).execute()
            
            if result.data:
                appeal_id = result.data[0]['id']
                
                # Send confirmation notification
                await self.send_notification(
                    user_id,
                    NotificationType.APPEAL_RECEIVED,
                    {
                        'appeal_id': appeal_id,
                        'original_action': 'Moderation Action',
                        'created_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                    }
                )
                
                logger.info(f"Appeal submitted by user {user_id} for action {moderation_action_id}")
                return appeal_id
            
            return None
            
        except Exception as e:
            logger.error(f"Error submitting appeal: {str(e)}")
            return None
    
    async def get_pending_appeals(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all pending appeals for admin review."""
        try:
            result = self.supabase.table('appeals').select(
                'id, user_id, moderation_action_id, appeal_reason, '
                'additional_info, status, created_at'
            ).eq('status', 'pending').order('created_at', desc=False).limit(limit).execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting pending appeals: {str(e)}")
            return []
    
    async def resolve_appeal(
        self, 
        appeal_id: str, 
        admin_id: str,
        decision: str, 
        resolution_details: str
    ) -> bool:
        """
        Resolve an appeal with admin decision.
        
        Args:
            appeal_id: ID of the appeal
            admin_id: ID of the admin resolving the appeal
            decision: 'approved' or 'rejected'
            resolution_details: Details about the resolution
            
        Returns:
            Boolean indicating success
        """
        try:
            # Update appeal status
            result = self.supabase.table('appeals').update({
                'status': decision,
                'resolved_by': admin_id,
                'resolution_details': resolution_details,
                'resolved_at': datetime.utcnow().isoformat()
            }).eq('id', appeal_id).execute()
            
            if result.data:
                appeal = result.data[0]
                
                # Send resolution notification to user
                await self.send_notification(
                    appeal['user_id'],
                    NotificationType.APPEAL_RESOLVED,
                    {
                        'appeal_id': appeal_id,
                        'original_action': 'Moderation Action',
                        'appeal_status': decision.title(),
                        'resolution_details': resolution_details,
                        'created_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
                    }
                )
                
                logger.info(f"Appeal {appeal_id} resolved by admin {admin_id}: {decision}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error resolving appeal {appeal_id}: {str(e)}")
            return False
    
    async def get_notification_stats(self) -> Dict[str, Any]:
        """Get statistics about notifications and appeals."""
        try:
            # Get notification counts
            notifications_result = self.supabase.table('user_notifications').select(
                'notification_type, read'
            ).execute()
            
            # Get appeal counts
            appeals_result = self.supabase.table('appeals').select(
                'status'
            ).execute()
            
            # Process statistics
            notifications = notifications_result.data or []
            appeals = appeals_result.data or []
            
            notification_stats = {}
            unread_count = 0
            
            for notification in notifications:
                ntype = notification.get('notification_type', 'unknown')
                notification_stats[ntype] = notification_stats.get(ntype, 0) + 1
                if not notification.get('read', False):
                    unread_count += 1
            
            appeal_stats = {}
            for appeal in appeals:
                status = appeal.get('status', 'unknown')
                appeal_stats[status] = appeal_stats.get(status, 0) + 1
            
            return {
                'total_notifications': len(notifications),
                'unread_notifications': unread_count,
                'notification_types': notification_stats,
                'total_appeals': len(appeals),
                'appeal_statuses': appeal_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting notification stats: {str(e)}")
            return {
                'total_notifications': 0,
                'unread_notifications': 0,
                'notification_types': {},
                'total_appeals': 0,
                'appeal_statuses': {}
            }