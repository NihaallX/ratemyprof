"""API package for RateMyProf backend.

Contains all FastAPI router modules for different API endpoints:
- auth: User authentication and registration
- professors: Professor search and profiles
- reviews: Review creation and management  
- colleges: College information and search
- moderation: Content moderation and admin tools
"""

__all__ = [
    "auth",
    "professors", 
    "reviews",
    "colleges",
    "moderation",
]
