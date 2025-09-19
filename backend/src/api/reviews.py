"""Reviews API routes for RateMyProf backend.

Handles review creation, updates, and management endpoints for the platform.
"""
from typing import Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator
from supabase import Client

from src.lib.database import get_supabase
from src.lib.auth import get_current_user, get_optional_current_user

router = APIRouter()
security = HTTPBearer(auto_error=False)

# Request/Response Models
class Ratings(BaseModel):
    clarity: int
    helpfulness: int
    workload: int
    engagement: int
    
    @field_validator('clarity', 'helpfulness', 'workload', 'engagement')
    @classmethod
    def validate_ratings(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Rating must be between 1 and 5')
        return v


class ReviewCreate(BaseModel):
    professor_id: str
    ratings: Ratings
    review_text: Optional[str] = None
    semester_taken: Optional[str] = None
    course_taken: Optional[str] = None
    anonymous: bool = False
    anon_display_name: Optional[str] = None
    
    @field_validator('professor_id')
    @classmethod
    def validate_professor_id(cls, v):
        try:
            UUID(v)
            return v
        except ValueError:
            raise ValueError('Invalid professor ID format')
    
    @field_validator('review_text')
    @classmethod 
    def validate_review_text(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 2000:
                raise ValueError('Review text cannot exceed 2000 characters')
            if len(v) == 0:
                v = None
        return v


class ReviewUpdate(BaseModel):
    ratings: Optional[Ratings] = None
    review_text: Optional[str] = None
    semester_taken: Optional[str] = None
    course_taken: Optional[str] = None
    
    @field_validator('review_text')
    @classmethod 
    def validate_review_text(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 2000:
                raise ValueError('Review text cannot exceed 2000 characters')
            if len(v) == 0:
                raise ValueError('Review text cannot be empty')
        return v


class ReviewFlag(BaseModel):
    reason: str
    description: Optional[str] = None
    
    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v):
        valid_reasons = [
            'inappropriate_content', 'spam', 'fake_review',
            'harassment', 'off_topic', 'other'
        ]
        if v not in valid_reasons:
            raise ValueError(f'Invalid flag reason. Must be one of: {", ".join(valid_reasons)}')
        return v


class Review(BaseModel):
    id: str
    professor_id: str
    user_id: Optional[str] = None
    ratings: Dict[str, int]
    review_text: Optional[str] = None
    semester_taken: Optional[str] = None
    course_taken: Optional[str] = None
    anonymous: bool
    anon_display_name: Optional[str] = None
    created_at: str
    updated_at: str
    helpful_count: int = 0


@router.post("", response_model=Review, status_code=status.HTTP_201_CREATED)
async def create_review(
    request: ReviewCreate,
    current_user: Optional[dict] = Depends(get_optional_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Submit a review for a professor.
    
    Allows authenticated users to create reviews, or anonymous reviews
    if the anonymous flag is set to True.
    """
    try:
        # If not anonymous, require authentication
        if not request.anonymous and not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required for named reviews"
            )
        
        # Check if professor exists
        prof_check = supabase.table('professors').select('id').eq('id', request.professor_id).single().execute()
        if not prof_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Professor not found"
            )
        
        # Check for duplicate reviews (if authenticated)
        if current_user:
            existing_review = supabase.table('reviews').select('id').eq(
                'professor_id', request.professor_id
            ).eq('user_id', current_user['id']).execute()
            
            if existing_review.data:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User has already reviewed this professor"
                )
        
        # Create review data
        review_data = {
            'professor_id': request.professor_id,
            'user_id': current_user['id'] if current_user else None,
            'ratings': request.ratings.dict(),
            'review_text': request.review_text,
            'semester_taken': request.semester_taken,
            'course_taken': request.course_taken,
            'anonymous': request.anonymous,
            'anon_display_name': request.anon_display_name,
            'helpful_count': 0
        }
        
        result = supabase.table('reviews').insert(review_data).execute()
        review_data = result.data[0]
        
        return Review(**review_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create review: {str(e)}"
        )


@router.put("/{review_id}", response_model=Review)
async def update_review(
    review_id: str,
    request: ReviewUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Update an existing review.
    
    Allows users to update their own reviews. Users cannot update
    reviews belonging to other users.
    """
    try:
        # Validate UUID format
        try:
            UUID(review_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid review ID format"
            )
        
        # Check if review exists and belongs to current user
        existing = supabase.table('reviews').select('*').eq('id', review_id).single().execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        if existing.data['user_id'] != current_user['id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update review belonging to another user"
            )
        
        # Build update data
        update_data = {}
        if request.ratings:
            update_data['ratings'] = request.ratings.dict()
        if request.review_text is not None:
            update_data['review_text'] = request.review_text
        if request.semester_taken is not None:
            update_data['semester_taken'] = request.semester_taken
        if request.course_taken is not None:
            update_data['course_taken'] = request.course_taken
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="At least one field must be provided for update"
            )
        
        result = supabase.table('reviews').update(update_data).eq('id', review_id).execute()
        updated_review = result.data[0]
        
        return Review(**updated_review)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update review: {str(e)}"
        )


@router.post("/{review_id}/flag", status_code=status.HTTP_201_CREATED)
async def flag_review(
    review_id: str,
    request: ReviewFlag,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Flag a review for moderation.
    
    Allows users to report reviews that violate community guidelines.
    Users cannot flag the same review multiple times.
    """
    try:
        # Validate UUID format
        try:
            UUID(review_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid review ID format"
            )
        
        # Check if review exists
        review_check = supabase.table('reviews').select('id').eq('id', review_id).single().execute()
        if not review_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check if user already flagged this review
        existing_flag = supabase.table('review_flags').select('id').eq(
            'review_id', review_id
        ).eq('flagged_by', current_user['id']).execute()
        
        if existing_flag.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User has already flagged this review"
            )
        
        # Create flag record
        flag_data = {
            'review_id': review_id,
            'flagged_by': current_user['id'],
            'reason': request.reason,
            'description': request.description
        }
        
        supabase.table('review_flags').insert(flag_data).execute()
        
        return {"message": "Review flagged for moderation"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to flag review: {str(e)}"
        )
