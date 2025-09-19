"""Colleges API routes for RateMyProf backend.

Handles college search and information retrieval endpoints.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator
from supabase import Client

from src.lib.database import get_supabase

router = APIRouter()

class College(BaseModel):
    id: str
    name: str
    city: str
    state: str
    college_type: str
    established_year: Optional[int] = None
    website: Optional[str] = None
    total_professors: int = 0


class CollegeDetail(BaseModel):
    id: str
    name: str
    city: str
    state: str
    college_type: str
    established_year: Optional[int] = None
    website: Optional[str] = None
    total_professors: int = 0
    email_domain: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CollegesSearchResponse(BaseModel):
    colleges: List[College]
    total: int


@router.get("", response_model=CollegesSearchResponse)
async def search_colleges(
    q: Optional[str] = Query(None, min_length=2, max_length=100, description="Search query (college name)"),
    state: Optional[str] = Query(None, max_length=50, description="Filter by Indian state"),
    city: Optional[str] = Query(None, max_length=100, description="Filter by city"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results to return"),
    supabase: Client = Depends(get_supabase)
):
    """Search colleges by name, city, or state.
    
    Searches through Indian colleges and universities with various filters
    to help students find educational institutions.
    """
    try:
        # Build the query dynamically
        query = supabase.table('colleges').select(
            '''
            id,
            name,
            city,
            state,
            college_type,
            established_year,
            website,
            total_professors
            '''
        )
        
        # Apply filters
        if q:
            query = query.ilike('name', f'%{q}%')
        
        if state:
            query = query.ilike('state', f'%{state}%')
        
        if city:
            query = query.ilike('city', f'%{city}%')
        
        # Apply pagination and ordering
        query = query.order('name').limit(limit)
        
        result = query.execute()
        
        # Transform data for response
        colleges = [College(**college_data) for college_data in result.data]
        
        # Get total count
        count_query = supabase.table('colleges').select('id', count='exact')
        if q:
            count_query = count_query.ilike('name', f'%{q}%')
        if state:
            count_query = count_query.ilike('state', f'%{state}%')
        if city:
            count_query = count_query.ilike('city', f'%{city}%')
        
        count_result = count_query.execute()
        total = count_result.count or 0
        
        return CollegesSearchResponse(
            colleges=colleges,
            total=total
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search colleges: {str(e)}"
        )


@router.get("/{college_id}", response_model=CollegeDetail)
async def get_college(
    college_id: str,
    supabase: Client = Depends(get_supabase)
):
    """Get detailed information about a specific college.
    
    Returns comprehensive details about the college including all available data.
    """
    try:
        result = supabase.table('colleges').select('*').eq('id', college_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College not found"
            )
        
        college_data = result.data[0]
        return CollegeDetail(**college_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get college details: {str(e)}"
        )
