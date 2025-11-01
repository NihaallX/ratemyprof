"""Simplified Professors API for VU testing."""
from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, UUID4
from supabase import Client, create_client
import uuid
import os

from src.lib.database import get_supabase
from src.lib.auth import get_current_user

security = HTTPBearer()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

router = APIRouter()

# Simple models for VU testing
class Professor(BaseModel):
    id: str
    name: str
    department: str
    college_id: str
    average_rating: float
    total_reviews: int
    designation: Optional[str] = None
    subjects: List[str] = []

class ProfessorsResponse(BaseModel):
    professors: List[Professor]
    total: int
    has_more: bool

class ErrorResponse(BaseModel):
    error: str

class ProfessorCreate(BaseModel):
    name: str
    email: Optional[str] = None
    department: str
    designation: Optional[str] = None
    college_id: str
    subjects: List[str] = []
    message: str

@router.get("", response_model=ProfessorsResponse)
async def search_professors(
    college_id: Optional[str] = Query(None, description="Filter by college ID"),
    q: Optional[str] = Query(None, description="Search by professor name"),
    department: Optional[str] = Query(None, description="Filter by department"),
    limit: int = Query(20, ge=1, le=200, description="Maximum results to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    supabase: Client = Depends(get_supabase)
):
    """Search VU professors."""
    try:
        # TODO: Add back .eq('is_verified', True) once column is added to database
        query = supabase.table('professors').select('*')
        
        if college_id:
            query = query.eq('college_id', college_id)
        
        if q:
            query = query.ilike('name', f'%{q}%')
            
        if department:
            query = query.ilike('department', f'%{department}%')
        
        # Get total count BEFORE applying limit/offset
        count_query = supabase.table('professors').select('*', count='exact')
        # TODO: Add back .eq('is_verified', True) once column is added
        if college_id:
            count_query = count_query.eq('college_id', college_id)
        if q:
            count_query = count_query.ilike('name', f'%{q}%')
        if department:
            count_query = count_query.ilike('department', f'%{department}%')
        
        count_result = count_query.execute()
        total_count = count_result.count if count_result.count is not None else 0
        
        query = query.range(offset, offset + limit - 1).order('name')
        result = query.execute()
        
        # Transform data to match our model
        transformed_professors = []
        for prof in result.data:
            try:
                # Handle subjects field - convert to list if it's a string or null
                subjects = prof.get('subjects', [])
                if subjects is None:
                    subjects = []
                elif isinstance(subjects, str):
                    subjects = [s.strip() for s in subjects.split(',') if s.strip()]
                
                professor_data = {
                    'id': prof['id'],
                    'name': prof['name'],
                    'department': prof['department'],
                    'college_id': prof['college_id'],
                    'average_rating': float(prof.get('average_rating', 0.0)),
                    'total_reviews': int(prof.get('total_reviews', 0)),
                    'designation': prof.get('designation'),
                    'subjects': subjects
                }
                transformed_professors.append(Professor(**professor_data))
            except Exception as e:
                print(f"Error transforming professor {prof.get('id', 'unknown')}: {e}")
                continue
        
        return ProfessorsResponse(
            professors=transformed_professors,
            total=total_count,  # ← Now returns actual database count
            has_more=(offset + len(transformed_professors)) < total_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search professors: {str(e)}"
        )


# IMPORTANT: /compare must come BEFORE /{professor_id} or FastAPI will match "compare" as a professor_id!
@router.get("/compare")
async def compare_professors(
    ids: str = Query(..., description="Comma-separated professor IDs"),
    supabase: Client = Depends(get_supabase)
):
    """Compare multiple professors side by side.
    
    Accepts up to 4 professor IDs separated by commas.
    Returns detailed comparison data including ratings and review stats.
    """
    try:
        print(f"🔍 [COMPARE v2.0] Compare request: ids={ids}")
        
        # Parse professor IDs
        professor_ids = [pid.strip() for pid in ids.split(',') if pid.strip()]
        
        print(f"📝 Parsed {len(professor_ids)} professor IDs: {professor_ids}")
        
        if len(professor_ids) < 1:
            print(f"❌ Error: No professor IDs provided")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 1 professor is required"
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
        
        print(f"✅ Found {len(professors_result.data) if professors_result.data else 0} professors")
        
        if len(professors_result.data) != len(professor_ids):
            missing_ids = set(professor_ids) - set(p['id'] for p in professors_result.data)
            print(f"❌ Missing professor IDs: {missing_ids}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"One or more professors not found: {missing_ids}"
            )
        
        # Get average ratings breakdown for each professor
        comparison_data = []
        for prof in professors_result.data:
            print(f"🔍 Processing professor: {prof['name']} (ID: {prof['id']})")
            print(f"   Professor total_reviews from DB: {prof.get('total_reviews', 0)}")
            
            try:
                # First check ALL reviews (not just approved) for debugging
                all_reviews = supabase.table('reviews').select(
                    'id, status'
                ).eq('professor_id', prof['id']).execute()
                print(f"   📊 Total reviews in DB: {len(all_reviews.data)}")
                if all_reviews.data:
                    status_counts = {}
                    for r in all_reviews.data:
                        status = r.get('status', 'unknown')
                        status_counts[status] = status_counts.get(status, 0) + 1
                    print(f"   📊 Status breakdown: {status_counts}")
                
                # Fetch reviews with correct schema (separate rating columns)
                reviews_result = supabase.table('reviews').select(
                    'overall_rating, difficulty_rating, clarity_rating, helpfulness_rating, would_take_again, attendance_required'
                ).eq('professor_id', prof['id']).eq('status', 'approved').execute()
                
                print(f"   ✅ Found {len(reviews_result.data)} APPROVED reviews")
                
                # If no approved, try pending
                if len(reviews_result.data) == 0:
                    pending_reviews = supabase.table('reviews').select(
                        'overall_rating, difficulty_rating, clarity_rating, helpfulness_rating, would_take_again, attendance_required'
                    ).eq('professor_id', prof['id']).eq('status', 'pending').execute()
                    print(f"   ⚠️ Found {len(pending_reviews.data)} PENDING reviews (using these for now)")
                    if len(pending_reviews.data) > 0:
                        reviews_result = pending_reviews
                        
            except Exception as review_error:
                print(f"❌ Error fetching reviews for {prof['name']}: {str(review_error)}")
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
            
            if reviews_result.data and len(reviews_result.data) > 0:
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
                    
                    # Attendance (use attendance_required instead of attendance_mandatory)
                    attendance_val = review.get('attendance_required')
                    if attendance_val == True:
                        attendance_yes += 1
                    elif attendance_val == False:
                        attendance_no += 1
                    else:
                        attendance_na += 1
            
            # Handle colleges data
            college_name = 'Unknown'
            if 'colleges' in prof:
                colleges_data = prof['colleges']
                if isinstance(colleges_data, dict):
                    college_name = colleges_data.get('name', 'Unknown')
                elif isinstance(colleges_data, list) and len(colleges_data) > 0:
                    college_name = colleges_data[0].get('name', 'Unknown')
            
            # Handle subjects - can be list or comma-separated string
            subjects = prof.get('subjects', [])
            if isinstance(subjects, str):
                subjects = [s.strip() for s in subjects.split(',') if s.strip()]
            elif not isinstance(subjects, list):
                subjects = []
            
            # Calculate would_take_again percentage
            would_take_again_pct = (would_take_again_yes / would_take_again_total * 100) if would_take_again_total > 0 else 0
            
            comparison_data.append({
                'id': prof['id'],
                'name': prof['name'],
                'department': prof['department'],
                'college_name': college_name,
                'average_rating': prof.get('average_rating') or 0.0,
                'total_reviews': prof.get('total_reviews') or 0,
                'subjects': subjects,
                'ratings_breakdown': avg_ratings,
                'rating_distribution': rating_distribution,
                'would_take_again_percentage': round(would_take_again_pct, 0),
                'taken_for_credit': {
                    'yes': 0,
                    'no': 0,
                    'na': 0
                },
                'mandatory_attendance': {
                    'yes': attendance_yes,
                    'no': attendance_no,
                    'na': attendance_na
                }
            })
        
        print(f"✅ Successfully built comparison data for {len(comparison_data)} professors")
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


@router.get("/{professor_id}", response_model=Professor, responses={
    404: {"model": ErrorResponse, "description": "Professor not found"},
    400: {"model": ErrorResponse, "description": "Invalid professor ID"}
})
async def get_professor(
    professor_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Get a specific professor by ID - simplified format."""
    try:
        # Validate UUID format
        try:
            uuid.UUID(professor_id)
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={"error": "invalid_uuid", "message": "Invalid professor ID format"}
            )
        
        # Get professor data
        # TODO: Add back .eq('is_verified', True) once column is added to database
        result = supabase.table('professors').select('*').eq('id', professor_id).execute()
        
        if not result.data:
            return JSONResponse(
                status_code=404,
                content={"error": "not_found", "message": "Professor not found"}
            )
        
        prof_data = result.data[0]
        
        # Transform data to match our model
        subjects = prof_data.get('subjects', [])
        if subjects is None:
            subjects = []
        elif isinstance(subjects, str):
            subjects = [s.strip() for s in subjects.split(',') if s.strip()]
        
        transformed_data = {
            'id': prof_data['id'],
            'name': prof_data['name'],
            'department': prof_data['department'],
            'college_id': prof_data['college_id'],
            'average_rating': float(prof_data.get('average_rating', 0.0)),
            'total_reviews': int(prof_data.get('total_reviews', 0)),
            'designation': prof_data.get('designation'),
            'subjects': subjects
        }
        
        return Professor(**transformed_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get professor: {str(e)}"
        )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_professor(
    request: ProfessorCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase)
):
    """Create a new professor profile.
    
    Users can submit new professor profiles that will go through
    verification before appearing in search results.
    
    **Authentication Required**: This endpoint requires a valid JWT token.
    
    **RLS Policy**: The "Authenticated users can submit professors" policy
    will verify that auth.uid() is not null before allowing the insert.
    """
    try:
        # Create authenticated client for RLS
        access_token = credentials.credentials
        auth_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        auth_client.postgrest.auth(access_token)
        
        print(f"Professor submission with authenticated token")
        
        # Verify college exists (using regular client is fine for reads)
        college_result = supabase.table('colleges').select('id, name').eq(
            'id', request.college_id
        ).execute()
        
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
                detail="Professor already exists in this college"
            )
        
        # Create new professor - minimal fields only
        new_professor_id = str(uuid.uuid4())
        
        # Test with absolute minimum data first
        try:
            professor_data = {
                'id': new_professor_id,
                'name': request.name,
                'department': request.department,
                'designation': request.designation or 'Faculty',
                'college_id': request.college_id,
                'subjects': request.subjects,  # Store subjects as list
                'average_rating': 0.0,
                'total_reviews': 0,
                'is_verified': False  # New professors need verification
                # Note: email is not stored in professors table
            }
            
            print(f"Attempting to insert professor data: {professor_data}")
            # Use authenticated client for RLS insert
            result = auth_client.table('professors').insert(professor_data).execute()
            print(f"Insert result: {result}")
            
        except Exception as e:
            print(f"Error during insert: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database insert failed: {str(e)}"
            )
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create professor"
            )
        
        return {
            "message": "Professor profile submitted successfully",
            "professor_id": new_professor_id,
            "status": "submitted_for_review"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create professor: {str(e)}"
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
            'college_id, department, name'
        ).eq('id', professor_id).execute()
        
        if not prof_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor not found"
            )
        
        current_prof = prof_result.data[0]
        
        print(f"🔍 Finding similar professors for: {current_prof['name']}")
        print(f"   College: {current_prof['college_id']}, Department: {current_prof['department']}")
        
        # Get similar professors - same college and department
        similar_result = supabase.table('professors').select(
            'id, name, department, average_rating, total_reviews, subjects'
        ).eq('college_id', current_prof['college_id']).eq(
            'department', current_prof['department']
        ).neq('id', professor_id).order(
            'average_rating', desc=True
        ).limit(3).execute()
        
        print(f"   Found {len(similar_result.data)} professors in same department")
        
        # If no professors in same department, get from same college (any department)
        if not similar_result.data or len(similar_result.data) == 0:
            print(f"   ↪️ Falling back to same college (any department)")
            similar_result = supabase.table('professors').select(
                'id, name, department, average_rating, total_reviews, subjects'
            ).eq('college_id', current_prof['college_id']).neq(
                'id', professor_id
            ).order('average_rating', desc=True).limit(3).execute()
            print(f"   Found {len(similar_result.data)} professors in same college")
        
        professors = []
        for prof in similar_result.data:
            # Handle subjects - can be list or comma-separated string
            subjects = prof.get('subjects', [])
            if isinstance(subjects, str):
                subjects = [s.strip() for s in subjects.split(',') if s.strip()]
            elif not isinstance(subjects, list):
                subjects = []
                
            professors.append({
                'id': prof['id'],
                'name': prof['name'],
                'department': prof['department'],
                'average_rating': prof.get('average_rating') or 0.0,
                'total_reviews': prof.get('total_reviews') or 0,
                'subjects': subjects
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
        
        print(f"✅ Found {len(result.data) if result.data else 0} professors")
        
        professors = []
        for prof in result.data:
            # Handle subjects - can be list or comma-separated string
            subjects = prof.get('subjects', [])
            if isinstance(subjects, str):
                subjects = [s.strip() for s in subjects.split(',') if s.strip()]
            elif not isinstance(subjects, list):
                subjects = []
                
            professors.append({
                'id': prof['id'],
                'name': prof['name'],
                'department': prof['department'],
                'average_rating': prof.get('average_rating') or 0.0,
                'total_reviews': prof.get('total_reviews') or 0,
                'subjects': subjects
            })
        
        return {
            'professors': professors,
            'total': len(professors)
        }
        
    except Exception as e:
        print(f"❌ Error in more-professors: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch professors: {str(e)}"
        )
