"""ReviewFlag model for RateMyProf platform.

Represents flags submitted by users to report inappropriate or problematic reviews.
Enables community moderation and content quality control.
"""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from src.lib.database import Base

if TYPE_CHECKING:
    from src.models.user import User
    from src.models.review import Review


class ReviewFlag(Base):
    """ReviewFlag model for reporting inappropriate content.
    
    Users can flag reviews that violate community guidelines or contain
    inappropriate content. Flags are reviewed by moderators.
    
    Attributes:
        id: Unique UUID identifier
        review_id: Reference to review being flagged
        reporter_id: Reference to user who submitted flag
        flag_type: Type of violation (spam, inappropriate, etc.)
        description: Detailed description of the issue
        status: Flag processing status (pending, reviewed, dismissed)
        created_at: Flag submission timestamp
        reviewed_at: When flag was reviewed by moderator
        reviewed_by: Administrator who reviewed the flag
        resolution_notes: Moderator notes on flag resolution
        
    Relationships:
        review: Review that was flagged
        reporter: User who submitted the flag
    """
    
    __tablename__ = "review_flags"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign keys
    review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id"), nullable=False, index=True)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Flag details
    flag_type = Column(String(50), nullable=False, index=True)  # spam, inappropriate, fake, offensive, etc.
    description = Column(Text, nullable=True)
    
    # Status and moderation
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, reviewed, dismissed
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Moderation details
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)  # Admin user ID
    resolution_notes = Column(Text, nullable=True)
    
    # Relationships
    review = relationship("Review", back_populates="flags")
    reporter = relationship("User", back_populates="review_flags")
    
    def __repr__(self) -> str:
        """String representation of ReviewFlag."""
        return f"<ReviewFlag(id={self.id}, review_id={self.review_id}, type={self.flag_type})>"
    
    @property
    def is_pending(self) -> bool:
        """Check if flag is pending review."""
        return self.status == "pending"
    
    @property
    def is_reviewed(self) -> bool:
        """Check if flag has been reviewed."""
        return self.status == "reviewed"
    
    @property
    def is_dismissed(self) -> bool:
        """Check if flag was dismissed."""
        return self.status == "dismissed"
    
    def review_flag(self, moderator_id: uuid.UUID, action: str, notes: Optional[str] = None) -> None:
        """Review and resolve the flag.
        
        Args:
            moderator_id: ID of moderator reviewing the flag
            action: Action taken (reviewed, dismissed)
            notes: Optional resolution notes
        """
        self.status = action
        self.reviewed_by = moderator_id
        self.reviewed_at = datetime.utcnow()
        self.resolution_notes = notes
    
    @classmethod
    def get_flag_types(cls) -> List[str]:
        """Get list of valid flag types.
        
        Returns:
            List[str]: Valid flag type options
        """
        return [
            "spam",
            "inappropriate",
            "fake",
            "offensive",
            "harassment",
            "misinformation",
            "duplicate",
            "other"
        ]
    
    def validate_flag_type(self) -> bool:
        """Validate that flag type is allowed.
        
        Returns:
            bool: True if flag type is valid
        """
        return self.flag_type in self.get_flag_types()
    
    def to_dict(self, include_review: bool = False) -> dict:
        """Convert flag to dictionary representation.
        
        Args:
            include_review: Whether to include review information
            
        Returns:
            dict: Flag data
        """
        data = {
            "id": str(self.id),
            "review_id": str(self.review_id),
            "reporter_id": str(self.reporter_id),
            "flag_type": self.flag_type,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "reviewed_by": str(self.reviewed_by) if self.reviewed_by else None,
            "resolution_notes": self.resolution_notes,
        }
        
        if include_review and self.review:
            data["review"] = self.review.to_dict()
            
        return data
