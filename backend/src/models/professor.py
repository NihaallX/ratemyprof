"""Professor model for RateMyProf platform.

Represents faculty members who teach at colleges and can be reviewed by students.
Includes profile information, teaching details, and rating calculations.
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
    from src.models.college import College
    from src.models.review import Review


class Professor(Base):
    """Professor model representing faculty members.
    
    Professors teach at colleges and can be reviewed by students.
    Includes profile data, teaching information, and calculated ratings.
    
    Attributes:
        id: Unique UUID identifier
        name: Professor's full name
        email: Contact email (optional)
        department: Academic department
        designation: Job title (Professor, Associate Professor, etc.)
        college_id: Reference to college where professor teaches
        subjects: JSON array of subjects taught (stored as text)
        specializations: Areas of specialization
        biography: Professor's background and expertise
        years_of_experience: Teaching experience in years
        education: Educational background
        research_interests: Areas of research focus
        is_verified: Whether professor profile is verified
        is_active: Whether professor is currently teaching
        average_rating: Calculated average rating from reviews
        total_reviews: Count of reviews received
        rating_difficulty: Average difficulty rating
        rating_clarity: Average clarity rating
        rating_helpfulness: Average helpfulness rating
        would_take_again_percent: Percentage who would take again
        created_at: Profile creation timestamp
        updated_at: Last profile update timestamp
        
    Relationships:
        college: College where professor teaches
        reviews: Reviews submitted for this professor
    """
    
    __tablename__ = "professors"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Basic information
    name = Column(String(200), nullable=False)  # Combined name field to match database
    email = Column(String(255), nullable=True)
    
    # Academic details
    department = Column(String(100), nullable=False, index=True)
    designation = Column(String(100), nullable=False)  # Professor, Associate Professor, etc.
    
    # College association
    college_id = Column(String(50), ForeignKey("colleges.id"), nullable=False, index=True)
    
    # Teaching information  
    subjects = Column(Text, nullable=True)  # JSON array stored as text to match database
    specializations = Column(Text, nullable=True)  # Added to match database
    biography = Column(Text, nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    education = Column(Text, nullable=True)
    research_interests = Column(Text, nullable=True)
    
    # Status
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Calculated ratings (updated from reviews)
    average_rating = Column(Float, default=0.0, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    rating_difficulty = Column(Float, default=0.0, nullable=False)
    rating_clarity = Column(Float, default=0.0, nullable=False)
    rating_helpfulness = Column(Float, default=0.0, nullable=False)
    would_take_again_percent = Column(Float, default=0.0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    college = relationship("College", back_populates="professors")
    reviews = relationship("Review", back_populates="professor", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        """String representation of Professor."""
        return f"<Professor(id={self.id}, name={self.name}, department={self.department})>"
    
    @property
    def full_name(self) -> str:
        """Get professor's full name."""
        return self.name
    
    @property
    def subjects_list(self) -> List[str]:
        """Get list of subjects taught."""
        if not self.subjects:
            return []
        return [subject.strip() for subject in self.subjects.split(",") if subject.strip()]
    
    @property
    def rating_summary(self) -> dict:
        """Get rating summary dictionary."""
        return {
            "average_rating": round(self.average_rating, 1),
            "total_reviews": self.total_reviews,
            "difficulty": round(self.rating_difficulty, 1),
            "clarity": round(self.rating_clarity, 1),
            "helpfulness": round(self.rating_helpfulness, 1),
            "would_take_again_percent": round(self.would_take_again_percent, 1),
        }
    
    def has_sufficient_reviews(self, min_reviews: int = 3) -> bool:
        """Check if professor has enough reviews for reliable ratings.
        
        Args:
            min_reviews: Minimum number of reviews required
            
        Returns:
            bool: True if professor has sufficient reviews
        """
        return self.total_reviews >= min_reviews
    
    def update_ratings_from_reviews(self) -> None:
        """Update calculated ratings based on associated reviews.
        
        This method should be called whenever reviews are added, updated, or deleted.
        It recalculates all rating metrics from the current set of approved reviews.
        """
        if not self.reviews:
            self.average_rating = 0.0
            self.total_reviews = 0
            self.rating_difficulty = 0.0
            self.rating_clarity = 0.0
            self.rating_helpfulness = 0.0
            self.would_take_again_percent = 0.0
            return
        
        # Filter approved reviews only
        approved_reviews = [r for r in self.reviews if r.status == "approved"]
        
        if not approved_reviews:
            self.average_rating = 0.0
            self.total_reviews = 0
            self.rating_difficulty = 0.0
            self.rating_clarity = 0.0
            self.rating_helpfulness = 0.0
            self.would_take_again_percent = 0.0
            return
        
        # Calculate averages
        total = len(approved_reviews)
        self.total_reviews = total
        
        self.average_rating = sum(r.overall_rating for r in approved_reviews) / total
        self.rating_difficulty = sum(r.difficulty_rating for r in approved_reviews) / total
        self.rating_clarity = sum(r.clarity_rating for r in approved_reviews) / total
        self.rating_helpfulness = sum(r.helpfulness_rating for r in approved_reviews) / total
        
        # Calculate would take again percentage
        would_take_again_count = sum(1 for r in approved_reviews if r.would_take_again)
        self.would_take_again_percent = (would_take_again_count / total) * 100
    
    def to_dict(self, include_reviews: bool = False) -> dict:
        """Convert professor to dictionary representation.
        
        Args:
            include_reviews: Whether to include review data
            
        Returns:
            dict: Professor data
        """
        data = {
            "id": str(self.id),
            "name": self.name,
            "full_name": self.full_name,
            "email": self.email,
            "department": self.department,
            "designation": self.designation,
            "college_id": str(self.college_id),
            "subjects": self.subjects_list,
            "biography": self.biography,
            "years_of_experience": self.years_of_experience,
            "education": self.education,
            "research_interests": self.research_interests,
            "is_verified": self.is_verified,
            "is_active": self.is_active,
            "ratings": self.rating_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_reviews and self.reviews:
            data["reviews"] = [r.to_dict() for r in self.reviews if r.status == "approved"]
            
        return data
