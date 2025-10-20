"""ReviewVote model for RateMyProf platform.

Represents user votes on review helpfulness to enable community-driven 
review quality assessment and ranking.
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from src.lib.database import Base

if TYPE_CHECKING:
    from src.models.user import User
    from src.models.review import Review


class ReviewVote(Base):
    """ReviewVote model for tracking helpfulness votes on reviews.
    
    Users can vote reviews as helpful or not helpful to improve
    review quality and enable better sorting/filtering.
    
    Attributes:
        id: Unique UUID identifier
        review_id: Reference to review being voted on
        user_id: Reference to user who submitted vote
        vote_type: Type of vote (helpful or not_helpful)
        created_at: Vote submission timestamp
        
    Relationships:
        review: Review that was voted on
        user: User who submitted the vote
    """
    
    __tablename__ = "review_votes"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign keys
    review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Vote data
    vote_type = Column(String(20), nullable=False)  # 'helpful' or 'not_helpful'
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    review = relationship("Review", back_populates="votes")
    user = relationship("User", back_populates="review_votes")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('review_id', 'user_id', name='uq_review_user_vote'),
    )
    
    def __repr__(self) -> str:
        return f"<ReviewVote(id={self.id}, review_id={self.review_id}, vote_type={self.vote_type})>"
    
    @property
    def is_helpful_vote(self) -> bool:
        """Check if this is a helpful vote."""
        return self.vote_type == 'helpful'
    
    @property
    def is_not_helpful_vote(self) -> bool:
        """Check if this is a not helpful vote."""
        return self.vote_type == 'not_helpful'