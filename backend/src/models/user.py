"""User model for RateMyProf platform.

Represents students who can create accounts, submit reviews, and flag content.
Includes authentication, profile management, and relationship tracking.
"""
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from src.lib.database import Base

if TYPE_CHECKING:
    from src.models.review import Review
    from src.models.review_flag import ReviewFlag


class User(Base):
    """User model representing students on the platform.
    
    Students can sign up, authenticate, submit reviews, and flag inappropriate content.
    All user data is validated and includes audit trails for moderation purposes.
    
    Attributes:
        id: Unique UUID identifier
        email: Unique email address for authentication
        password_hash: Hashed password using bcrypt
        first_name: Student's first name
        last_name: Student's last name
        college_id: Reference to student's college
        is_verified: Whether email is verified
        is_active: Whether account is active (not banned)
        created_at: Account creation timestamp
        updated_at: Last profile update timestamp
        last_login_at: Last successful login timestamp
        
    Relationships:
        reviews: Reviews submitted by this user
        review_flags: Flags submitted by this user
        college: College this user belongs to
    """
    
    __tablename__ = "users"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Authentication fields
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile fields
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    
    # College association
    college_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # Optional during signup
    
    # Account status
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    reviews = relationship("Review", back_populates="student", cascade="all, delete-orphan")
    review_flags = relationship("ReviewFlag", back_populates="reporter", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        """String representation of User."""
        return f"<User(id={self.id}, email={self.email}, name={self.first_name} {self.last_name})>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    def can_submit_review(self) -> bool:
        """Check if user can submit reviews.
        
        Returns:
            bool: True if user is verified and active
        """
        return self.is_verified and self.is_active
    
    def can_flag_content(self) -> bool:
        """Check if user can flag inappropriate content.
        
        Returns:
            bool: True if user is verified and active
        """
        return self.is_verified and self.is_active
    
    def to_dict(self) -> dict:
        """Convert user to dictionary representation.
        
        Returns:
            dict: User data without sensitive fields
        """
        return {
            "id": str(self.id),
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "college_id": str(self.college_id) if self.college_id else None,
            "is_verified": self.is_verified,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
        }
