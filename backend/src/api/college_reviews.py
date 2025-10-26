"""College Reviews API routes for RateMyProf backend.

Handles college review creation, retrieval, and management endpoints for the platform.
All college reviews are anonymous to protect student privacy.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator
from supabase import Client

from src.lib.database import get_supabase
from src.lib.auth import get_current_user, get_authenticated_supabase

router = APIRouter()

# Review Guidelines
REVIEW_GUIDELINES = [
    "Be respectful and constructive in your feedback",
    "No vulgar language, personal attacks, or offensive content",
    "Focus on factual experiences with specific aspects (food, facilities, etc.)",
    "Do not reveal personal information about yourself or others",
    "Reviews containing hate speech, discrimination, or harassment will be removed",
    "Fake reviews or spam will result in account suspension",
    "Use appropriate language and maintain academic discourse",
    "Provide honest feedback that would help other students",
    "Reviews are anonymous - your identity will not be revealed",
    "All reviews go through moderation before being published"
]

# Request/Response Models
class CollegeRatings(BaseModel):
    food: int
    internet: int
    clubs: int
    opportunities: int
    facilities: int
    teaching: int
    overall: int
    
    @field_validator('food', 'internet', 'clubs', 'opportunities', 'facilities', 'teaching', 'overall')
    @classmethod
    def validate_ratings(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Rating must be between 1 and 5')
        return v


class CollegeReviewCreate(BaseModel):
    college_id: str
    ratings: CollegeRatings
    review_text: Optional[str] = None
    course_name: str
    year_of_study: str
    graduation_year: Optional[int] = None
    
    @field_validator('college_id')
    @classmethod
    def validate_college_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('College ID is required')
        return v.strip()
    
    @field_validator('course_name')
    @classmethod
    def validate_course_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Course name is required')
        v = v.strip()
        if len(v) > 200:
            raise ValueError('Course name cannot exceed 200 characters')
        return v
    
    @field_validator('year_of_study')
    @classmethod
    def validate_year_of_study(cls, v):
        valid_years = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate', 'Postgraduate']
        if v not in valid_years:
            raise ValueError(f'Year of study must be one of: {", ".join(valid_years)}')
        return v
    
    @field_validator('review_text')
    @classmethod
    def validate_review_text(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 2000:
                raise ValueError('Review text cannot exceed 2000 characters')
            if len(v) == 0:
                v = None
            # Basic content validation
            forbidden_words = ['fuck', 'shit', 'damn', 'bastard', 'bitch']  # Add more as needed
            if v and any(word in v.lower() for word in forbidden_words):
                raise ValueError('Review contains inappropriate language')
        return v
    
    @field_validator('graduation_year')
    @classmethod
    def validate_graduation_year(cls, v):
        if v is not None:
            current_year = 2024
            if v < current_year - 5 or v > current_year + 6:
                raise ValueError('Graduation year must be realistic')
        return v


class CollegeReviewUpdate(BaseModel):
    ratings: Optional[CollegeRatings] = None
    review_text: Optional[str] = None
    course_name: Optional[str] = None
    year_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    
    @field_validator('review_text')
    @classmethod
    def validate_review_text(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 2000:
                raise ValueError('Review text cannot exceed 2000 characters')
            # Basic content validation
            forbidden_words = ['fuck', 'shit', 'damn', 'bastard', 'bitch']
            if v and any(word in v.lower() for word in forbidden_words):
                raise ValueError('Review contains inappropriate language')
        return v


class CollegeReview(BaseModel):
    id: str
    college_id: str
    ratings: Dict[str, int]
    course_name: str
    year_of_study: str
    graduation_year: Optional[int] = None
    review_text: Optional[str] = None
    anonymous: bool = True  # Always True for college reviews
    status: str = "approved"
    created_at: str
    updated_at: Optional[str] = None
    helpful_count: int = 0
    not_helpful_count: int = 0


class CollegeReviewsResponse(BaseModel):
    reviews: List[CollegeReview]
    total: int
    average_ratings: Dict[str, float]
    has_more: bool


class ReviewGuidelines(BaseModel):
    guidelines: List[str]
    title: str = "College Review Guidelines"
    description: str = "Please read these guidelines before submitting your review"


@router.get("/guidelines", response_model=ReviewGuidelines)
async def get_review_guidelines():
    """Get college review guidelines and rules.
    
    Returns the list of guidelines that students should follow when writing reviews.
    """
    return ReviewGuidelines(
        guidelines=REVIEW_GUIDELINES
    )


@router.get("/my-reviews")
async def get_my_college_reviews(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get current user's college reviews using the mapping table.
    
    Returns all college reviews submitted by the authenticated user.
    Uses the college_review_author_mappings table to find user's reviews.
    """
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        # Get user's review IDs from the mapping table
        # RLS policy: Users can read their own mappings via auth.uid()
        mappings = supabase.table('college_review_author_mappings').select(
            'review_id'
        ).eq('author_id', current_user['id']).execute()
        
        if not mappings.data:
            return {"reviews": [], "total": 0}
        
        # Extract review IDs
        review_ids = [m['review_id'] for m in mappings.data]
        
        # Fetch the actual reviews with college details
        reviews_result = supabase.table('college_reviews').select(
            '*, colleges(id, name, city, state)'
        ).in_('id', review_ids).order('created_at', desc=True).execute()
        
        if not reviews_result.data:
            return {"reviews": [], "total": 0}
        
        # Format response
        formatted_reviews = []
        for review in reviews_result.data:
            formatted_reviews.append({
                "id": review['id'],
                "collegeId": review['college_id'],
                "collegeName": review['colleges']['name'] if review.get('colleges') else 'Unknown',
                "collegeCity": review['colleges']['city'] if review.get('colleges') else 'Unknown',
                "collegeState": review['colleges']['state'] if review.get('colleges') else 'Unknown',
                "courseName": review.get('course_name'),
                "yearOfStudy": review.get('year_of_study'),
                "graduationYear": review.get('graduation_year'),
                "ratings": {
                    "food": review.get('food_rating', 0),
                    "internet": review.get('internet_rating', 0),
                    "clubs": review.get('clubs_rating', 0),
                    "opportunities": review.get('opportunities_rating', 0),
                    "facilities": review.get('facilities_rating', 0),
                    "teaching": review.get('teaching_rating', 0),
                    "overall": review.get('overall_rating', 0)
                },
                "reviewText": review.get('review_text'),
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
        print(f"Error fetching user's college reviews: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch college reviews: {str(e)}"
        )


@router.post("", response_model=CollegeReview, status_code=status.HTTP_201_CREATED)
async def create_college_review(
    request: CollegeReviewCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase)
):
    """Submit a review for a college.
    
    All college reviews are anonymous to protect student privacy.
    Authentication is required to prevent spam, but user identity is not revealed.
    Uses mapping table to link reviews to authors without storing user_id in review.
    
    **RLS Policy**: Uses authenticated client so RLS can verify auth.uid() IS NOT NULL.
    The authenticated client ensures the user's JWT is included in all requests.
    """
    try:
        print(f"\n{'='*80}")
        print(f"📝 CREATING COLLEGE REVIEW")
        print(f"   College ID: {request.college_id}")
        print(f"   User: {current_user['email']}")
        print(f"   Ratings: {request.ratings.dict()}")
        
        # Check if college exists
        college_check = supabase.table('colleges').select('id, name').eq('id', request.college_id).execute()
        if not college_check.data:
            print(f"❌ College not found: {request.college_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="College not found"
            )
        print(f"✅ College found: {college_check.data[0]['name']}")
        
        # Check for duplicate reviews using mapping table
        # RLS policy: Users can read their own mappings via auth.uid()
        existing_mapping = supabase.table('college_review_author_mappings').select(
            'id, review_id'
        ).eq('author_id', current_user['id']).execute()
        
        if existing_mapping.data:
            # Check if any of these reviews are for this college
            review_ids = [m['review_id'] for m in existing_mapping.data]
            existing_college_review = supabase.table('college_reviews').select('id').eq(
                'college_id', request.college_id
            ).in_('id', review_ids).execute()
            
            if existing_college_review.data:
                print(f"❌ User already reviewed this college")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="You have already reviewed this college"
                )
        
        print(f"✅ No duplicate review found")
        
        # Create review data (NO student_id - fully anonymous)
        review_data = {
            'college_id': request.college_id,
            # NO student_id - reviews are fully anonymous
            'food_rating': request.ratings.food,
            'internet_rating': request.ratings.internet,
            'clubs_rating': request.ratings.clubs,
            'opportunities_rating': request.ratings.opportunities,
            'facilities_rating': request.ratings.facilities,
            'teaching_rating': request.ratings.teaching,
            'overall_rating': request.ratings.overall,
            'course_name': request.course_name,
            'year_of_study': request.year_of_study,
            'graduation_year': request.graduation_year,
            'review_text': request.review_text,
            'anonymous': True,  # Always anonymous for college reviews
            'status': 'approved',  # Auto-approve for now
            'helpful_count': 0,
            'not_helpful_count': 0
        }
        
        # Insert review using authenticated client
        # RLS policy: "Authenticated users create college reviews" allows this
        result = supabase.table('college_reviews').insert(review_data).execute()
        review_data = result.data[0]
        print(f"✅ COLLEGE REVIEW INSERTED: {review_data['id']}")
        print(f"   Review ID type: {type(review_data['id'])}")
        
        # Create mapping to track authorship privately
        mapping_data = {
            'review_id': review_data['id'],
            'author_id': current_user['id'],
            'ip_address': None,
            'user_agent': None
        }
        
        print(f"🔑 CREATING MAPPING: review_id={review_data['id']}, author_id={current_user['id']}")
        
        # Insert mapping using authenticated client
        # RLS policy: "Users create own college review mappings" allows user to map their own review
        try:
            supabase.table('college_review_author_mappings').insert(mapping_data).execute()
            print(f"✅ MAPPING CREATED SUCCESSFULLY")
        except Exception as mapping_error:
            print(f"❌ MAPPING FAILED: {str(mapping_error)}")
            # Rollback: delete the review if mapping fails
            supabase.table('college_reviews').delete().eq('id', review_data['id']).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create review mapping: {str(mapping_error)}"
            )
        
        # Update college statistics
        await _update_college_stats(request.college_id, supabase)
        print(f"✅ College stats updated")
        
        # Transform response to match expected format
        response_data = {
            'id': review_data['id'],
            'college_id': review_data['college_id'],
            'ratings': {
                'food': review_data['food_rating'],
                'internet': review_data['internet_rating'],
                'clubs': review_data['clubs_rating'],
                'opportunities': review_data['opportunities_rating'],
                'facilities': review_data['facilities_rating'],
                'teaching': review_data['teaching_rating'],
                'overall': review_data['overall_rating']
            },
            'course_name': review_data['course_name'],
            'year_of_study': review_data['year_of_study'],
            'graduation_year': review_data['graduation_year'],
            'review_text': review_data['review_text'],
            'anonymous': True,
            'status': review_data['status'],
            'created_at': review_data['created_at'],
            'updated_at': review_data.get('updated_at'),
            'helpful_count': review_data['helpful_count'],
            'not_helpful_count': review_data['not_helpful_count']
        }
        
        print(f"✅ COLLEGE REVIEW CREATED SUCCESSFULLY!")
        print(f"{'='*80}\n")
        return CollegeReview(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR creating college review: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create college review: {str(e)}"
        )


