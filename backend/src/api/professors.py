"""Professors API routes for RateMyProf backend.

Handles professor search, profile retrieval, and professor management
endpoints for the platform.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator
from supabase import Client

from src.lib.database import get_supabase

router = APIRouter()

# Response Models
class ProfessorSummary(BaseModel):
    id: str
    name: str
    department: Optional[str] = None
    college_name: str
    college_id: str
    average_rating: float  # Changed from average_ratings dict to simple float
    total_reviews: int
    designation: Optional[str] = None
    subjects: List[str] = []


class College(BaseModel):
    id: str
    name: str
    city: str
    state: str
    college_type: str


class Review(BaseModel):
    id: str
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


class ProfessorProfile(BaseModel):
    id: str
    name: str
    department: Optional[str] = None
    bio: Optional[str] = None
    college: College
    average_ratings: Dict[str, float]
    total_reviews: int
    reviews: List[Review]
    has_more_reviews: bool


class ProfessorsSearchResponse(BaseModel):
    professors: List[ProfessorSummary]
    total: int
    has_more: bool


@router.get("", response_model=ProfessorsSearchResponse)
async def search_professors(
    q: Optional[str] = Query(None, min_length=2, max_length=100, description="Search query (professor name)"),
    college_id: Optional[str] = Query(None, description="Filter by specific college"),
    college_name: Optional[str] = Query(None, max_length=200, description="Filter by college name (fuzzy match)"),
    department: Optional[str] = Query(None, max_length=100, description="Filter by department"),
    state: Optional[str] = Query(None, max_length=50, description="Filter by Indian state"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    supabase: Client = Depends(get_supabase)
):
    """Search professors by name, college, or department.
    
    Searches through the professor database with various filters to help
    students find professors at Indian colleges and universities.
    """
    try:
        # Build the query dynamically based on provided filters
        query = supabase.table('professors').select(
            '''
            id,
            name,
            department,
            college:colleges!inner(id, name, city, state),
            average_ratings,
            total_reviews
            '''
        )
        
        # Apply filters
        if q:
            query = query.ilike('name', f'%{q}%')
        
        if college_id:
            try:
                UUID(college_id)  # Validate UUID format
                query = query.eq('college_id', college_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid college_id format"
                )
        
        if college_name:
            query = query.ilike('colleges.name', f'%{college_name}%')
        
        if department:
            query = query.ilike('department', f'%{department}%')
        
        if state:
            query = query.ilike('colleges.state', f'%{state}%')
        
        # Apply pagination and ordering
        query = query.order('name').range(offset, offset + limit - 1)
        
        result = query.execute()
        
        # Transform the data for response
        professors = []
        for prof_data in result.data:
            college_data = prof_data.pop('college', {})
            professor = ProfessorSummary(
                id=prof_data['id'],
                name=prof_data['name'],
                department=prof_data.get('department'),
                college_name=college_data.get('name', ''),
                college_id=college_data.get('id', ''),
                average_ratings=prof_data.get('average_ratings', {}),
                total_reviews=prof_data.get('total_reviews', 0),
                city=college_data.get('city'),
                state=college_data.get('state')
            )
            professors.append(professor)
        
        # Get total count for pagination
        count_query = supabase.table('professors').select('id', count='exact')
        if q:
            count_query = count_query.ilike('name', f'%{q}%')
        if college_id:
            count_query = count_query.eq('college_id', college_id)
        # Add other filters for count...
        
        count_result = count_query.execute()
        total = count_result.count or 0
        
        return ProfessorsSearchResponse(
            professors=professors,
            total=total,
            has_more=offset + len(professors) < total
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search professors: {str(e)}"
        )


@router.get("/{professor_id}", response_model=ProfessorProfile)
async def get_professor(
    professor_id: str,
    reviews_limit: int = Query(20, ge=0, le=100, description="Number of reviews to include"),
    reviews_offset: int = Query(0, ge=0, description="Reviews pagination offset"),
    supabase: Client = Depends(get_supabase)
):
    """Get professor profile with reviews.
    
    Retrieves detailed professor information including reviews, ratings,
    and college information.
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
        
        # Get professor with college info
        prof_result = supabase.table('professors').select(
            '''
            id,
            name,
            department,
            bio,
            college:colleges!inner(id, name, city, state, college_type),
            average_ratings,
            total_reviews
            '''
        ).eq('id', professor_id).single().execute()
        
        if not prof_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor not found"
            )
        
        prof_data = prof_result.data
        college_data = prof_data.pop('college', {})
        
        # Get reviews with pagination
        reviews_result = supabase.table('reviews').select(
            '''
            id,
            user_id,
            ratings,
            review_text,
            semester_taken,
            course_taken,
            anonymous,
            anon_display_name,
            created_at,
            updated_at,
            helpful_count
            '''
        ).eq('professor_id', professor_id).order('created_at', desc=True).range(
            reviews_offset, reviews_offset + reviews_limit - 1
        ).execute()
        
        reviews = [Review(**review) for review in reviews_result.data]
        
        # Check if there are more reviews
        total_reviews = prof_data.get('total_reviews', 0)
        has_more_reviews = reviews_offset + len(reviews) < total_reviews
        
        college = College(
            id=college_data['id'],
            name=college_data['name'],
            city=college_data['city'],
            state=college_data['state'],
            college_type=college_data['college_type']
        )
        
        return ProfessorProfile(
            id=prof_data['id'],
            name=prof_data['name'],
            department=prof_data.get('department'),
            bio=prof_data.get('bio'),
            college=college,
            average_ratings=prof_data.get('average_ratings', {}),
            total_reviews=prof_data.get('total_reviews', 0),
            reviews=reviews,
            has_more_reviews=has_more_reviews
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get professor: {str(e)}"
        )
