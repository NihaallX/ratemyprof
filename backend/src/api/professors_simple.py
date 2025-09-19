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
    message: str

@router.get("", response_model=ProfessorsResponse)
async def search_professors(
    college_id: Optional[str] = Query(None, description="Filter by college ID"),
    q: Optional[str] = Query(None, description="Search by professor name"),
    department: Optional[str] = Query(None, description="Filter by department"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results to return"),
    supabase: Client = Depends(get_supabase)
):
    """Search VU professors."""
    try:
        query = supabase.table('professors').select('*')
        
        if college_id:
            query = query.eq('college_id', college_id)
        
        if q:
            query = query.ilike('name', f'%{q}%')
            
        if department:
            query = query.ilike('department', f'%{department}%')
        
        query = query.order('name').limit(limit)
        result = query.execute()
        
        professors = [Professor(**prof) for prof in result.data]
        
        return ProfessorsResponse(
            professors=professors,
            total=len(professors),
            has_more=len(professors) >= limit
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
        result = supabase.table('professors').select('*').eq('id', professor_id).execute()
        
        if not result.data:
            return JSONResponse(
                status_code=404,
                content={"error": "not_found", "message": "Professor not found"}
            )
        
        prof_data = result.data[0]
        return Professor(**prof_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get professor: {str(e)}"
        )