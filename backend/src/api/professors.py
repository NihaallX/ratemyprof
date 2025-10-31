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
from src.lib.auth import get_current_user, get_authenticated_supabase
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
    supabase: Client = Depends(get_authenticated_supabase)
):
    """Create a new professor profile.
    
    Users can submit new professor profiles that will go through
    verification before appearing in search results.
    
    Rate limited to 3 professor creations per day per user.
    
    NOTE: Uses authenticated Supabase client so RLS policies can
    identify the user via auth.uid().
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
        import traceback
        traceback.print_exc()
        # Check if it's an RLS policy error
        error_str = str(e)
        if '42501' in error_str or 'policy' in error_str.lower():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database insert failed: Permission denied. Please contact support if this persists."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insert failed: {str(e)}"
        )


@router.get("/similar/{professor_id}")
async def get_similar_professors(
    professor_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Get similar professors based on college and department.
    
    Returns up to 3 professors from the same college and department.
    Excludes the current professor from results.
    """
    try:
        # Get current professor details
        prof_result = supabase.table('professors').select(
            'college_id, department'
        ).eq('id', professor_id).execute()
        
        if not prof_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor not found"
            )
        
        current_prof = prof_result.data[0]
        
        # Get similar professors - same college and department
        similar_result = supabase.table('professors').select(
            'id, name, department, average_rating, total_reviews, subjects'
        ).eq('college_id', current_prof['college_id']).eq(
            'department', current_prof['department']
        ).neq('id', professor_id).order(
            'average_rating', desc=True
        ).limit(3).execute()
        
        professors = []
        for prof in similar_result.data:
            professors.append({
                'id': prof['id'],
                'name': prof['name'],
                'department': prof['department'],
                'average_rating': prof['average_rating'] or 0.0,
                'total_reviews': prof['total_reviews'] or 0,
                'subjects': prof['subjects'].split(',') if prof.get('subjects') else []
            })
        
        return {
            'professors': professors,
            'total': len(professors)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch similar professors: {str(e)}"
        )


@router.get("/more-professors")
async def get_more_professors(
    college_id: Optional[str] = Query(None),
    exclude_id: Optional[str] = Query(None),
    limit: int = Query(6, ge=1, le=20),
    supabase: Client = Depends(get_supabase)
):
    """Get more professors to explore.
    
    Returns top-rated professors, optionally filtered by college.
    Can exclude a specific professor (useful for showing on professor detail page).
    """
    print(f"🔍 More professors request: college_id={college_id}, exclude_id={exclude_id}, limit={limit}")
    try:
        query = supabase.table('professors').select(
            'id, name, department, average_rating, total_reviews, subjects, college_id'
        )
        
        if college_id:
            query = query.eq('college_id', college_id)
        
        if exclude_id:
            query = query.neq('id', exclude_id)
        
        # Get top-rated professors with at least 1 review
        result = query.gt('total_reviews', 0).order(
            'average_rating', desc=True
        ).order('total_reviews', desc=True).limit(limit).execute()
        
        print(f"✅ Found {len(result.data)} more professors")
        
        professors = []
        for prof in result.data:
            professors.append({
                'id': prof['id'],
                'name': prof['name'],
                'department': prof['department'],
                'average_rating': prof['average_rating'] or 0.0,
                'total_reviews': prof['total_reviews'] or 0,
                'subjects': prof['subjects'].split(',') if prof.get('subjects') else []
            })
        
        return {
            'professors': professors,
            'total': len(professors)
        }
        
    except Exception as e:
        print(f"❌ More professors error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch professors: {str(e)}"
        )


