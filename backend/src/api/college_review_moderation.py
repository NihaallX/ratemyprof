"""College review moderation API routes for RateMyProf backend.

Provides endpoints for flagging and moderating college reviews.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, field_validator
from supabase import Client

from src.lib.database import get_supabase
from src.lib.auth import get_current_user
from src.lib.college_review_moderation import (
    flag_college_review,
    get_flagged_college_reviews,
    review_college_review_flag,
    get_college_review_moderation_stats,
    get_valid_college_review_flag_types
)

router = APIRouter()


def is_admin_user(current_user: dict) -> bool:
    """Check if current user has admin/moderator privileges."""
    # Check for hardcoded admin user
    if current_user.get('email') == 'admin@gmail.com' or current_user.get('username') == 'admin@gmail.com':
        return True
    
    # Check user metadata for admin role
    user_metadata = current_user.get('user_metadata', {})
    return (
        user_metadata.get('role') == 'admin' or
        user_metadata.get('is_moderator') == True or
        current_user.get('email', '').endswith('@ratemyprof.in')  # Simple admin check
    )


# Request/Response Models
class CollegeReviewFlagCreate(BaseModel):
    college_review_id: str
    flag_type: str
    reason: Optional[str] = None
    
    @field_validator('flag_type')
    def validate_flag_type(cls, v):
        valid_types = [t["type"] for t in get_valid_college_review_flag_types()]
        if v not in valid_types:
            raise ValueError(f'Invalid flag type. Must be one of: {", ".join(valid_types)}')
        return v


class CollegeReviewFlagResponse(BaseModel):
    id: str
    college_review_id: str
    reporter_id: str
    flag_type: str
    reason: Optional[str]
    status: str
    created_at: str


class CollegeReviewFlagReview(BaseModel):
    action: str  # 'approve_flag' or 'dismiss_flag'
    admin_notes: Optional[str] = None
    
    @field_validator('action')
    def validate_action(cls, v):
        if v not in ['approve_flag', 'dismiss_flag']:
            raise ValueError('Action must be either "approve_flag" or "dismiss_flag"')
        return v


class FlaggedCollegeReviewResponse(BaseModel):
    id: str
    college_review_id: str
    reporter_id: str
    flag_type: str
    reason: Optional[str]
    status: str
    reviewed_by: Optional[str]
    admin_notes: Optional[str]
    reviewed_at: Optional[str]
    created_at: str
    college_review: dict
    college: dict


class CollegeModerationStatsResponse(BaseModel):
    pending_college_review_flags: int
    total_college_review_flags: int
    flagged_college_reviews: int
    total_college_reviews: int


# Public endpoints (for logged-in users)
@router.post("/flag", response_model=CollegeReviewFlagResponse)
async def create_college_review_flag(
    flag_data: CollegeReviewFlagCreate,
    request: Request,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Flag a college review for moderation.
    
    Allows logged-in users to report college reviews that violate community guidelines.
    """
    try:
        # Check if college review exists
        review_result = supabase.table('college_reviews').select('id').eq(
            'id', flag_data.college_review_id
        ).single().execute()
        
        if not review_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College review not found"
            )
        
        # Create flag
        flag = flag_college_review(
            supabase,
            flag_data.college_review_id,
            current_user['id'],
            flag_data.flag_type,
            flag_data.reason
        )
        
        return CollegeReviewFlagResponse(
            id=flag['id'],
            college_review_id=flag['college_review_id'],
            reporter_id=flag['reporter_id'],
            flag_type=flag['flag_type'],
            reason=flag['reason'],
            status=flag['status'],
            created_at=flag['created_at']
        )
        
    except Exception as e:
        if "already flagged" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to flag college review: {str(e)}"
        )


@router.get("/flag-types")
async def get_college_review_flag_types():
    """Get valid flag types for college reviews."""
    return {
        "flag_types": get_valid_college_review_flag_types()
    }


