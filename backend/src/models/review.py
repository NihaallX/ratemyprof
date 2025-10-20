"""Review model for RateMyProf platform.

Represents student reviews of professors including ratings, comments, and moderation status.
Includes comprehensive rating system and content moderation capabilities.
"""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from src.lib.database import Base

if TYPE_CHECKING:
    from src.models.user import User
    from src.models.professor import Professor
    from src.models.review_flag import ReviewFlag


class Review(Base):
    """Review model representing student feedback for professors.
    
    Students submit reviews with ratings and comments that go through moderation.
    Each review includes multiple rating dimensions and optional comments.
    
    Attributes:
        id: Unique UUID identifier
        professor_id: Reference to professor being reviewed
        overall_rating: Overall rating (1-5 scale)
        difficulty_rating: Course difficulty rating (1-5 scale)
        clarity_rating: Teaching clarity rating (1-5 scale)
        helpfulness_rating: Professor helpfulness rating (1-5 scale)
        would_take_again: Whether student would take course again
        course_name: Name of course taken
        semester: Semester when course was taken
        year: Year when course was taken
        grade_received: Grade received in course (optional)
        attendance_required: Whether attendance was required
        review_text: Written review comments
        tags: Comma-separated tags (funny, tough, caring, etc.)
        verified_student: Whether review is from verified student (always True)
        status: Moderation status (pending, approved, rejected, flagged)
        created_at: Review submission timestamp
        updated_at: Last modification timestamp
        moderated_at: When review was moderated
        moderated_by: Administrator who moderated review
        moderation_reason: Reason for rejection/flagging
        
    Relationships:
        student: User who submitted this review
        professor: Professor being reviewed
        flags: Flags submitted for this review
    """
    
    __tablename__ = "reviews"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign keys
    professor_id = Column(UUID(as_uuid=True), ForeignKey("professors.id"), nullable=False, index=True)
    
    # Rating fields (1-5 scale)
    overall_rating = Column(Integer, nullable=False)
    difficulty_rating = Column(Integer, nullable=False)
    clarity_rating = Column(Integer, nullable=False)
    helpfulness_rating = Column(Integer, nullable=False)
    
    # Boolean ratings
    would_take_again = Column(Boolean, nullable=False)
    
    # Course information
    course_name = Column(String(200), nullable=False)
    semester = Column(String(20), nullable=False)  # Fall, Spring, Summer
    year = Column(Integer, nullable=False)
    grade_received = Column(String(5), nullable=True)  # A+, A, B+, etc.
    attendance_required = Column(Boolean, nullable=True)
    
    # Review content
    review_text = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)  # Comma-separated tags
    
    # Privacy and moderation
    verified_student = Column(Boolean, default=True, nullable=False)  # All reviews are verified
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, approved, rejected, flagged
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Moderation details
    moderated_by = Column(UUID(as_uuid=True), nullable=True)  # Admin user ID
    moderation_reason = Column(Text, nullable=True)
    
    # Voting counts
    helpful_count = Column(Integer, default=0, nullable=False)
    not_helpful_count = Column(Integer, default=0, nullable=False)
    
    # Relationships - removed student relationship (now in mapping table)
    professor = relationship("Professor", back_populates="reviews")
    flags = relationship("ReviewFlag", back_populates="review", cascade="all, delete-orphan")
    votes = relationship("ReviewVote", back_populates="review", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        """String representation of Review."""
        return f"<Review(id={self.id}, professor_id={self.professor_id}, rating={self.overall_rating})>"
    
    @property
    def tags_list(self) -> List[str]:
        """Get list of tags."""
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(",") if tag.strip()]
    
    @property
    def is_pending(self) -> bool:
        """Check if review is pending moderation."""
        return self.status == "pending"
    
    @property
    def is_approved(self) -> bool:
        """Check if review is approved."""
        return self.status == "approved"
    
    @property
    def is_rejected(self) -> bool:
        """Check if review is rejected."""
        return self.status == "rejected"
    
    @property
    def is_flagged(self) -> bool:
        """Check if review is flagged."""
        return self.status == "flagged"
    
    @property
    def rating_summary(self) -> dict:
        """Get rating summary dictionary."""
        return {
            "overall": self.overall_rating,
            "difficulty": self.difficulty_rating,
            "clarity": self.clarity_rating,
            "helpfulness": self.helpfulness_rating,
            "would_take_again": self.would_take_again,
        }
    
    def can_be_flagged(self) -> bool:
        """Check if review can be flagged.
        
        Returns:
            bool: True if review is approved and can be flagged
        """
        return self.status == "approved"
    
    def approve(self, moderator_id: uuid.UUID, reason: Optional[str] = None) -> None:
        """Approve the review.
        
        Args:
            moderator_id: ID of moderator approving the review
            reason: Optional reason for approval
        """
        self.status = "approved"
        self.moderated_by = moderator_id
        self.moderated_at = datetime.utcnow()
        self.moderation_reason = reason
    
    def reject(self, moderator_id: uuid.UUID, reason: str) -> None:
        """Reject the review.
        
        Args:
            moderator_id: ID of moderator rejecting the review
            reason: Reason for rejection
        """
        self.status = "rejected"
        self.moderated_by = moderator_id
        self.moderated_at = datetime.utcnow()
        self.moderation_reason = reason
    
    def flag(self, moderator_id: uuid.UUID, reason: str) -> None:
        """Flag the review for further review.
        
        Args:
            moderator_id: ID of moderator flagging the review
            reason: Reason for flagging
        """
        self.status = "flagged"
        self.moderated_by = moderator_id
        self.moderated_at = datetime.utcnow()
        self.moderation_reason = reason
    
    def validate_ratings(self) -> bool:
        """Validate that all ratings are within valid range (1-5).
        
        Returns:
            bool: True if all ratings are valid
        """
        ratings = [
            self.overall_rating,
            self.difficulty_rating,
            self.clarity_rating,
            self.helpfulness_rating,
        ]
        return all(1 <= rating <= 5 for rating in ratings)
    
    def to_dict(self, include_student: bool = False) -> dict:
        """Convert review to dictionary representation.
        
        Args:
            include_student: Deprecated - all reviews are anonymous
            
        Returns:
            dict: Review data (without user information)
        """
        data = {
            "id": str(self.id),
            "professor_id": str(self.professor_id),
            "ratings": self.rating_summary,
            "course_name": self.course_name,
            "semester": self.semester,
            "year": self.year,
            "grade_received": self.grade_received,
            "attendance_required": self.attendance_required,
            "review_text": self.review_text,
            "tags": self.tags_list,
            "verified_student": self.verified_student,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "moderated_at": self.moderated_at.isoformat() if self.moderated_at else None,
            "moderation_reason": self.moderation_reason,
        }
            
        return data
