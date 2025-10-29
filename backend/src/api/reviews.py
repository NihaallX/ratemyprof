"""Reviews API routes for RateMyProf backend.

Handles review creation, updates, and management endpoints for the platform.
"""
import os
from typing import Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Security, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator
from supabase import Client, create_client

from src.lib.database import get_supabase
from src.lib.auth import get_current_user, get_optional_current_user, get_authenticated_supabase
from src.services.auto_flagging import AutoFlaggingSystem

router = APIRouter()
security = HTTPBearer()

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
    # Removed: anonymous, anon_display_name (all reviews are anonymous by default)
    
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
    overall_rating: int
    difficulty_rating: int
    clarity_rating: int
    helpfulness_rating: int
    course_name: str
    semester: Optional[str] = None
    academic_year: Optional[str] = None
    review_text: Optional[str] = None
    verified_student: bool = True  # All reviews are from verified students
    would_take_again: Optional[bool] = None
    assignment_load: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    helpful_count: int = 0
    # Removed: student_id, anonymous, anon_display_name


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_review(
    request: ReviewCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),  # Now required authentication
    supabase: Client = Depends(get_authenticated_supabase)
):
    """Submit a review for a professor.
    
    All reviews are anonymous by default. User authentication is required
    for moderation purposes, but user identity is never publicly displayed.
    Includes automated content filtering.
    
    NOTE: Uses authenticated Supabase client so RLS can verify auth.uid().
    """
    print(f"🔵 CREATE REVIEW STARTED - OUTER TRY CATCH")
    
    try:
        print(f"🔵 CREATE REVIEW - Inside try block")
        print(f"Request data: {request}")
        print(f"Current user: {current_user}")
        
        # Authentication is now required (removed optional)
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to submit reviews"
            )
        
        # Note: Using authenticated supabase client (not admin)
        # RLS policies will verify auth.uid() for all operations
        
        # Check if professor exists
        prof_check = supabase.table('professors').select('id').eq('id', request.professor_id).single().execute()
        if not prof_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Professor not found"
            )
        
        # Check for duplicate reviews using the mapping table
        # Get all review IDs for this user from the mapping table
        # RLS policy: Users can read their own mappings via auth.uid()
        try:
            user_mappings = supabase.table('review_author_mappings').select(
                'review_id'
            ).eq('author_id', current_user['id']).execute()
            
            if user_mappings.data:
                # Get the review_ids to check their professor_id
                review_ids = [m['review_id'] for m in user_mappings.data]
                
                # Check if any of these reviews are for this professor AND not deleted
                # This allows users to re-review if their previous review was deleted by admin
                existing_reviews = supabase.table('reviews').select(
                    'id, professor_id, deleted_at'
                ).in_('id', review_ids).eq(
                    'professor_id', request.professor_id
                ).is_('deleted_at', 'null').execute()  # Only check non-deleted reviews
                
                if existing_reviews.data:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="You have already reviewed this professor"
                    )
        except HTTPException:
            raise
        except Exception as dup_check_error:
            # Log but don't fail - duplicate check is not critical
            print(f"Duplicate check warning: {str(dup_check_error)}")
        
        # Create review data to match new anonymous schema (NO user identifiers)
        review_data = {
            'professor_id': request.professor_id,
            # NO student_id, NO anonymous field - all reviews are anonymous
            'overall_rating': request.ratings.engagement,  # Use engagement as overall
            'difficulty_rating': request.ratings.workload,
            'clarity_rating': request.ratings.clarity,
            'helpfulness_rating': request.ratings.helpfulness,
            'course_name': request.course_taken or 'Unknown',
            'semester': request.semester_taken,
            'academic_year': '2024-25',  # Default current academic year
            'review_text': request.review_text,
            'verified_student': True,  # All users are verified
            'would_take_again': True,  # Default for now
            'assignment_load': 'moderate',  # Default for now
            'helpful_count': 0,
            'status': 'pending'  # All reviews start pending, require admin approval
        }
        
        print(f"📝 REVIEW DATA TO INSERT: {review_data}")
        print(f"📝 Field count: {len(review_data)} fields")
        print(f"📝 Keys: {list(review_data.keys())}")
        
        # Insert review using authenticated client
        # RLS policy: "Authenticated users create reviews" allows this
        result = supabase.table('reviews').insert(review_data).execute()
        review_data = result.data[0]
        print(f"✅ REVIEW INSERTED INTO DATABASE: {review_data['id']}")
        print(f"   Review ID type: {type(review_data['id'])}")
        print(f"   Review ID value: '{review_data['id']}'")
        print(f"   Current user ID: '{current_user['id']}'")
        print(f"   Current user ID type: {type(current_user['id'])}")
        
        # Create mapping entry in private table (links review to author)
        mapping_data = {
            'review_id': review_data['id'],
            'author_id': current_user['id'],
            'ip_address': None,  # TODO: Get from request if needed
            'user_agent': None   # TODO: Get from request headers if needed
        }
        
        print(f"🔑 CREATING MAPPING: review_id={review_data['id']}, author_id={current_user['id']}")
        print(f"   Mapping data: {mapping_data}")
        
        # Insert mapping using authenticated client
        # RLS policy: "Users create own mappings" allows user to map their own review
        try:
            supabase.table('review_author_mappings').insert(mapping_data).execute()
            print(f"✅ MAPPING CREATED SUCCESSFULLY")
        except Exception as mapping_error:
            print(f"❌ MAPPING FAILED: {str(mapping_error)}")
            # If mapping fails, delete the review to maintain consistency
            supabase.table('reviews').delete().eq('id', review_data['id']).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create review mapping: {str(mapping_error)}"
            )
        
        # Run automated content filtering in background if review has text
        if request.review_text and request.review_text.strip():
            auto_flagging = AutoFlaggingSystem(supabase)
            background_tasks.add_task(
                auto_flagging.process_review_content,
                review_data['id'],
                request.review_text,
                current_user['id'] if current_user else 'anonymous'
            )
        
        # Update professor's average rating and total reviews count
        # Get all APPROVED reviews for this professor to calculate new average
        all_reviews = supabase.table('reviews').select('overall_rating').eq(
            'professor_id', request.professor_id
        ).eq('status', 'approved').execute()
        
        if all_reviews.data:
            total_reviews = len(all_reviews.data)
            average_rating = sum(review['overall_rating'] for review in all_reviews.data) / total_reviews
            
            # Update professor record
            supabase.table('professors').update({
                'average_rating': round(average_rating, 1),
                'total_reviews': total_reviews
            }).eq('id', request.professor_id).execute()
        
        print(f"✅ Review created successfully: {review_data['id']}")
        print(f"📊 Review data keys: {review_data.keys()}")
        
        # Return simple dict response (avoid Pydantic serialization issues)
        return {
            "id": str(review_data['id']),
            "professor_id": str(review_data['professor_id']),
            "overall_rating": review_data['overall_rating'],
            "difficulty_rating": review_data['difficulty_rating'],
            "clarity_rating": review_data['clarity_rating'],
            "helpfulness_rating": review_data['helpfulness_rating'],
            "course_name": review_data['course_name'],
            "semester": review_data.get('semester'),
            "academic_year": review_data.get('academic_year'),
            "review_text": review_data.get('review_text'),
            "verified_student": review_data.get('verified_student', True),
            "would_take_again": review_data.get('would_take_again'),
            "assignment_load": review_data.get('assignment_load'),
            "created_at": str(review_data['created_at']),
            "updated_at": str(review_data['updated_at']) if review_data.get('updated_at') else None,
            "helpful_count": review_data.get('helpful_count', 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ ERROR creating review: {str(e)}")
        print(f"Traceback: {error_trace}")
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
        # Get admin client for database operations (bypasses RLS)
        from src.lib.database import get_supabase_admin
        supabase_admin = get_supabase_admin()
        if not supabase_admin:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database admin client not available"
            )
        
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
        
        # Check if user already flagged this review (use admin client)
        existing_flag = supabase_admin.table('review_flags').select('id').eq(
            'review_id', review_id
        ).eq('flagger_user_id', current_user['id']).execute()
        
        if existing_flag.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User has already flagged this review"
            )
        
        # Create flag record (use admin client)
        flag_data = {
            'review_id': review_id,
            'flagger_user_id': current_user['id'],
            'reason': request.reason,
            'description': request.description
        }
        
        supabase_admin.table('review_flags').insert(flag_data).execute()
        
        return {"message": "Review flagged for moderation"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to flag review: {str(e)}"
        )


