"""ModerationLog model for RateMyProf platform.

Tracks all moderation actions taken by administrators for audit and transparency.
Maintains comprehensive history of content moderation decisions.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from src.lib.database import Base

if TYPE_CHECKING:
    pass  # No direct relationships, but references other models by ID


class ModerationLog(Base):
    """ModerationLog model for tracking moderation actions.
    
    Administrators' actions on reviews, flags, and other content are logged
    for transparency, audit trails, and policy enforcement tracking.
    
    Attributes:
        id: Unique UUID identifier
        moderator_id: Reference to administrator who took action
        action_type: Type of moderation action taken
        target_type: Type of object being moderated (review, flag, user)
        target_id: ID of the object being moderated
        reason: Reason for the moderation action
        details: Additional context and details
        metadata: JSON field for flexible data storage
        created_at: When action was taken
        ip_address: IP address of moderator (for audit)
        user_agent: Browser/client information
        
    Note:
        This model intentionally has no foreign key relationships to avoid
        cascading deletes when moderated content is removed. IDs are stored
        as strings for reference purposes.
    """
    
    __tablename__ = "moderation_logs"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Moderator information
    moderator_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Action details
    action_type = Column(String(50), nullable=False, index=True)  # approve, reject, flag, unflag, etc.
    target_type = Column(String(50), nullable=False, index=True)  # review, flag, user, professor
    target_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Action context
    reason = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    extra_data = Column(JSON, nullable=True)  # Flexible data storage (renamed from metadata)
    
    # Audit information
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv6 can be up to 45 chars
    user_agent = Column(Text, nullable=True)
    
    def __repr__(self) -> str:
        """String representation of ModerationLog."""
        return f"<ModerationLog(id={self.id}, action={self.action_type}, target={self.target_type})>"
    
    @classmethod
    def get_action_types(cls) -> List[str]:
        """Get list of valid action types.
        
        Returns:
            List[str]: Valid moderation action types
        """
        return [
            "approve_review",
            "reject_review",
            "flag_review",
            "unflag_review",
            "approve_flag",
            "dismiss_flag",
            "suspend_user",
            "unsuspend_user",
            "verify_professor",
            "unverify_professor",
            "delete_review",
            "edit_review",
            "bulk_approve",
            "bulk_reject",
        ]
    
    @classmethod
    def get_target_types(cls) -> List[str]:
        """Get list of valid target types.
        
        Returns:
            List[str]: Valid moderation target types
        """
        return [
            "review",
            "review_flag",
            "user",
            "professor",
            "college",
        ]
    
    def validate_action_type(self) -> bool:
        """Validate that action type is allowed.
        
        Returns:
            bool: True if action type is valid
        """
        return self.action_type in self.get_action_types()
    
    def validate_target_type(self) -> bool:
        """Validate that target type is allowed.
        
        Returns:
            bool: True if target type is valid
        """
        return self.target_type in self.get_target_types()
    
    @classmethod
    def log_action(
        cls,
        moderator_id: uuid.UUID,
        action_type: str,
        target_type: str,
        target_id: uuid.UUID,
        reason: Optional[str] = None,
        details: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> "ModerationLog":
        """Create a new moderation log entry.
        
        Args:
            moderator_id: ID of moderator taking action
            action_type: Type of action being taken
            target_type: Type of object being moderated
            target_id: ID of object being moderated
            reason: Reason for the action
            details: Additional details about the action
            metadata: Additional structured data
            ip_address: IP address of moderator
            user_agent: Browser/client information
            
        Returns:
            ModerationLog: New log entry
        """
        return cls(
            moderator_id=moderator_id,
            action_type=action_type,
            target_type=target_type,
            target_id=target_id,
            reason=reason,
            details=details,
            extra_data=extra_data,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    def to_dict(self) -> dict:
        """Convert log entry to dictionary representation.
        
        Returns:
            dict: Log entry data
        """
        return {
            "id": str(self.id),
            "moderator_id": str(self.moderator_id),
            "action_type": self.action_type,
            "target_type": self.target_type,
            "target_id": str(self.target_id),
            "reason": self.reason,
            "details": self.details,
            "extra_data": self.extra_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
        }