@router.get("/college/{college_id}", response_model=CollegeReviewsResponse)
async def get_college_reviews(
    college_id: str,
    limit: int = Query(20, ge=1, le=50, description="Maximum results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    supabase: Client = Depends(get_supabase)
):
    """Get reviews for a specific college.
    
    Returns paginated list of college reviews with average ratings.
    All reviews are anonymous to protect student privacy.
    """
    try:
        # Check if college exists
        college_check = supabase.table('colleges').select('id, name').eq('id', college_id).single().execute()
        if not college_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College not found"
            )
        
        # Get approved reviews with pagination
        reviews_result = supabase.table('college_reviews').select('''
            id, college_id, food_rating, internet_rating, clubs_rating,
            opportunities_rating, facilities_rating, teaching_rating, overall_rating,
            course_name, year_of_study, graduation_year, review_text,
            anonymous, status, created_at, updated_at, helpful_count, not_helpful_count
        ''').eq('college_id', college_id).eq('status', 'approved').order(
            'created_at', desc=True
        ).range(offset, offset + limit - 1).execute()
        
        # Transform reviews for response
        reviews = []
        for review_data in reviews_result.data:
            review = {
                'id': review_data['id'],
                'college_id': review_data['college_id'],
                'ratings': {
                    'food': review_data['food_rating'],
                    'internet': review_data['internet_rating'],
                    'clubs': review_data['clubs_rating'],
                    'opportunities': review_data['opportunities_rating'],
                    'facilities': review_data['facilities_rating'],
                    'teaching': review_data['teaching_rating'],
                    'overall': review_data['overall_rating']
                },
                'course_name': review_data['course_name'],
                'year_of_study': review_data['year_of_study'],
                'graduation_year': review_data['graduation_year'],
                'review_text': review_data['review_text'],
                'anonymous': True,  # Always anonymous
                'status': review_data['status'],
                'created_at': review_data['created_at'],
                'updated_at': review_data.get('updated_at'),
                'helpful_count': review_data['helpful_count'],
                'not_helpful_count': review_data['not_helpful_count']
            }
            reviews.append(CollegeReview(**review))
        
        # Get total count of approved reviews
        count_result = supabase.table('college_reviews').select(
            'id', count='exact'
        ).eq('college_id', college_id).eq('status', 'approved').execute()
        total = count_result.count or 0
        
        # Calculate average ratings
        avg_ratings = await _calculate_average_ratings(college_id, supabase)
        
        # Check if there are more reviews
        has_more = offset + len(reviews) < total
        
        return CollegeReviewsResponse(
            reviews=reviews,
            total=total,
            average_ratings=avg_ratings,
            has_more=has_more
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get college reviews: {str(e)}"
        )


