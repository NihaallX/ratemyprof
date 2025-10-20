"""CollegeReviewFlag model for RateMyProf platform.

Allows users to flag inappropriate college reviews for moderation.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from src.lib.database import Base

if TYPE_CHECKING:
    pass  # Avoiding circular imports


class CollegeReviewFlag(Base):
    """CollegeReviewFlag model for flagging college reviews.
    
    Users can flag college reviews that violate community guidelines.
    Flagged reviews are then reviewed by administrators for appropriate action.
    
    Attributes:
        id: Unique UUID identifier
        college_review_id: Reference to the college review being flagged
        reporter_id: User who reported the review
        flag_type: Type of violation (spam, inappropriate, etc.)
        reason: Detailed reason for flagging
        status: Current status of the flag (pending, reviewed, dismissed)
        reviewed_by: Admin who reviewed the flag (optional)
        admin_notes: Notes from admin review (optional)
        reviewed_at: When the flag was reviewed (optional)
        created_at: When flag was created
        updated_at: When flag was last updated
        
    Flag Types:
        - spam: Spam or promotional content
        - inappropriate: Inappropriate or offensive content
        - fake: Fake or fraudulent review
        - offensive: Offensive language or content
        - harassment: Harassment or personal attacks
        - irrelevant: Irrelevant to the college
        - duplicate: Duplicate review content
        - other: Other violation (specify in reason)
    """
    
    __tablename__ = "college_review_flags"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Review and reporter information
    college_review_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    reporter_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Flag details
    flag_type = Column(String(50), nullable=False, index=True)  # spam, inappropriate, fake, offensive, etc.
    reason = Column(Text, nullable=True)  # Optional detailed reason
    
    # Moderation status
    status = Column(String(20), nullable=False, default="pending", index=True)  # pending, reviewed, dismissed
    reviewed_by = Column(UUID(as_uuid=True), nullable=True, index=True)  # Admin who reviewed
    admin_notes = Column(Text, nullable=True)  # Admin's notes on the flag
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<CollegeReviewFlag(id={self.id}, review_id={self.college_review_id}, type={self.flag_type}, status={self.status})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert flag to dictionary format."""
        return {
            "id": str(self.id),
            "college_review_id": str(self.college_review_id),
            "reporter_id": str(self.reporter_id),
            "flag_type": self.flag_type,
            "reason": self.reason,
            "status": self.status,
            "reviewed_by": str(self.reviewed_by) if self.reviewed_by is not None else None,
            "admin_notes": self.admin_notes,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at is not None else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    @classmethod
    def get_valid_flag_types(cls) -> List[str]:
        """Get list of valid flag types."""
        return [
            "spam",
            "inappropriate", 
            "fake",
            "offensive",
            "harassment",
            "irrelevant",
            "duplicate",
            "other"
        ]
    
    @classmethod
    def is_valid_flag_type(cls, flag_type: str) -> bool:
        """Check if flag type is valid."""
        return flag_type in cls.get_valid_flag_types()
    
    @classmethod
    def get_flag_type_descriptions(cls) -> Dict[str, str]:
        """Get descriptions for each flag type."""
        return {
            "spam": "Spam, promotional content, or advertisements",
            "inappropriate": "Inappropriate or unsuitable content",
            "fake": "Fake, fraudulent, or misleading review",
            "offensive": "Offensive language or inappropriate content",
            "harassment": "Harassment, bullying, or personal attacks", 
            "irrelevant": "Content not relevant to the college",
            "duplicate": "Duplicate or repeated review content",
            "other": "Other violation (please specify in reason)"
        }