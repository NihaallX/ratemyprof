"""Colleges API routes for RateMyProf backend.

Handles college search and information retrieval endpoints.
Implements caching for 70-90% reduction in database queries.
"""
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator
from supabase import Client

from src.lib.database import get_supabase
from src.lib.cache import cache_response, long_cache, medium_cache

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
    average_rating: float = 0.0  # College rating based on professor ratings
    total_reviews: int = 0       # Total reviews across all professors


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
    average_rating: float = 0.0  # College rating based on professor ratings
    total_reviews: int = 0       # Total reviews across all professors
    # College-specific review statistics
    college_reviews_count: int = 0
    college_average_ratings: Optional[Dict[str, float]] = None


class CollegesSearchResponse(BaseModel):
    colleges: List[College]
    total: int


@router.get("", response_model=CollegesSearchResponse)
@cache_response(ttl_seconds=600)  # Cache for 10 minutes
async def search_colleges(
    q: Optional[str] = Query(None, description="Search query (college name)"),
    state: Optional[str] = Query(None, max_length=50, description="Filter by Indian state"),
    city: Optional[str] = Query(None, max_length=100, description="Filter by city"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results to return"),
    supabase: Client = Depends(get_supabase)
):
    """Search colleges by name, city, or state.
    
    Searches through Indian colleges and universities with various filters
    to help students find educational institutions.
    
    CACHED: 10 minutes - College data rarely changes
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
        if q and len(q.strip()) >= 2:
            query = query.ilike('name', f'%{q.strip()}%')
        
        if state:
            query = query.ilike('state', f'%{state}%')
        
        if city:
            query = query.ilike('city', f'%{city}%')
        
        # Apply pagination and ordering
        query = query.order('name').limit(limit)
        
        result = query.execute()
        
        # Transform data for response with rating calculation
        colleges = []
        for college_data in result.data:
            # Get professors for this college to calculate ratings
            prof_query = supabase.table('professors').select(
                'average_rating, total_reviews'
            ).eq('college_id', college_data['id'])
            prof_result = prof_query.execute()
            
            # Calculate college-level rating from professor reviews
            if prof_result.data:
                total_rating_sum = 0
                total_review_count = 0
                valid_ratings = 0
                
                for prof in prof_result.data:
                    avg_rating = prof.get('average_rating')
                    total_reviews = prof.get('total_reviews', 1)
                    if avg_rating and avg_rating > 0:
                        total_rating_sum += avg_rating * total_reviews
                        total_review_count += total_reviews
                        valid_ratings += 1
                
                if valid_ratings > 0 and total_review_count > 0:
                    prof_average_rating = round(total_rating_sum / total_review_count, 1)
                    college_data['total_reviews'] = total_review_count
                else:
                    prof_average_rating = 0.0
                    college_data['total_reviews'] = 0
            else:
                prof_average_rating = 0.0
                college_data['total_reviews'] = 0
            
            # Get college review statistics to override professor ratings
            try:
                college_reviews_result = supabase.table('college_reviews').select(
                    'overall_rating'
                ).eq('college_id', college_data['id']).eq('status', 'approved').execute()
                
                if college_reviews_result.data:
                    # Use college review ratings as primary rating
                    college_review_count = len(college_reviews_result.data)
                    college_avg_rating = sum(r['overall_rating'] for r in college_reviews_result.data) / college_review_count
                    college_data['average_rating'] = round(college_avg_rating, 1)
                    college_data['total_reviews'] = college_review_count
                else:
                    # Fallback to professor ratings
                    college_data['average_rating'] = prof_average_rating
            except Exception:
                # college_reviews table doesn't exist yet, use professor ratings
                college_data['average_rating'] = prof_average_rating
            
            colleges.append(College(**college_data))
        
        # Get total count
        count_query = supabase.table('colleges').select('id')
        if q and len(q.strip()) >= 2:
            count_query = count_query.ilike('name', f'%{q.strip()}%')
        if state:
            count_query = count_query.ilike('state', f'%{state}%')
        if city:
            count_query = count_query.ilike('city', f'%{city}%')
        
        count_result = count_query.execute()
        total = len(count_result.data) if count_result.data else 0
        
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
        
        # Calculate college rating based on professor ratings
        prof_query = supabase.table('professors').select(
            'average_rating, total_reviews'
        ).eq('college_id', college_id)
        prof_result = prof_query.execute()
        
        if prof_result.data:
            total_rating_sum = 0
            total_review_count = 0
            valid_ratings = 0
            
            for prof in prof_result.data:
                avg_rating = prof.get('average_rating')
                total_reviews = prof.get('total_reviews', 1)
                if avg_rating and avg_rating > 0:
                    total_rating_sum += avg_rating * total_reviews
                    total_review_count += total_reviews
                    valid_ratings += 1
            
            if valid_ratings > 0 and total_review_count > 0:
                college_data['average_rating'] = round(total_rating_sum / total_review_count, 1)
                college_data['total_reviews'] = total_review_count
            else:
                college_data['average_rating'] = 0.0
                college_data['total_reviews'] = 0
        else:
            college_data['average_rating'] = 0.0
            college_data['total_reviews'] = 0
        
        # Get college review statistics
        try:
            college_reviews_result = supabase.table('college_reviews').select('''
                food_rating, internet_rating, clubs_rating, opportunities_rating,
                facilities_rating, teaching_rating, overall_rating
            ''').eq('college_id', college_id).eq('status', 'approved').execute()
            
            college_data['college_reviews_count'] = len(college_reviews_result.data) if college_reviews_result.data else 0
            
            if college_reviews_result.data:
                # Calculate average ratings for college reviews
                totals = {
                    'food': sum(r['food_rating'] for r in college_reviews_result.data),
                    'internet': sum(r['internet_rating'] for r in college_reviews_result.data),
                    'clubs': sum(r['clubs_rating'] for r in college_reviews_result.data),
                    'opportunities': sum(r['opportunities_rating'] for r in college_reviews_result.data),
                    'facilities': sum(r['facilities_rating'] for r in college_reviews_result.data),
                    'teaching': sum(r['teaching_rating'] for r in college_reviews_result.data),
                    'overall': sum(r['overall_rating'] for r in college_reviews_result.data)
                }
                
                count = len(college_reviews_result.data)
                college_data['college_average_ratings'] = {
                    key: round(total / count, 1) for key, total in totals.items()
                }
                
                # Update the main average_rating with college review overall rating
                if count > 0:
                    college_data['average_rating'] = college_data['college_average_ratings']['overall']
            else:
                college_data['college_average_ratings'] = {
                    'food': 0.0,
                    'internet': 0.0,
                    'clubs': 0.0,
                    'opportunities': 0.0,
                    'facilities': 0.0,
                    'teaching': 0.0,
                    'overall': 0.0
                }
        except Exception:
            # college_reviews table doesn't exist yet
            college_data['college_reviews_count'] = 0
            college_data['college_average_ratings'] = {
                'food': 0.0,
                'internet': 0.0,
                'clubs': 0.0,
                'opportunities': 0.0,
                'facilities': 0.0,
                'teaching': 0.0,
                'overall': 0.0
            }
        
        return CollegeDetail(**college_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get college details: {str(e)}"
        )


@router.get("/compare")
async def compare_colleges(
    ids: str = Query(..., description="Comma-separated college IDs to compare"),
    supabase: Client = Depends(get_supabase)
):
    """Compare multiple colleges side by side.
    
    Accepts up to 4 college IDs separated by commas.
    Returns detailed comparison data including ratings and review stats.
    """
    try:
        print(f"🔍 Compare colleges request: ids={ids}")
        
        # Parse college IDs
        college_ids = [cid.strip() for cid in ids.split(',') if cid.strip()]
        
        print(f"📝 Parsed {len(college_ids)} college IDs: {college_ids}")
        
        if len(college_ids) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least 2 colleges are required for comparison"
            )
        
        if len(college_ids) > 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 4 colleges can be compared at once"
            )
        
        # Fetch college details
        colleges_result = supabase.table('colleges').select('*').in_('id', college_ids).execute()
        
        print(f"✅ Found {len(colleges_result.data) if colleges_result.data else 0} colleges")
        
        if len(colleges_result.data) != len(college_ids):
            found_ids = [c['id'] for c in colleges_result.data]
            missing_ids = [cid for cid in college_ids if cid not in found_ids]
            print(f"❌ Missing college IDs: {missing_ids}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Colleges not found: {', '.join(missing_ids)}"
            )
        
        # Get college review ratings for each college
        comparison_data = []
        for college in colleges_result.data:
            # Get average ratings from college_reviews table (individual columns)
            try:
                reviews_result = supabase.table('college_reviews').select(
                    'food_rating, internet_rating, clubs_rating, opportunities_rating, facilities_rating, teaching_rating, overall_rating'
                ).eq('college_id', college['id']).eq('status', 'approved').execute()
                
                avg_ratings = {
                    'food': 0.0,
                    'internet': 0.0,
                    'clubs': 0.0,
                    'opportunities': 0.0,
                    'facilities': 0.0,
                    'teaching': 0.0,
                    'overall': 0.0
                }
                
                if reviews_result.data and len(reviews_result.data) > 0:
                    count = len(reviews_result.data)
                    # Calculate averages from individual columns
                    total_food = sum(r.get('food_rating', 0) for r in reviews_result.data)
                    total_internet = sum(r.get('internet_rating', 0) for r in reviews_result.data)
                    total_clubs = sum(r.get('clubs_rating', 0) for r in reviews_result.data)
                    total_opportunities = sum(r.get('opportunities_rating', 0) for r in reviews_result.data)
                    total_facilities = sum(r.get('facilities_rating', 0) for r in reviews_result.data)
                    total_teaching = sum(r.get('teaching_rating', 0) for r in reviews_result.data)
                    total_overall = sum(r.get('overall_rating', 0) for r in reviews_result.data)
                    
                    if count > 0:
                        avg_ratings['food'] = round(total_food / count, 1)
                        avg_ratings['internet'] = round(total_internet / count, 1)
                        avg_ratings['clubs'] = round(total_clubs / count, 1)
                        avg_ratings['opportunities'] = round(total_opportunities / count, 1)
                        avg_ratings['facilities'] = round(total_facilities / count, 1)
                        avg_ratings['teaching'] = round(total_teaching / count, 1)
                        avg_ratings['overall'] = round(total_overall / count, 1)
                    
                    college_reviews_count = count
                else:
                    college_reviews_count = 0
                    
            except Exception as e:
                print(f"Error fetching college reviews for {college['id']}: {e}")
                import traceback
                traceback.print_exc()
                college_reviews_count = 0
            
            comparison_data.append({
                'id': college['id'],
                'name': college['name'],
                'city': college['city'],
                'state': college['state'],
                'college_type': college.get('college_type', 'Unknown'),
                'total_reviews': college_reviews_count,
                'ratings_breakdown': avg_ratings
            })
        
        return {
            'colleges': comparison_data,
            'count': len(comparison_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error comparing colleges: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare colleges: {str(e)}"
        )