@router.get("/compare")
async def compare_professors(
    ids: str = Query(..., description="Comma-separated professor IDs to compare"),
    supabase: Client = Depends(get_supabase)
):
    """Compare multiple professors side by side.
    
    Accepts up to 4 professor IDs separated by commas.
    Returns detailed comparison data including ratings and review stats.
    """
    try:
        print(f"🔍 Compare request received: ids={ids}")
        # Parse professor IDs
        professor_ids = [pid.strip() for pid in ids.split(',') if pid.strip()]
        print(f"📊 Parsed {len(professor_ids)} professor IDs: {professor_ids}")
        
        if len(professor_ids) < 2:
            print(f"❌ Error: Only {len(professor_ids)} professor(s) provided")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 2 professors are required for comparison"
            )
        
        if len(professor_ids) > 4:
            print(f"❌ Error: Too many professors ({len(professor_ids)})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 4 professors can be compared at once"
            )
        
        print(f"🔍 Fetching professor details from database...")
        # Fetch professor details
        professors_result = supabase.table('professors').select(
            'id, name, department, average_rating, total_reviews, subjects, college_id, colleges(name)'
        ).in_('id', professor_ids).execute()
        
        print(f"✅ Found {len(professors_result.data)} professors in database")
        
        if len(professors_result.data) != len(professor_ids):
            print(f"❌ Mismatch: requested {len(professor_ids)} but found {len(professors_result.data)}")
            missing_ids = set(professor_ids) - set(p['id'] for p in professors_result.data)
            print(f"   Missing professor IDs: {missing_ids}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"One or more professors not found: {missing_ids}"
            )
        
        # Get average ratings breakdown for each professor
        comparison_data = []
        for prof in professors_result.data:
            print(f"🔍 Processing professor: {prof['name']} (ID: {prof['id']})")
            try:
                # Calculate average ratings from reviews AND get additional stats
                reviews_result = supabase.table('reviews').select(
                    'overall_rating, difficulty_rating, clarity_rating, helpfulness_rating, would_take_again, for_credit, attendance_mandatory'
                ).eq('professor_id', prof['id']).eq('status', 'approved').execute()
                
                print(f"   Found {len(reviews_result.data)} approved reviews")
            except Exception as review_error:
                print(f"❌ Error fetching reviews for {prof['name']}: {str(review_error)}")
                # Continue with empty reviews if fetch fails
                reviews_result = type('obj', (object,), {'data': []})()
            
            avg_ratings = {
                'overall': 0.0,
                'difficulty': 0.0,
                'clarity': 0.0,
                'helpfulness': 0.0
            }
            
            # Rating distribution (for 5-star breakdown)
            rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            
            # Additional stats
            would_take_again_yes = 0
            would_take_again_total = 0
            taken_for_credit_yes = 0
            taken_for_credit_no = 0
            taken_for_credit_na = 0
            attendance_yes = 0
            attendance_no = 0
            attendance_na = 0
            
            if reviews_result.data:
                count = len(reviews_result.data)
                avg_ratings['overall'] = sum(r['overall_rating'] for r in reviews_result.data) / count
                avg_ratings['difficulty'] = sum(r['difficulty_rating'] for r in reviews_result.data) / count
                avg_ratings['clarity'] = sum(r['clarity_rating'] for r in reviews_result.data) / count
                avg_ratings['helpfulness'] = sum(r['helpfulness_rating'] for r in reviews_result.data) / count
                
                # Calculate rating distribution
                for review in reviews_result.data:
                    rating = int(round(review['overall_rating']))
                    rating_distribution[rating] = rating_distribution.get(rating, 0) + 1
                    
                    # Would take again
                    if review.get('would_take_again') is not None:
                        would_take_again_total += 1
                        if review['would_take_again']:
                            would_take_again_yes += 1
                    
                    # Taken for credit
                    credit_val = review.get('for_credit')
                    if credit_val == True:
                        taken_for_credit_yes += 1
                    elif credit_val == False:
                        taken_for_credit_no += 1
                    else:
                        taken_for_credit_na += 1
                    
                    # Attendance
                    attendance_val = review.get('attendance_mandatory')
                    if attendance_val == True:
                        attendance_yes += 1
                    elif attendance_val == False:
                        attendance_no += 1
                    else:
                        attendance_na += 1
            
            college_name = prof.get('colleges', {}).get('name', 'Unknown') if isinstance(prof.get('colleges'), dict) else 'Unknown'
            
            # Calculate would_take_again percentage
            would_take_again_pct = (would_take_again_yes / would_take_again_total * 100) if would_take_again_total > 0 else 0
            
            comparison_data.append({
                'id': prof['id'],
                'name': prof['name'],
                'department': prof['department'],
                'college_name': college_name,
                'average_rating': prof['average_rating'] or 0.0,
                'total_reviews': prof['total_reviews'] or 0,
                'subjects': prof['subjects'].split(',') if prof.get('subjects') else [],
                'ratings_breakdown': avg_ratings,
                'rating_distribution': rating_distribution,
                'would_take_again_percentage': round(would_take_again_pct, 0),
                'taken_for_credit': {
                    'yes': taken_for_credit_yes,
                    'no': taken_for_credit_no,
                    'na': taken_for_credit_na
                },
                'mandatory_attendance': {
                    'yes': attendance_yes,
                    'no': attendance_no,
                    'na': attendance_na
                }
            })
        
        return {
            'professors': comparison_data,
            'count': len(comparison_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Compare error: {str(e)}")
        print(f"   Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare professors: {str(e)}"
        )


