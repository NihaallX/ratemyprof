"""Professors API routes for RateMyProf backend.

Handles professor search, profile retrieval, and professor management
endpoints for the platform.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from pydantic import BaseModel, field_validator
from supabase import Client

from src.lib.database import get_supabase
from src.lib.auth import get_current_user
from src.lib.rate_limiting_supabase import check_rate_limit, increment_action_count

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


class ProfessorCreate(BaseModel):
    name: str
    email: Optional[str] = None
    department: str
    designation: Optional[str] = None
    college_id: str
    subjects: List[str] = []
    biography: Optional[str] = None
    years_of_experience: Optional[int] = None
    education: Optional[str] = None
    research_interests: Optional[str] = None
    
    @field_validator('name', 'department')
    @classmethod
    def validate_required_fields(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Field cannot be empty')
        return v.strip()
    
    @field_validator('college_id')
    @classmethod
    def validate_college_id(cls, v):
        try:
            UUID(v)
            return v
        except ValueError:
            raise ValueError('Invalid college ID format')
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            v = v.strip().lower()
            if '@' not in v or len(v) < 5:
                raise ValueError('Invalid email format')
        return v


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
    limit: int = Query(20, ge=1, le=200, description="Maximum results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    supabase: Client = Depends(get_supabase)
):
    """Search professors by name, college, or department.
    
    Searches through the professor database with various filters to help
    students find professors at Indian colleges and universities.
    """
    try:
        # Build the query dynamically based on provided filters
        # Only show verified professors in search results
        query = supabase.table('professors').select(
            '''
            id,
            name,
            department,
            college:colleges!inner(id, name, city, state),
            average_rating,
            total_reviews
            '''
        ).eq('is_verified', True)
        
        # Apply filters
        if q:
            # Search in professor name
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
        
        # Apply pagination and ordering (order by total_reviews desc to get professors with reviews first)
        query = query.order('total_reviews', desc=True).order('name').range(offset, offset + limit - 1)
        
        result = query.execute()
        
        # Transform the data for response
        professors = []
        for prof_data in result.data:
            college_data = prof_data.pop('college', {})
            
            professor = ProfessorSummary(
                id=prof_data['id'],
                name=prof_data.get('name', ''),
                department=prof_data.get('department'),
                college_name=college_data.get('name', ''),
                college_id=college_data.get('id', ''),
                average_rating=prof_data.get('average_rating', 0.0),
                total_reviews=prof_data.get('total_reviews', 0)
            )
            professors.append(professor)
        
        # Get total count for pagination (simplified approach)
        count_query = supabase.table('professors').select('id')
        if q:
            count_query = count_query.or_(f'first_name.ilike.%{q}%,last_name.ilike.%{q}%')
        if college_id:
            count_query = count_query.eq('college_id', college_id)
        
        count_result = count_query.execute()
        total = len(count_result.data) if count_result.data else 0
        
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


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_professor(
    request: ProfessorCreate,
    fastapi_request: Request,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Create a new professor profile.
    
    Users can submit new professor profiles that will go through
    verification before appearing in search results.
    
    Rate limited to 3 professor creations per day per user.
    """
    try:
        # Check rate limit first (3 professors per day)
        check_rate_limit(supabase, current_user['id'], 'professor_create', fastapi_request)
        # Verify college exists
        college_result = supabase.table('colleges').select('id, name').eq(
            'id', request.college_id
        ).single().execute()
        
        if not college_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College not found"
            )
        
        # Check if professor already exists
        existing_prof = supabase.table('professors').select('id').eq(
            'name', request.name
        ).eq(
            'college_id', request.college_id
        ).execute()
        
        if existing_prof.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Professor already exists at this college"
            )
        
        # Create professor record (unverified by default - requires admin approval)
        prof_data = {
            'name': request.name,
            'email': request.email,
            'department': request.department,
            'designation': request.designation,
            'college_id': request.college_id,
            'subjects': ','.join(request.subjects) if request.subjects else None,
            'biography': request.biography,
            'years_of_experience': request.years_of_experience,
            'education': request.education,
            'research_interests': request.research_interests,
            'average_rating': 0.0,
            'total_reviews': 0,
            'is_verified': False  # Requires admin verification before appearing in search
        }
        
        result = supabase.table('professors').insert(prof_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create professor"
            )
        
        created_prof = result.data[0]
        
        # Increment the user's daily professor creation count
        increment_action_count(
            supabase, 
            current_user['id'], 
            'professor_create', 
            created_prof['id'], 
            fastapi_request
        )
        
        return {
            "id": created_prof['id'],
            "message": "Professor profile created successfully. It will be reviewed before appearing in search results.",
            "status": "pending_verification"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create professor: {str(e)}"
        )
