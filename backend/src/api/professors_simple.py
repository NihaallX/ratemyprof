"""Simplified Professors API for VU testing."""
from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, UUID4
from supabase import Client
import uuid

from src.lib.database import get_supabase

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
    supabase: Client = Depends(get_supabase)
):
    """Create a new professor profile.
    
    Users can submit new professor profiles that will go through
    verification before appearing in search results.
    """
    try:
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