# Admin endpoints
@router.get("/admin/flagged-reviews")
async def get_admin_flagged_college_reviews(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get flagged college reviews for admin review.
    
    Returns college reviews that have been flagged by users for moderation.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required for moderation endpoints"
            )
        flagged_reviews = get_flagged_college_reviews(
            supabase, status_filter, limit, offset
        )
        
        return {
            "flagged_reviews": flagged_reviews,
            "total_count": len(flagged_reviews),
            "limit": limit,
            "offset": offset,
            "status_filter": status_filter
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch flagged college reviews: {str(e)}"
        )


@router.post("/admin/flags/{flag_id}/review")
async def admin_review_college_review_flag(
    flag_id: str,
    review_data: CollegeReviewFlagReview,
    request: Request,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Admin review of a college review flag.
    
    Allows admins to approve or dismiss flags on college reviews.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required for moderation endpoints"
            )
        
        updated_flag = review_college_review_flag(
            supabase,
            flag_id,
            current_user['id'],
            review_data.action,
            review_data.admin_notes
        )
        
        return {
            "message": f"Flag {review_data.action.replace('_', ' ')}d successfully",
            "flag": updated_flag,
            "action_taken": review_data.action
        }
        
    except Exception as e:
        if "not found" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        if "already been reviewed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to review flag: {str(e)}"
        )


@router.get("/admin/stats", response_model=CollegeModerationStatsResponse)
async def get_admin_college_moderation_stats(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get college review moderation statistics for admin dashboard."""
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required for moderation endpoints"
            )
        
        stats = get_college_review_moderation_stats(supabase)
        return CollegeModerationStatsResponse(**stats)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch moderation stats: {str(e)}"
        )


@router.get("/admin/all-reviews")
async def get_all_college_reviews_for_admin(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    limit: int = 50,
    offset: int = 0
):
    """Get all college reviews with author information for admin review.
    
    Returns all college reviews along with author details from the author_mappings table.
    This endpoint is only accessible to admins.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required for moderation endpoints"
            )
        
        # Use admin client to bypass RLS
        from src.lib.database import get_supabase_admin
        admin_client = get_supabase_admin()
        if not admin_client:
            admin_client = supabase
        
        # Fetch all college reviews with college information
        reviews_response = admin_client.table("college_reviews") \
            .select("*, colleges(name, city, state)") \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        
        reviews = reviews_response.data if reviews_response.data else []
        
        # For each review, fetch the author information manually
        for review in reviews:
            try:
                # Get author mapping (just the author_id)
                mapping_response = admin_client.table("college_review_author_mappings") \
                    .select("author_id") \
                    .eq("college_review_id", review['id']) \
                    .execute()
                
                if mapping_response.data and len(mapping_response.data) > 0:
                    author_id = mapping_response.data[0].get('author_id')
                    review['author_id'] = author_id
                    
                    # Fetch user details from auth.users schema
                    if author_id:
                        try:
                            # Query auth.users directly using admin client
                            user_response = admin_client.auth.admin.get_user_by_id(author_id)
                            
                            if user_response and user_response.user:
                                user = user_response.user
                                review['author'] = {
                                    'email': user.email or 'No email',
                                    'username': user.user_metadata.get('username') or user.email or 'Unknown'
                                }
                            else:
                                review['author'] = {'email': 'Unknown', 'username': 'Unknown'}
                        except Exception as user_error:
                            print(f"Error fetching user {author_id}: {user_error}")
                            review['author'] = {'email': 'Unknown', 'username': 'Unknown'}
                    else:
                        review['author'] = {'email': 'Anonymous', 'username': 'Anonymous'}
                else:
                    review['author'] = {'email': 'Anonymous', 'username': 'Anonymous'}
                    review['author_id'] = None
            except Exception as mapping_error:
                # If there's an error fetching author, set as anonymous
                print(f"Error fetching author for review {review['id']}: {mapping_error}")
                review['author'] = {'email': 'Anonymous', 'username': 'Anonymous'}
                review['author_id'] = None
        
        # Get total count
        count_response = admin_client.table("college_reviews") \
            .select("id", count="exact") \
            .execute()
        
        total_count = count_response.count if hasattr(count_response, 'count') else len(reviews)
        
        return {
            "reviews": reviews,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch college reviews: {str(e)}"
        )