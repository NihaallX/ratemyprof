"""College Reviews API routes for RateMyProf backend.

Handles college review creation, retrieval, and management endpoints for the platform.
All college reviews are anonymous to protect student privacy.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator
from supabase import Client

from src.lib.database import get_supabase, get_supabase_admin
from src.lib.auth import get_current_user

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


@router.post("", response_model=CollegeReview, status_code=status.HTTP_201_CREATED)
async def create_college_review(
    request: CollegeReviewCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    supabase_admin: Client = Depends(get_supabase_admin)
):
    """Submit a review for a college.
    
    All college reviews are anonymous to protect student privacy.
    Authentication is required to prevent spam, but user identity is not revealed.
    Uses mapping table to link reviews to authors without storing user_id in review.
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
        existing_mapping = supabase_admin.table('college_review_author_mappings').select(
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
        
        # Use admin client to insert review (bypasses RLS)
        result = supabase_admin.table('college_reviews').insert(review_data).execute()
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
        
        try:
            supabase_admin.table('college_review_author_mappings').insert(mapping_data).execute()
            print(f"✅ MAPPING CREATED SUCCESSFULLY")
        except Exception as mapping_error:
            print(f"❌ MAPPING FAILED: {str(mapping_error)}")
            # Rollback: delete the review if mapping fails
            supabase_admin.table('college_reviews').delete().eq('id', review_data['id']).execute()
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
    supabase: Client = Depends(get_supabase),
    supabase_admin: Client = Depends(get_supabase_admin)
):
    """Update an existing college review.
    
    Allows users to update their own college reviews.
    Uses mapping table to verify ownership.
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
        mapping = supabase_admin.table('college_review_author_mappings').select('author_id').eq(
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
        
        # Update the review using admin client
        result = supabase_admin.table('college_reviews').update(update_data).eq('id', review_id).execute()
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
    supabase: Client = Depends(get_supabase),
    supabase_admin: Client = Depends(get_supabase_admin)
):
    """Delete a college review.
    
    Allows users to delete their own college reviews.
    Uses mapping table to verify ownership.
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
        mapping = supabase_admin.table('college_review_author_mappings').select('author_id').eq(
            'review_id', review_id
        ).execute()
        
        if not mapping.data or mapping.data[0]['author_id'] != current_user['id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete review belonging to another user"
            )
        
        college_id = existing.data[0]['college_id']
        
        # Delete the mapping first
        supabase_admin.table('college_review_author_mappings').delete().eq('review_id', review_id).execute()
        
        # Delete the review
        supabase_admin.table('college_reviews').delete().eq('id', review_id).execute()
        
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