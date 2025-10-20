"""UserActivity model for RateMyProf platform.

Tracks user actions to implement rate limiting and prevent abuse.
"""
from datetime import datetime, date
from typing import Optional
from sqlalchemy import Column, String, DateTime, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from src.lib.database import Base


class UserActivity(Base):
    """UserActivity model for tracking user actions and rate limiting.
    
    Tracks daily user activities to implement rate limiting:
    - Professor creation: 3 per day limit
    - Review creation: Could be extended for future limits
    - College review creation: Could be extended for future limits
    
    Attributes:
        id: Unique UUID identifier
        user_id: Reference to user who performed action
        action_type: Type of action (professor_create, review_create, etc.)
        action_date: Date when action was performed (for daily limits)
        action_count: Number of actions performed on this date
        last_action_at: Timestamp of last action
        target_id: Optional ID of target object (professor_id, review_id, etc.)
        ip_address: IP address for additional fraud detection
        created_at: When record was created
        updated_at: When record was last updated
    """
    
    __tablename__ = "user_activities"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # User and action information
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    action_type = Column(String(50), nullable=False, index=True)  # professor_create, review_create, etc.
    action_date = Column(Date, nullable=False, index=True)  # For daily rate limiting
    action_count = Column(Integer, nullable=False, default=1)
    last_action_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    # Optional target and context
    target_id = Column(String(100), nullable=True)  # ID of created professor, review, etc.
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6 address
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<UserActivity(user_id={self.user_id}, action_type={self.action_type}, date={self.action_date}, count={self.action_count})>"
    
    @classmethod
    def get_daily_count(cls, session, user_id: str, action_type: str, target_date: Optional[date] = None) -> int:
        """Get count of actions performed by user on specific date.
        
        Args:
            session: Database session
            user_id: User UUID
            action_type: Type of action to count
            target_date: Date to check (defaults to today)
            
        Returns:
            Number of actions performed on the date
        """
        if target_date is None:
            target_date = date.today()
            
        result = session.query(cls).filter(
            cls.user_id == user_id,
            cls.action_type == action_type,
            cls.action_date == target_date
        ).first()
        
        return result.action_count if result else 0
    
    @classmethod
    def increment_daily_count(cls, session, user_id: str, action_type: str, 
                            target_id: Optional[str] = None, ip_address: Optional[str] = None) -> 'UserActivity':
        """Increment daily count for user action.
        
        Args:
            session: Database session
            user_id: User UUID
            action_type: Type of action
            target_id: Optional target object ID
            ip_address: Optional IP address
            
        Returns:
            UserActivity record (created or updated)
        """
        today = date.today()
        
        # Try to find existing record for today
        existing = session.query(cls).filter(
            cls.user_id == user_id,
            cls.action_type == action_type,
            cls.action_date == today
        ).first()
        
        if existing:
            # Update existing record
            existing.action_count += 1
            existing.last_action_at = func.now()
            if target_id:
                existing.target_id = target_id
            if ip_address:
                existing.ip_address = ip_address
            session.commit()
            return existing
        else:
            # Create new record
            new_activity = cls(
                user_id=user_id,
                action_type=action_type,
                action_date=today,
                action_count=1,
                target_id=target_id,
                ip_address=ip_address
            )
            session.add(new_activity)
            session.commit()
            return new_activity


# Rate limiting constants
DAILY_LIMITS = {
    'professor_create': 3,
    'review_create': 10,  # Future use
    'college_review_create': 5,  # Future use
    'flag_create': 20,  # Future use
}