@router.put("/{review_id}", response_model=CollegeReview)
async def update_college_review(
    review_id: str,
    request: CollegeReviewUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Update an existing college review.
    
    Allows users to update their own college reviews.
    Uses mapping table to verify ownership.
    
    **RLS Policy**: "Users update own college reviews" enforces ownership check via
    college_review_author_mappings table.
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
        existing = supabase.table('college_reviews').select('*').eq('id', review_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College review not found"
            )
        
        # Check ownership using mapping table
        # RLS policy: Users can read their own mappings via auth.uid()
        mapping = supabase.table('college_review_author_mappings').select('author_id').eq(
            'review_id', review_id
        ).execute()
        
        if not mapping.data or mapping.data[0]['author_id'] != current_user['id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot update review belonging to another user"
            )
        
        # Build update data
        update_data = {}
        if request.ratings:
            update_data.update({
                'food_rating': request.ratings.food,
                'internet_rating': request.ratings.internet,
                'clubs_rating': request.ratings.clubs,
                'opportunities_rating': request.ratings.opportunities,
                'facilities_rating': request.ratings.facilities,
                'teaching_rating': request.ratings.teaching,
                'overall_rating': request.ratings.overall,
            })
        
        if request.review_text is not None:
            update_data['review_text'] = request.review_text
        if request.course_name is not None:
            update_data['course_name'] = request.course_name
        if request.year_of_study is not None:
            update_data['year_of_study'] = request.year_of_study
        if request.graduation_year is not None:
            update_data['graduation_year'] = request.graduation_year
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="At least one field must be provided for update"
            )
        
        # Update the review using authenticated client
        # RLS policy: "Users update own college reviews" enforces ownership via mapping
        result = supabase.table('college_reviews').update(update_data).eq('id', review_id).execute()
        updated_review = result.data[0]
        
        # Update college statistics
        await _update_college_stats(updated_review['college_id'], supabase)
        
        # Transform response
        response_data = {
            'id': updated_review['id'],
            'college_id': updated_review['college_id'],
            'ratings': {
                'food': updated_review['food_rating'],
                'internet': updated_review['internet_rating'],
                'clubs': updated_review['clubs_rating'],
                'opportunities': updated_review['opportunities_rating'],
                'facilities': updated_review['facilities_rating'],
                'teaching': updated_review['teaching_rating'],
                'overall': updated_review['overall_rating']
            },
            'course_name': updated_review['course_name'],
            'year_of_study': updated_review['year_of_study'],
            'graduation_year': updated_review['graduation_year'],
            'review_text': updated_review['review_text'],
            'anonymous': True,
            'status': updated_review['status'],
            'created_at': updated_review['created_at'],
            'updated_at': updated_review.get('updated_at'),
            'helpful_count': updated_review['helpful_count'],
            'not_helpful_count': updated_review['not_helpful_count']
        }
        
        return CollegeReview(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update college review: {str(e)}"
        )


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_college_review(
    review_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Delete a college review.
    
    Allows users to delete their own college reviews.
    Uses mapping table to verify ownership.
    
    **RLS Policy**: "Users delete own college reviews" enforces ownership check via
    college_review_author_mappings table.
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
        existing = supabase.table('college_reviews').select('*').eq('id', review_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College review not found"
            )
        
        # Check ownership using mapping table
        # RLS policy: Users can read their own mappings via auth.uid()
        mapping = supabase.table('college_review_author_mappings').select('author_id').eq(
            'review_id', review_id
        ).execute()
        
        if not mapping.data or mapping.data[0]['author_id'] != current_user['id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete review belonging to another user"
            )
        
        college_id = existing.data[0]['college_id']
        
        # Delete the mapping first
        # RLS policy: Users can delete their own mappings via auth.uid()
        supabase.table('college_review_author_mappings').delete().eq('review_id', review_id).execute()
        
        # Delete the review
        # RLS policy: "Users delete own college reviews" enforces ownership
        supabase.table('college_reviews').delete().eq('id', review_id).execute()
        
        # Update college statistics
        await _update_college_stats(college_id, supabase)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete college review: {str(e)}"
        )


