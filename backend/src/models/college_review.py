"""College Review model for RateMyProf platform.

Represents student reviews of colleges including ratings for various aspects like
food, internet, clubs, opportunities, facilities, teaching quality, etc.
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
    from src.models.college import College


class CollegeReview(Base):
    """College Review model representing student feedback for colleges.
    
    Students submit reviews with ratings and comments for various college aspects.
    All reviews are anonymous to protect student privacy.
    
    Attributes:
        id: Unique UUID identifier
        student_id: Reference to student who submitted review (kept for data integrity)
        college_id: Reference to college being reviewed
        food_rating: Food quality rating (1-5 scale)
        internet_rating: Internet connectivity rating (1-5 scale)
        clubs_rating: Clubs and extracurricular activities rating (1-5 scale)
        opportunities_rating: Career opportunities and placement rating (1-5 scale)
        facilities_rating: Campus facilities rating (1-5 scale)
        teaching_rating: Overall teaching quality rating (1-5 scale)
        overall_rating: Overall college experience rating (1-5 scale)
        review_text: Written review comments
        course_name: Course/program the student is enrolled in
        year_of_study: Current year of study (1st, 2nd, 3rd, 4th, etc.)
        graduation_year: Expected graduation year
        anonymous: Always True for college reviews (forced anonymity)
        status: Moderation status (pending, approved, rejected, flagged)
        created_at: Review submission timestamp
        updated_at: Last modification timestamp
        moderated_at: When review was moderated
        moderated_by: Administrator who moderated review
        moderation_reason: Reason for rejection/flagging
        
    Relationships:
        student: User who submitted this review
        college: College being reviewed
    """
    
    __tablename__ = "college_reviews"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign keys
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    college_id = Column(String, ForeignKey("colleges.id"), nullable=False, index=True)
    
    # Rating fields (1-5 scale)
    food_rating = Column(Integer, nullable=False)
    internet_rating = Column(Integer, nullable=False)
    clubs_rating = Column(Integer, nullable=False)
    opportunities_rating = Column(Integer, nullable=False)
    facilities_rating = Column(Integer, nullable=False)
    teaching_rating = Column(Integer, nullable=False)
    overall_rating = Column(Integer, nullable=False)
    
    # Student information
    course_name = Column(String(200), nullable=False)
    year_of_study = Column(String(20), nullable=False)  # 1st Year, 2nd Year, etc.
    graduation_year = Column(Integer, nullable=True)
    
    # Review content
    review_text = Column(Text, nullable=True)
    
    # Privacy settings (forced anonymity for college reviews)
    anonymous = Column(Boolean, default=True, nullable=False)  # Always True
    
    # Moderation
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
    
    # Relationships
    student = relationship("User", back_populates="college_reviews")
    college = relationship("College", back_populates="college_reviews")
    
    def __repr__(self) -> str:
        """String representation of CollegeReview."""
        return f"<CollegeReview(id={self.id}, college_id={self.college_id}, overall_rating={self.overall_rating})>"
    
    @property
    def rating_summary(self) -> dict:
        """Get rating summary dictionary."""
        return {
            "food": self.food_rating,
            "internet": self.internet_rating,
            "clubs": self.clubs_rating,
            "opportunities": self.opportunities_rating,
            "facilities": self.facilities_rating,
            "teaching": self.teaching_rating,
            "overall": self.overall_rating,
        }
    
    @property
    def average_rating(self) -> float:
        """Calculate average rating across all dimensions."""
        ratings = [
            self.food_rating,
            self.internet_rating,
            self.clubs_rating,
            self.opportunities_rating,
            self.facilities_rating,
            self.teaching_rating
        ]
        return round(sum(ratings) / len(ratings), 1)
    
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
            self.food_rating,
            self.internet_rating,
            self.clubs_rating,
            self.opportunities_rating,
            self.facilities_rating,
            self.teaching_rating,
            self.overall_rating,
        ]
        return all(1 <= rating <= 5 for rating in ratings)
    
    def to_dict(self, include_student: bool = False) -> dict:
        """Convert review to dictionary representation.
        
        Args:
            include_student: Whether to include student information (always anonymous for college reviews)
            
        Returns:
            dict: Review data
        """
        data = {
            "id": str(self.id),
            "college_id": str(self.college_id),
            "ratings": self.rating_summary,
            "course_name": self.course_name,
            "year_of_study": self.year_of_study,
            "graduation_year": self.graduation_year,
            "review_text": self.review_text,
            "anonymous": True,  # Always anonymous for college reviews
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "moderated_at": self.moderated_at.isoformat() if self.moderated_at else None,
            "moderation_reason": self.moderation_reason,
            "helpful_count": self.helpful_count,
            "not_helpful_count": self.not_helpful_count,
        }
        
        # Always show as anonymous for college reviews
        data["student"] = {"name": "Anonymous Student"}
            
        return data