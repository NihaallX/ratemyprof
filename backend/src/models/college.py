"""College model for RateMyProf platform.

Represents educational institutions in India where professors teach and students study.
Includes location data, verification status, and relationships to professors and users.
"""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from src.lib.database import Base

if TYPE_CHECKING:
    from src.models.user import User
    from src.models.professor import Professor


class College(Base):
    """College model representing educational institutions.
    
    Colleges are verified institutions where professors teach and students study.
    Each college has location data and can have multiple professors and student users.
    
    Attributes:
        id: Unique college code identifier (e.g., VU-PUNE-001)
        name: Official college name
        short_name: Abbreviated name or acronym
        description: College description and details
        city: City where college is located
        state: State/union territory where college is located
        country: Country (default: India)
        website: Official college website
        email_domain: Email domain for college addresses
        established_year: Year college was established
        college_type: Type of institution (University, College, Institute)
        is_verified: Whether college is verified by administrators
        total_students: Approximate number of students
        total_professors: Count of professors in database
        created_at: Record creation timestamp
        updated_at: Last update timestamp
        
    Relationships:
        professors: Professors who teach at this college
        users: Students who belong to this college
    """
    
    __tablename__ = "colleges"
    
    # Primary key
    id = Column(String(50), primary_key=True, index=True)  # College code like VU-PUNE-001
    
    # Basic information
    name = Column(String(255), nullable=False, index=True)
    short_name = Column(String(50), nullable=True, index=True)
    description = Column(Text, nullable=True)
    
    # Location
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False, default="India")
    
    # External links
    website = Column(String(255), nullable=True)
    email_domain = Column(String(100), nullable=True)  # Domain for college email addresses
    
    # Institutional details
    established_year = Column(Integer, nullable=True)
    college_type = Column(String(50), nullable=False, default="College")  # University, College, Institute
    
    # Verification and status
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Statistics (updated periodically)
    total_students = Column(Integer, nullable=True)
    total_professors = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    professors = relationship("Professor", back_populates="college", cascade="all, delete-orphan")
    users = relationship("User", backref="college")
    college_reviews = relationship("CollegeReview", back_populates="college", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        """String representation of College."""
        return f"<College(id={self.id}, name={self.name}, city={self.city})>"
    
    @property
    def display_name(self) -> str:
        """Get display name with short name if available."""
        if self.short_name:
            return f"{self.name} ({self.short_name})"
        return self.name
    
    @property
    def location(self) -> str:
        """Get formatted location string."""
        return f"{self.city}, {self.state}, {self.country}"
    
    def get_stats(self) -> dict:
        """Get college statistics.
        
        Returns:
            dict: Statistics about professors and reviews
        """
        return {
            "total_professors": self.total_professors,
            "total_students": self.total_students,
            "professors_count": len(self.professors) if self.professors else 0,
            "users_count": len(self.users) if self.users else 0,
        }
    
    def to_dict(self, include_stats: bool = False) -> dict:
        """Convert college to dictionary representation.
        
        Args:
            include_stats: Whether to include statistics
            
        Returns:
            dict: College data
        """
        data = {
            "id": str(self.id),
            "name": self.name,
            "short_name": self.short_name,
            "display_name": self.display_name,
            "description": self.description,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "location": self.location,
            "website_url": self.website_url,
            "established_year": self.established_year,
            "college_type": self.college_type,
            "is_verified": self.is_verified,
            "total_students": self.total_students,
            "total_professors": self.total_professors,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_stats:
            data["stats"] = self.get_stats()
            
        return data
