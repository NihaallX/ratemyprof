"""Models package for RateMyProf backend.

This package contains all SQLAlchemy ORM models for the platform:
- User: Student accounts and authentication
- College: Educational institutions
- Professor: Faculty members who can be reviewed
- Review: Student reviews with ratings and comments
- ReviewFlag: Content moderation flags
- ModerationLog: Audit trail for moderation actions

All models inherit from the Base class defined in src.lib.database
and follow consistent patterns for:
- UUID primary keys
- Timestamp tracking (created_at, updated_at)
- Soft deletes where appropriate
- Relationship management
- Dictionary serialization
"""

# Import all models to ensure they're registered with SQLAlchemy
from src.models.user import User
from src.models.college import College  
from src.models.professor import Professor
from src.models.review import Review
from src.models.review_flag import ReviewFlag
from src.models.moderation_log import ModerationLog
from src.models.user_activity import UserActivity
from src.models.college_review_flag import CollegeReviewFlag

# Make models available at package level
__all__ = [
    "User",
    "College", 
    "Professor",
    "Review",
    "ReviewFlag",
    "ModerationLog",
    "UserActivity",
    "CollegeReviewFlag",
]