# Helper functions
async def _calculate_average_ratings(college_id: str, supabase: Client) -> Dict[str, float]:
    """Calculate average ratings for a college."""
    try:
        reviews = supabase.table('college_reviews').select('''
            food_rating, internet_rating, clubs_rating, opportunities_rating,
            facilities_rating, teaching_rating, overall_rating
        ''').eq('college_id', college_id).eq('status', 'approved').execute()
        
        if not reviews.data:
            return {
                'food': 0.0,
                'internet': 0.0,
                'clubs': 0.0,
                'opportunities': 0.0,
                'facilities': 0.0,
                'teaching': 0.0,
                'overall': 0.0
            }
        
        # Calculate averages
        totals = {
            'food': sum(r['food_rating'] for r in reviews.data),
            'internet': sum(r['internet_rating'] for r in reviews.data),
            'clubs': sum(r['clubs_rating'] for r in reviews.data),
            'opportunities': sum(r['opportunities_rating'] for r in reviews.data),
            'facilities': sum(r['facilities_rating'] for r in reviews.data),
            'teaching': sum(r['teaching_rating'] for r in reviews.data),
            'overall': sum(r['overall_rating'] for r in reviews.data)
        }
        
        count = len(reviews.data)
        averages = {key: round(total / count, 1) for key, total in totals.items()}
        
        return averages
        
    except Exception:
        return {
            'food': 0.0,
            'internet': 0.0,
            'clubs': 0.0,
            'opportunities': 0.0,
            'facilities': 0.0,
            'teaching': 0.0,
            'overall': 0.0
        }


