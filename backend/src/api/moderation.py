"""Moderation API routes for RateMyProf backend.

Handles content moderation and administrative endpoints for the platform.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator
from supabase import Client

from src.lib.database import get_supabase
from src.lib.auth import get_current_user

router = APIRouter()

# Request/Response Models
class ModerationAction(BaseModel):
    action: str
    reason: str
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v):
        valid_actions = ['approve', 'remove', 'pending']
        if v not in valid_actions:
            raise ValueError(f'Invalid action. Must be one of: {", ".join(valid_actions)}')
        return v
    
    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Reason is required for moderation action')
        if len(v) > 1000:
            raise ValueError('Reason cannot exceed 1000 characters')
        return v.strip()


class ReviewFlag(BaseModel):
    id: str
    reason: str
    description: Optional[str] = None
    flagged_by: str
    created_at: str


class FlaggedReview(BaseModel):
    id: str
    professor_id: str
    user_id: Optional[str] = None
    review_text: Optional[str] = None
    ratings: Dict[str, int]
    anonymous: bool
    anon_display_name: Optional[str] = None
    created_at: str
    updated_at: str
    status: str  # pending, approved, removed
    flags: List[ReviewFlag]


class FlaggedReviewsResponse(BaseModel):
    reviews: List[FlaggedReview]
    total: int


def is_admin_user(current_user: dict) -> bool:
    """Check if current user has admin/moderator privileges."""
    # In a real app, this would check user roles from database
    # For now, we'll check user metadata or implement a simple check
    user_metadata = current_user.get('user_metadata', {})
    return (
        user_metadata.get('role') == 'admin' or
        user_metadata.get('is_moderator') == True or
        current_user.get('email', '').endswith('@ratemyprof.in')  # Simple admin check
    )


@router.get("/reviews", response_model=FlaggedReviewsResponse)
async def get_flagged_reviews(
    status: str = Query('pending', pattern='^(pending|approved|removed)$'),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get flagged reviews for moderation.
    
    Returns reviews that have been flagged by users and require
    moderation attention. Admin-only endpoint.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required for moderation endpoints"
            )
        
        # Get flagged reviews with their flags
        query = supabase.table('reviews').select(
            '''
            id,
            professor_id,
            user_id,
            review_text,
            ratings,
            anonymous,
            anon_display_name,
            created_at,
            updated_at,
            status,
            review_flags (
                id,
                reason,
                description,
                flagged_by,
                created_at
            )
            '''
        ).eq('status', status).order('created_at', desc=True).limit(limit)
        
        # Only get reviews that have flags
        query = query.not_.is_('review_flags', 'null')
        
        result = query.execute()
        
        # Transform data for response
        flagged_reviews = []
        for review_data in result.data:
            flags_data = review_data.pop('review_flags', [])
            flags = [ReviewFlag(**flag) for flag in flags_data if flag]
            
            # Only include reviews that actually have flags
            if flags:
                flagged_review = FlaggedReview(
                    **review_data,
                    flags=flags
                )
                flagged_reviews.append(flagged_review)
        
        # Get total count
        count_query = supabase.table('reviews').select(
            'id', count='exact'
        ).eq('status', status).not_.is_('review_flags', 'null')
        
        count_result = count_query.execute()
        total = count_result.count or 0
        
        return FlaggedReviewsResponse(
            reviews=flagged_reviews,
            total=total
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get flagged reviews: {str(e)}"
        )


@router.post("/reviews/{review_id}/action")
async def moderate_review(
    review_id: str,
    request: ModerationAction,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Take moderation action on a review.
    
    Allows admin users to approve, remove, or mark reviews as pending
    based on moderation guidelines and flag reports.
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
        
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required for moderation actions"
            )
        
        # Check if review exists
        review_check = supabase.table('reviews').select('id, status').eq('id', review_id).single().execute()
        if not review_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Update review status
        update_result = supabase.table('reviews').update({
            'status': request.action,
            'moderated_at': 'now()',
            'moderated_by': current_user['id']
        }).eq('id', review_id).execute()
        
        # Log moderation action
        log_data = {
            'review_id': review_id,
            'moderator_id': current_user['id'],
            'action': request.action,
            'reason': request.reason,
            'previous_status': review_check.data['status']
        }
        
        supabase.table('moderation_logs').insert(log_data).execute()
        
        action_messages = {
            'approve': 'Review approved successfully',
            'remove': 'Review removed successfully', 
            'pending': 'Review marked as pending review'
        }
        
        return {"message": action_messages.get(request.action, "Moderation action completed")}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to moderate review: {str(e)}"
        )