@router.get("/my-reviews")
async def get_my_reviews(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get current user's reviews using the mapping table.
    
    Returns all reviews submitted by the authenticated user.
    Uses the review_author_mappings table to find user's reviews while maintaining anonymity.
    """
    try:
        if not current_user or not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        # Get the access token from the authorization header
        access_token = credentials.credentials
        
        # Create a new Supabase client with the user's auth token
        # This ensures RLS policies use auth.uid() correctly
        SUPABASE_URL = os.getenv("SUPABASE_URL", "")
        SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
        
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase configuration missing"
            )
            
        auth_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        # Set the auth header for this client
        auth_client.postgrest.auth(access_token)
        
        print(f"🔍 Fetching reviews for user: {current_user['id']}")
        
        # Get user's review IDs from the mapping table
        # RLS policy: Users can read their own mappings via auth.uid()
        mappings = auth_client.table('review_author_mappings').select(
            'review_id'
        ).execute()
        
        print(f"📊 Mappings found: {len(mappings.data) if mappings.data else 0}")
        
        if not mappings.data:
            return {"reviews": [], "total": 0}
        
        # Extract review IDs
        review_ids = [m['review_id'] for m in mappings.data]
        print(f"📝 Review IDs: {review_ids}")
        
        # Fetch the actual reviews
        reviews_result = auth_client.table('reviews').select(
            '*, professors(id, name, department)'
        ).in_('id', review_ids).order('created_at', desc=True).execute()
        
        print(f"✅ Reviews fetched: {len(reviews_result.data) if reviews_result.data else 0}")
        
        if not reviews_result.data:
            return {"reviews": [], "total": 0}
        
        # Format response
        formatted_reviews = []
        for review in reviews_result.data:
            formatted_reviews.append({
                "id": review['id'],
                "professorId": review['professor_id'],
                "professorName": review['professors']['name'] if review.get('professors') else 'Unknown',
                "professorDepartment": review['professors']['department'] if review.get('professors') else 'Unknown',
                "courseName": review.get('course_name', 'Unknown'),
                "semester": review.get('semester'),
                "academicYear": review.get('academic_year'),
                "overallRating": review.get('overall_rating', 0),
                "difficultyRating": review.get('difficulty_rating', 0),
                "clarityRating": review.get('clarity_rating', 0),
                "helpfulnessRating": review.get('helpfulness_rating', 0),
                "reviewText": review.get('review_text'),
                "attendanceMandatory": review.get('would_take_again'),
                "assignmentLoad": review.get('assignment_load'),
                "createdAt": str(review.get('created_at')),
                "status": review.get('status', 'approved')
            })
        
        return {
            "reviews": formatted_reviews,
            "total": len(formatted_reviews)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR fetching my reviews: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch reviews: {str(e)}"
        )


@router.delete("/{review_id}")
async def delete_my_review(
    review_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Delete a review (only if it belongs to the current user).
    
    Deletes both the review and its mapping entry.
    Also updates professor's rating and total_reviews count.
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
        
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        # Check if this review belongs to the current user
        # RLS policy: Users can read their own mappings via auth.uid()
        mapping = supabase.table('review_author_mappings').select(
            'review_id, author_id'
        ).eq('review_id', review_id).eq('author_id', current_user['id']).single().execute()
        
        if not mapping.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own reviews"
            )
        
        # Get review info before deleting (for professor update)
        review = supabase.table('reviews').select('professor_id, overall_rating').eq(
            'id', review_id
        ).single().execute()
        
        if not review.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        professor_id = review.data['professor_id']
        
        # Delete the mapping first (foreign key will cascade delete if configured, but let's be explicit)
        # RLS policy: Users can delete their own mappings via auth.uid()
        supabase.table('review_author_mappings').delete().eq(
            'review_id', review_id
        ).execute()
        
        # Delete the review
        supabase.table('reviews').delete().eq('id', review_id).execute()
        
        print(f"✅ DELETED REVIEW: {review_id}")
        
        # Update professor's stats - only count APPROVED reviews
        all_reviews = supabase.table('reviews').select('overall_rating').eq(
            'professor_id', professor_id
        ).eq('status', 'approved').execute()
        
        if all_reviews.data and len(all_reviews.data) > 0:
            total_reviews = len(all_reviews.data)
            average_rating = sum(r['overall_rating'] for r in all_reviews.data) / total_reviews
            
            supabase.table('professors').update({
                'average_rating': round(average_rating, 1),
                'total_reviews': total_reviews
            }).eq('id', professor_id).execute()
        else:
            # No approved reviews left, set to 0
            supabase.table('professors').update({
                'average_rating': 0.0,
                'total_reviews': 0
            }).eq('id', professor_id).execute()
        
        return {
            "message": "Review deleted successfully",
            "review_id": review_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR deleting review: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete review: {str(e)}"
        )


@router.get("/professor/{professor_id}")
async def get_professor_reviews(
    professor_id: str,
    limit: int = 50,
    offset: int = 0,
    supabase: Client = Depends(get_supabase)
):
    """Get all reviews for a specific professor.
    
    Returns paginated list of reviews for the given professor ID.
    Includes review ratings, text, and user info (if not anonymous).
    """
    try:
        # Validate UUID format
        try:
            UUID(professor_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid professor ID format"
            )
        
        # Check if professor exists
        prof_check = supabase.table('professors').select('id').eq('id', professor_id).single().execute()
        if not prof_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor not found"
            )
        
        # Fetch reviews for this professor
        result = supabase.table('reviews').select('*').eq(
            'professor_id', professor_id
        ).range(offset, offset + limit - 1).order('created_at', desc=True).execute()
        
        reviews = []
        for review_data in result.data:
            reviews.append(Review(**review_data))
        
        return {
            "reviews": reviews,
            "total": len(result.data),
            "offset": offset,
            "limit": limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch reviews: {str(e)}"
        )


class VoteRequest(BaseModel):
    vote_type: str
    
    @field_validator('vote_type')
    @classmethod
    def validate_vote_type(cls, v):
        if v not in ['helpful', 'not_helpful']:
            raise ValueError('Vote type must be "helpful" or "not_helpful"')
        return v


@router.post("/{review_id}/vote", status_code=status.HTTP_200_OK)
async def vote_on_review(
    review_id: str,
    request: VoteRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Vote on review helpfulness (OPTIMIZED).
    
    Users can mark reviews as helpful or not helpful.
    Streamlined to reduce database round-trips.
    """
    try:
        # Get admin client for database operations (bypasses RLS)
        from src.lib.database import get_supabase_admin
        supabase_admin = get_supabase_admin()
        if not supabase_admin:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database admin client not available"
            )
        
        # Validate review ID
        try:
            UUID(review_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid review ID format"
            )
        
        user_id = current_user['id']
        
        # Check existing vote (use admin client)
        existing_result = supabase_admin.table('review_votes').select('vote_type').eq(
            'review_id', review_id
        ).eq('user_id', user_id).execute()
        
        old_vote = existing_result.data[0]['vote_type'] if existing_result.data else None
        
        # Determine the action and prepare count updates
        helpful_delta = 0
        not_helpful_delta = 0
        action = ""
        final_vote = None
        
        if old_vote == request.vote_type:
            # Toggle off - remove vote
            supabase_admin.table('review_votes').delete().eq(
                'review_id', review_id
            ).eq('user_id', user_id).execute()
            
            # Decrement the appropriate count
            if old_vote == 'helpful':
                helpful_delta = -1
            else:
                not_helpful_delta = -1
            
            action = "removed"
            final_vote = None
            
        elif old_vote and old_vote != request.vote_type:
            # Change vote
            supabase_admin.table('review_votes').update({
                'vote_type': request.vote_type
            }).eq('review_id', review_id).eq('user_id', user_id).execute()
            
            # Swap counts
            if old_vote == 'helpful':
                helpful_delta = -1
                not_helpful_delta = 1
            else:
                helpful_delta = 1
                not_helpful_delta = -1
            
            action = "updated"
            final_vote = request.vote_type
            
        else:
            # New vote
            supabase_admin.table('review_votes').insert({
                'review_id': review_id,
                'user_id': user_id,
                'vote_type': request.vote_type
            }).execute()
            
            # Increment the appropriate count
            if request.vote_type == 'helpful':
                helpful_delta = 1
            else:
                not_helpful_delta = 1
            
            action = "created"
            final_vote = request.vote_type
        
        # Update counts if needed (single query)
        if helpful_delta != 0 or not_helpful_delta != 0:
            # Get current review to calculate new counts
            review = supabase_admin.table('reviews').select(
                'helpful_count, not_helpful_count'
            ).eq('id', review_id).single().execute()
            
            if review.data:
                new_helpful = max(0, review.data.get('helpful_count', 0) + helpful_delta)
                new_not_helpful = max(0, review.data.get('not_helpful_count', 0) + not_helpful_delta)
                
                # Update in one query
                supabase_admin.table('reviews').update({
                    'helpful_count': new_helpful,
                    'not_helpful_count': new_not_helpful
                }).eq('id', review_id).execute()
                
                return {
                    "message": f"Vote {action}",
                    "action": action,
                    "vote_type": final_vote,
                    "helpful_count": new_helpful,
                    "not_helpful_count": new_not_helpful,
                    "user_vote": final_vote
                }
        
        # Fallback response
        return {
            "message": f"Vote {action}",
            "action": action,
            "vote_type": final_vote,
            "user_vote": final_vote
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to vote on review: {str(e)}"
        )