async def _update_college_stats(college_id: str, supabase: Client):
    """Update college statistics based on reviews."""
    try:
        # Get all approved reviews for this college
        reviews = supabase.table('college_reviews').select(
            'overall_rating'
        ).eq('college_id', college_id).eq('status', 'approved').execute()
        
        if reviews.data:
            total_reviews = len(reviews.data)
            average_rating = sum(r['overall_rating'] for r in reviews.data) / total_reviews
            
            # Update college record with review statistics
            supabase.table('colleges').update({
                'total_reviews': total_reviews,
                'average_rating': round(average_rating, 1)
            }).eq('id', college_id).execute()
    except Exception:
        # Silently fail - stats update is not critical
        pass


# Voting endpoints
class CollegeReviewVote(BaseModel):
    vote_type: str  # 'helpful' or 'not_helpful'
    
    @field_validator('vote_type')
    @classmethod
    def validate_vote_type(cls, v):
        if v not in ['helpful', 'not_helpful']:
            raise ValueError('Vote type must be "helpful" or "not_helpful"')
        return v


@router.post("/{review_id}/vote")
async def vote_on_college_review(
    review_id: str,
    vote_data: CollegeReviewVote,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase)
):
    """Vote on a college review as helpful or not helpful.
    
    Users can only have one vote per review. If they vote again,
    their previous vote is updated.
    
    NOTE: This endpoint uses an authenticated Supabase client so that
    RLS policies can correctly identify the user via auth.uid().
    """
    try:
        user_id = current_user['id']
        print(f"[VOTE DEBUG] User ID: {user_id}, Review ID: {review_id}, Vote Type: {vote_data.vote_type}")
        
        # Check if review exists
        review = supabase.table('college_reviews').select('id, helpful_count, not_helpful_count').eq('id', review_id).single().execute()
        print(f"[VOTE DEBUG] Review query response: {review}")
        
        if not review.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College review not found"
            )
        
        # Check if user has already voted
        existing_vote = supabase.table('college_review_votes').select('*').eq(
            'college_review_id', review_id
        ).eq('user_id', user_id).execute()
        print(f"[VOTE DEBUG] Existing vote query response: {existing_vote}")
        
        if existing_vote.data:
            # User has already voted - update their vote
            old_vote = existing_vote.data[0]
            old_vote_type = old_vote['vote_type']
            
            if old_vote_type == vote_data.vote_type:
                # Same vote - no change needed
                return {
                    "message": "Vote already recorded",
                    "vote_type": vote_data.vote_type
                }
            
            # Update the vote using regular client
            supabase.table('college_review_votes').update({
                'vote_type': vote_data.vote_type
            }).eq('id', old_vote['id']).execute()
            
            # Update review counts
            current_helpful = review.data['helpful_count'] or 0
            current_not_helpful = review.data['not_helpful_count'] or 0
            
            if old_vote_type == 'helpful':
                current_helpful = max(0, current_helpful - 1)
                current_not_helpful += 1
            else:
                current_not_helpful = max(0, current_not_helpful - 1)
                current_helpful += 1
            
            supabase.table('college_reviews').update({
                'helpful_count': current_helpful,
                'not_helpful_count': current_not_helpful
            }).eq('id', review_id).execute()
            
            return {
                "message": "Vote updated successfully",
                "vote_type": vote_data.vote_type,
                "helpful_count": current_helpful,
                "not_helpful_count": current_not_helpful,
                "user_vote": vote_data.vote_type  # Add this so frontend knows current vote
            }
        else:
            # New vote - use regular client
            print(f"[VOTE DEBUG] Inserting new vote: college_review_id={review_id}, user_id={user_id}, vote_type={vote_data.vote_type}")
            
            insert_response = supabase.table('college_review_votes').insert({
                'college_review_id': review_id,
                'user_id': user_id,
                'vote_type': vote_data.vote_type
            }).execute()
            print(f"[VOTE DEBUG] Insert response: {insert_response}")
            
            # Update review counts
            current_helpful = review.data['helpful_count'] or 0
            current_not_helpful = review.data['not_helpful_count'] or 0
            
            if vote_data.vote_type == 'helpful':
                current_helpful += 1
            else:
                current_not_helpful += 1
            
            supabase.table('college_reviews').update({
                'helpful_count': current_helpful,
                'not_helpful_count': current_not_helpful
            }).eq('id', review_id).execute()
            
            return {
                "message": "Vote recorded successfully",
                "vote_type": vote_data.vote_type,
                "helpful_count": current_helpful,
                "not_helpful_count": current_not_helpful,
                "user_vote": vote_data.vote_type  # Add this so frontend knows current vote
            }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record vote: {str(e)}"
        )


