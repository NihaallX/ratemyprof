"""Simplified Professors API for VU testing."""
from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, UUID4
from supabase import Client
import uuid

from src.lib.database import get_supabase
from src.lib.auth import get_current_user

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
    current_user: Dict[str, Any] = Depends(get_current_user),
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
        # Authentication is enforced by get_current_user() dependency
        # RLS policy will verify auth.uid() IS NOT NULL before allowing insert
        print(f"User {current_user['email']} (ID: {current_user['id']}) submitting professor")
        # Verify college exists
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
            result = supabase.table('professors').insert(professor_data).execute()
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
    college_id: Optional[str] = None,
    exclude_id: Optional[str] = None,
    limit: int = 6,
    supabase: Client = Depends(get_supabase)
):
    """Get more professors to explore.
    
    Returns top-rated professors, optionally filtered by college.
    Can exclude a specific professor (useful for showing on professor detail page).
    """
    try:
        print(f"🔍 More professors request: college_id={college_id}, exclude_id={exclude_id}, limit={limit}")
        
        # Validate limit
        if limit < 1 or limit > 20:
            limit = 6
            
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


@router.get("/compare")
async def compare_professors(
    ids: str,
    supabase: Client = Depends(get_supabase)
):
    """Compare multiple professors side by side.
    
    Accepts up to 4 professor IDs separated by commas.
    Returns detailed comparison data including ratings and review stats.
    """
    try:
        print(f"🔍 Compare request: ids={ids}")
        
        # Parse professor IDs
        professor_ids = [pid.strip() for pid in ids.split(',') if pid.strip()]
        
        print(f"📝 Parsed {len(professor_ids)} professor IDs: {professor_ids}")
        
        if len(professor_ids) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 2 professors are required for comparison"
            )
        
        if len(professor_ids) > 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 4 professors can be compared at once"
            )
        
        # Fetch professor details
        professors_result = supabase.table('professors').select(
            'id, name, department, average_rating, total_reviews, subjects, college_id, colleges(name)'
        ).in_('id', professor_ids).execute()
        
        print(f"✅ Found {len(professors_result.data) if professors_result.data else 0} professors")
        
        if len(professors_result.data) != len(professor_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more professors not found"
            )
        
        # Get average ratings breakdown for each professor
        comparison_data = []
        for prof in professors_result.data:
            # Calculate average ratings from reviews using the ratings JSON field
            # The reviews table has a 'ratings' JSONB field with clarity, helpfulness, workload, engagement
            reviews_result = supabase.table('reviews').select(
                'ratings'
            ).eq('professor_id', prof['id']).execute()
            
            avg_ratings = {
                'overall': 0.0,
                'difficulty': 0.0,
                'clarity': 0.0,
                'helpfulness': 0.0
            }
            
            if reviews_result.data and len(reviews_result.data) > 0:
                count = len(reviews_result.data)
                # Extract ratings from JSON field
                total_clarity = 0
                total_helpfulness = 0
                total_workload = 0
                total_engagement = 0
                
                for r in reviews_result.data:
                    if r.get('ratings'):
                        ratings = r['ratings']
                        total_clarity += ratings.get('clarity', 0)
                        total_helpfulness += ratings.get('helpfulness', 0)
                        total_workload += ratings.get('workload', 0)
                        total_engagement += ratings.get('engagement', 0)
                
                if count > 0:
                    avg_ratings['clarity'] = total_clarity / count
                    avg_ratings['helpfulness'] = total_helpfulness / count
                    avg_ratings['difficulty'] = total_workload / count  # Using workload as difficulty
                    avg_ratings['overall'] = (total_clarity + total_helpfulness + total_engagement) / (count * 3)
            
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
            
            comparison_data.append({
                'id': prof['id'],
                'name': prof['name'],
                'department': prof['department'],
                'college_name': college_name,
                'average_rating': prof.get('average_rating') or 0.0,
                'total_reviews': prof.get('total_reviews') or 0,
                'subjects': subjects,
                'ratings_breakdown': avg_ratings
            })
        
        return {
            'professors': comparison_data,
            'count': len(comparison_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare professors: {str(e)}"
        )