@router.delete("/{review_id}/vote")
async def remove_vote_from_college_review(
    review_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Remove a user's vote from a college review."""
    try:
        user_id = current_user['id']
        
        # Check if review exists
        review = supabase.table('college_reviews').select('id, helpful_count, not_helpful_count').eq('id', review_id).single().execute()
        if not review.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College review not found"
            )
        
        # Find and delete the vote
        existing_vote = supabase.table('college_review_votes').select('*').eq(
            'college_review_id', review_id
        ).eq('user_id', user_id).execute()
        
        if not existing_vote.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No vote found to remove"
            )
        
        vote = existing_vote.data[0]
        vote_type = vote['vote_type']
        
        # Delete the vote using regular client
        supabase.table('college_review_votes').delete().eq('id', vote['id']).execute()
        
        # Update review counts
        current_helpful = review.data['helpful_count'] or 0
        current_not_helpful = review.data['not_helpful_count'] or 0
        
        if vote_type == 'helpful':
            current_helpful = max(0, current_helpful - 1)
        else:
            current_not_helpful = max(0, current_not_helpful - 1)
        
        supabase.table('college_reviews').update({
            'helpful_count': current_helpful,
            'not_helpful_count': current_not_helpful
        }).eq('id', review_id).execute()
        
        return {
            "message": "Vote removed successfully",
            "helpful_count": current_helpful,
            "not_helpful_count": current_not_helpful
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove vote: {str(e)}"
        )


@router.get("/{review_id}/user-vote")
async def get_user_vote_on_college_review(
    review_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get the current user's vote on a college review."""
    try:
        user_id = current_user['id']
        
        vote = supabase.table('college_review_votes').select('vote_type').eq(
            'college_review_id', review_id
        ).eq('user_id', user_id).execute()
        
        if vote.data:
            return {
                "has_voted": True,
                "vote_type": vote.data[0]['vote_type']
            }
        else:
            return {
                "has_voted": False,
                "vote_type": None
            }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user vote: {str(e)}"
        )
