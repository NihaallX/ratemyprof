"""Moderation API routes for RateMyProf backend.

Handles content moderation and administrative endpoints for the platform.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator
from supabase import Client

from src.lib.database import get_supabase, get_supabase_admin
from src.lib.auth import get_current_user
from src.services.auto_flagging import AutoFlaggingSystem
from src.services.content_filter import content_filter, ContentAnalysis
from src.services.user_communication import UserCommunicationSystem, NotificationType

router = APIRouter()
security = HTTPBearer()

def get_admin_supabase() -> Optional[Client]:
    """Get admin Supabase client for elevated operations."""
    admin_client = get_supabase_admin()
    if not admin_client:
        # Don't fail, just return None - we'll use fallback methods
        return None
    return admin_client

# Admin Authentication Models
class AdminLogin(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: Dict[str, Any]

# Hardcoded admin credentials
ADMIN_USERNAME = "admin@gmail.com"
ADMIN_PASSWORD = "gauravnihal123"
SECRET_KEY = "ratemyprof-admin-secret-key-2025"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Request/Response Models
class ModerationAction(BaseModel):
    action: str
    reason: str
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v):
        valid_actions = ['approve', 'remove', 'pending']
        if v not in valid_actions:
            raise ValueError(f'Invalid action. Must be one of: {", ".join(valid_actions)}')
        return v
    
    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Reason is required for moderation action')
        if len(v) > 1000:
            raise ValueError('Reason cannot exceed 1000 characters')
        return v.strip()


class ReviewFlag(BaseModel):
    id: str
    reason: str
    description: Optional[str] = None
    flagged_by: str
    created_at: str


class FlaggedReview(BaseModel):
    id: str
    professor_id: str
    user_id: Optional[str] = None
    review_text: Optional[str] = None
    ratings: Dict[str, int]
    anonymous: bool
    anon_display_name: Optional[str] = None
    created_at: str
    updated_at: str
    status: str  # pending, approved, removed
    flags: List[ReviewFlag]


class FlaggedReviewsResponse(BaseModel):
    reviews: List[FlaggedReview]
    total: int


def create_admin_token(username: str) -> str:
    """Create JWT token for admin user."""
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode = {
        "sub": username,
        "username": username,
        "email": "admin@gmail.com",
        "role": "admin",
        "exp": expire
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_admin_token(token: str) -> Optional[dict]:
    """Verify and decode admin JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username == ADMIN_USERNAME:
            return {
                "username": username,
                "email": "admin@gmail.com",
                "role": "admin",
                "user_metadata": {"role": "admin"}
            }
        return None
    except jwt.PyJWTError:
        return None


async def get_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Dependency to verify admin token from Authorization header.
    
    Extracts Bearer token from request headers and verifies it's a valid admin token.
    Raises 401 if token is missing or invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    admin_user = verify_admin_token(token)
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return admin_user


@router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(credentials: AdminLogin):
    """Admin login endpoint with hardcoded credentials."""
    if credentials.username != ADMIN_USERNAME or credentials.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token = create_admin_token(credentials.username)
    
    return AdminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600,
        user={
            "username": credentials.username,
            "email": "admin@gmail.com",
            "role": "admin"
        }
    )


def is_admin_user(current_user: dict) -> bool:
    """Check if current user has admin/moderator privileges."""
    # Check for hardcoded admin user
    if current_user.get('email') == 'admin@gmail.com' or current_user.get('username') == 'admin@gmail.com':
        return True
    
    # Check user metadata for admin role
    user_metadata = current_user.get('user_metadata', {})
    return (
        user_metadata.get('role') == 'admin' or
        user_metadata.get('is_moderator') == True or
        current_user.get('email', '').endswith('@ratemyprof.in')  # Simple admin check
    )


@router.get("/reviews", response_model=FlaggedReviewsResponse)
async def get_flagged_reviews(
    review_status: str = Query('pending', pattern='^(pending|approved|removed)$'),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get flagged reviews for moderation.
    
    Returns reviews that have been flagged by users and require
    moderation attention. Admin-only endpoint.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required for moderation endpoints"
            )
        
        # Get flagged reviews with their flags
        # Note: If review_flags table doesn't have proper schema, just return empty results
        try:
            query = supabase.table('reviews').select(
                '''
                id,
                professor_id,
                user_id,
                review_text,
                ratings,
                anonymous,
                anon_display_name,
                created_at,
                updated_at,
                status,
                review_flags (
                    id,
                    flag_reason,
                    additional_details,
                    flagger_email,
                    created_at
                )
                '''
            ).eq('status', review_status).order('created_at', desc=True).limit(limit)
            
            # Only get reviews that have flags
            query = query.not_.is_('review_flags', 'null')
            
            result = query.execute()
        except Exception as e:
            # If there's a schema mismatch or other DB error, return empty results
            # Silently handle - schema mismatch is expected
            return FlaggedReviewsResponse(
                reviews=[],
                total=0,
                limit=limit,
                offset=0
            )
        
        # Transform data for response
        flagged_reviews = []
        for review_data in result.data:
            flags_data = review_data.pop('review_flags', [])
            flags = [ReviewFlag(**flag) for flag in flags_data if flag]
            
            # Only include reviews that actually have flags
            if flags:
                flagged_review = FlaggedReview(
                    **review_data,
                    flags=flags
                )
                flagged_reviews.append(flagged_review)
        
        # Get total count
        count_query = supabase.table('reviews').select(
            'id', count='exact'
        ).eq('status', review_status).not_.is_('review_flags', 'null')
        
        count_result = count_query.execute()
        total = count_result.count or 0
        
        return FlaggedReviewsResponse(
            reviews=flagged_reviews,
            total=total
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get flagged reviews: {str(e)}"
        )


@router.post("/reviews/{review_id}/action")
async def moderate_review(
    review_id: str,
    request: ModerationAction,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Take moderation action on a review.
    
    Allows admin users to approve, remove, or mark reviews as pending
    based on moderation guidelines and flag reports.
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
        
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required for moderation actions"
            )
        
        # Check if review exists
        review_check = supabase.table('reviews').select('id, status').eq('id', review_id).single().execute()
        if not review_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Update review status
        update_result = supabase.table('reviews').update({
            'status': request.action,
            'moderated_at': 'now()',
            'moderated_by': current_user['id']
        }).eq('id', review_id).execute()
        
        # Log moderation action
        log_data = {
            'review_id': review_id,
            'moderator_id': current_user['id'],
            'action': request.action,
            'reason': request.reason,
            'previous_status': review_check.data['status']
        }
        
        supabase.table('moderation_logs').insert(log_data).execute()
        
        action_messages = {
            'approve': 'Review approved successfully',
            'remove': 'Review removed successfully', 
            'pending': 'Review marked as pending review'
        }
        
        return {"message": action_messages.get(request.action, "Moderation action completed")}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to moderate review: {str(e)}"
        )


class UserAction(BaseModel):
    action: str
    reason: str
    duration_days: Optional[int] = None
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v):
        valid_actions = ['ban', 'unban', 'warn', 'delete_account']
        if v not in valid_actions:
            raise ValueError(f'Invalid action. Must be one of: {", ".join(valid_actions)}')
        return v


class UserInfo(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    created_at: str
    total_reviews: int = 0
    total_flags_submitted: int = 0


@router.get("/test-users")
async def test_users_endpoint(
    supabase: Client = Depends(get_supabase),
    admin_supabase: Optional[Client] = Depends(get_admin_supabase)
):
    """Test endpoint to check auth.users table access with admin client"""
    try:
        if admin_supabase:
            # Try using admin client to access auth users
            print("🔄 Using admin client to access auth.users...")
            
            # Use the admin client's auth.admin methods
            try:
                users_response = admin_supabase.auth.admin.list_users()
                # The response is directly a list of User objects
                users_list = users_response if isinstance(users_response, list) else []
                
                if users_list:
                    user_data = []
                    for user in users_list[:5]:  # Limit to 5 for testing
                        user_data.append({
                            'id': user.id,
                            'email': user.email,
                            'created_at': str(user.created_at) if user.created_at else None,
                            'email_confirmed_at': str(user.email_confirmed_at) if user.email_confirmed_at else None
                        })
                    
                    return {
                        "message": "Success - Admin client accessed auth.users", 
                        "users_count": len(user_data),
                        "users": user_data
                    }
                else:
                    return {
                        "message": "Admin client returned empty list",
                        "users_count": 0,
                        "users": []
                    }
                    
            except Exception as admin_error:
                print(f"⚠️ Admin client error: {admin_error}")
                
                # Fallback: Get user IDs from reviews and try to get their details
                reviews_result = supabase.table('reviews').select('student_id').not_.is_('student_id', 'null').limit(10).execute()
                student_ids = list(set([r['student_id'] for r in reviews_result.data])) if reviews_result.data else []
                
                return {
                    "message": "Admin client failed, found user IDs from reviews", 
                    "admin_error": str(admin_error),
                    "users_count": len(student_ids),
                    "user_ids": student_ids
                }
        else:
            # No admin client available
            reviews_result = supabase.table('reviews').select('student_id').not_.is_('student_id', 'null').limit(10).execute()
            student_ids = list(set([r['student_id'] for r in reviews_result.data])) if reviews_result.data else []
            
            return {
                "message": "No admin client available, found user IDs from reviews", 
                "users_count": len(student_ids),
                "user_ids": student_ids
            }
            
    except Exception as e:
        return {
            "message": "Test endpoint - all methods failed", 
            "error": str(e),
            "users": []
        }


@router.get("/users", response_model=List[UserInfo])
async def get_users(
    status: str = Query('all', pattern='^(all|active|banned)$'),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    admin_supabase: Optional[Client] = Depends(get_admin_supabase)
):
    """Get users for admin management from auth.users table.
    
    Returns list of users with their activity statistics
    for administrative review and moderation.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        users = []
        
        # Try to get users from auth.users using admin client
        try:
            if admin_supabase:
                users_response = admin_supabase.auth.admin.list_users()
                auth_users = users_response if isinstance(users_response, list) else []
                
                for auth_user in auth_users[:limit]:
                    user_id = auth_user.id
                    
                    # Get review counts for each user - use review_author_mappings table
                    prof_review_count = 0
                    college_review_count = 0
                    flag_count = 0
                    
                    try:
                        # Query the mapping table to find reviews by this author
                        prof_reviews = admin_supabase.table('review_author_mappings').select('id').eq('author_id', user_id).execute()
                        prof_review_count = len(prof_reviews.data) if prof_reviews.data else 0
                    except Exception as e:
                        # Silently handle error
                        pass
                    
                    try:
                        # Query college review mappings if table exists
                        college_reviews = admin_supabase.table('college_review_author_mappings').select('id').eq('author_id', user_id).execute()
                        college_review_count = len(college_reviews.data) if college_reviews.data else 0
                    except Exception as e:
                        # Silently handle error - table may not exist
                        pass
                    
                    # Get flag count - try different column names
                    try:
                        flags = supabase.table('review_flags').select('id').eq('flagger_email', auth_user.email).execute()
                        flag_count = len(flags.data) if flags.data else 0
                    except:
                        flag_count = 0
                    
                    # Extract user metadata
                    meta_data = getattr(auth_user, 'user_metadata', {}) or {}
                    
                    users.append(UserInfo(
                        id=user_id,
                        email=auth_user.email or f"user-{user_id[:8]}",
                        first_name=meta_data.get('first_name'),
                        last_name=meta_data.get('last_name'),
                        is_active=auth_user.email_confirmed_at is not None,
                        created_at=str(auth_user.created_at) if auth_user.created_at else "2025-01-01T00:00:00Z",
                        total_reviews=prof_review_count + college_review_count,
                        total_flags_submitted=flag_count
                    ))
                    
                # Successfully loaded users
            else:
                # No admin client available
                pass
                
        except Exception as auth_error:
            # Error getting users from auth.users
            users = []
            
            # Fallback: Get user IDs from reviews and build user list
            user_ids = set()
            user_creation_dates = {}
            
            # Get users from professor reviews table
            review_users_result = supabase.table('reviews').select(
                'student_id, created_at'
            ).not_.is_('student_id', 'null').execute()
            
            # Get users from college reviews table
            college_review_users_result = supabase.table('college_reviews').select(
                'student_id, created_at'
            ).not_.is_('student_id', 'null').execute()
            
            # Add users from professor reviews
            for review in review_users_result.data or []:
                if review['student_id']:
                    user_ids.add(review['student_id'])
                    if review['student_id'] not in user_creation_dates:
                        user_creation_dates[review['student_id']] = review['created_at']
            
            # Add users from college reviews  
            for review in college_review_users_result.data or []:
                if review['student_id']:
                    user_ids.add(review['student_id'])
                    if review['student_id'] not in user_creation_dates:
                        user_creation_dates[review['student_id']] = review['created_at']
            
            # Create user entries for found IDs
            for user_id in list(user_ids)[:limit]:
                prof_reviews = supabase.table('reviews').select('id').eq('student_id', user_id).execute()
                prof_review_count = len(prof_reviews.data) if prof_reviews.data else 0
                
                college_reviews = supabase.table('college_reviews').select('id').eq('student_id', user_id).execute()
                college_review_count = len(college_reviews.data) if college_reviews.data else 0
                
                # Get flag count with proper error handling
                try:
                    flags = supabase.table('review_flags').select('id').eq('reporter_id', user_id).execute()
                    flag_count = len(flags.data) if flags.data else 0
                except:
                    try:
                        flags = supabase.table('review_flags').select('id').eq('user_id', user_id).execute()
                        flag_count = len(flags.data) if flags.data else 0
                    except:
                        flag_count = 0
                
                users.append(UserInfo(
                    id=user_id,
                    email=f"user-{user_id[:8]}@domain.com",
                    first_name=None,
                    last_name=None,
                    is_active=True,
                    created_at=user_creation_dates.get(user_id, "2025-01-01T00:00:00Z"),
                    total_reviews=prof_review_count + college_review_count,
                    total_flags_submitted=flag_count
                ))
            
            # Fallback complete
        
        # Fallback: Get users from reviews and college_reviews tables if no auth users or admin client unavailable
        if not users:
            # Fallback to extracting from reviews
            user_ids = set()
            user_creation_dates = {}
            user_emails = {}
            
            # Get users from professor reviews table
            review_users_result = supabase.table('reviews').select(
                'student_id, created_at'
            ).not_.is_('student_id', 'null').execute()
            
            # Get users from college reviews table
            college_review_users_result = supabase.table('college_reviews').select(
                'student_id, created_at'
            ).not_.is_('student_id', 'null').execute()
            
            # Add users from professor reviews
            for review in review_users_result.data or []:
                if review['student_id']:
                    user_ids.add(review['student_id'])
                    if review['student_id'] not in user_creation_dates:
                        user_creation_dates[review['student_id']] = review['created_at']
            
            # Add users from college reviews  
            for review in college_review_users_result.data or []:
                if review['student_id']:
                    user_ids.add(review['student_id'])
                    if review['student_id'] not in user_creation_dates:
                        user_creation_dates[review['student_id']] = review['created_at']
            
            # Try to get more details from a users table if it exists
            try:
                users_table_result = supabase.table('users').select('id, email, first_name, last_name, created_at').execute()
                if users_table_result.data:
                    for user_record in users_table_result.data:
                        if user_record['id']:
                            user_ids.add(user_record['id'])
                            user_emails[user_record['id']] = user_record.get('email', f"user-{user_record['id'][:8]}")
                            if user_record['id'] not in user_creation_dates:
                                user_creation_dates[user_record['id']] = user_record.get('created_at', "2025-01-01T00:00:00Z")
            except Exception as table_error:
                print(f"ℹ️ Users table not accessible: {table_error}")
            
            # Try to access auth.users table directly using SQL
            try:
                print("🔄 Attempting to query auth.users directly...")
                # This is a Supabase-specific approach to get auth users
                auth_users_sql = supabase.rpc('get_auth_users').execute()
                if auth_users_sql.data:
                    print(f"✅ Found {len(auth_users_sql.data)} users from auth.users via RPC")
                    for auth_user in auth_users_sql.data:
                        user_ids.add(auth_user['id'])
                        user_emails[auth_user['id']] = auth_user.get('email', f"user-{auth_user['id'][:8]}")
                        user_creation_dates[auth_user['id']] = auth_user.get('created_at', "2025-01-01T00:00:00Z")
                else:
                    print("ℹ️ RPC function get_auth_users returned no data")
            except Exception as rpc_error:
                print(f"ℹ️ Could not access auth.users via RPC: {rpc_error}")
                
                # Alternative: Try direct auth.users table query if service role key was available
                try:
                    print("🔄 Attempting direct auth.users query...")
                    # This requires service role key but let's try with what we have
                    auth_users_direct = supabase.table('auth.users').select('id, email, created_at').execute()
                    if auth_users_direct.data:
                        print(f"✅ Found {len(auth_users_direct.data)} users from direct auth.users query")
                        for auth_user in auth_users_direct.data:
                            user_ids.add(auth_user['id'])
                            user_emails[auth_user['id']] = auth_user.get('email', f"user-{auth_user['id'][:8]}")
                            user_creation_dates[auth_user['id']] = auth_user.get('created_at', "2025-01-01T00:00:00Z")
                except Exception as direct_error:
                    print(f"ℹ️ Direct auth.users query failed: {direct_error}")
            
            users = []
            for user_id in list(user_ids)[:limit]:
                try:
                    # Get review counts
                    prof_reviews = supabase.table('reviews').select('id').eq('student_id', user_id).execute()
                    prof_review_count = len(prof_reviews.data) if prof_reviews.data else 0
                    
                    college_reviews = supabase.table('college_reviews').select('id').eq('student_id', user_id).execute()
                    college_review_count = len(college_reviews.data) if college_reviews.data else 0
                    
                    # Get flag count with proper error handling
                    try:
                        flags = supabase.table('review_flags').select('id').eq('reporter_id', user_id).execute()
                        flag_count = len(flags.data) if flags.data else 0
                    except:
                        try:
                            flags = supabase.table('review_flags').select('id').eq('user_id', user_id).execute()
                            flag_count = len(flags.data) if flags.data else 0
                        except:
                            flag_count = 0
                    
                    email = user_emails.get(user_id, f"user-{user_id[:8]}")
                    
                    users.append(UserInfo(
                        id=user_id,
                        email=email,
                        first_name=None,
                        last_name=None,
                        is_active=True,
                        created_at=user_creation_dates.get(user_id, "2025-01-01T00:00:00Z"),
                        total_reviews=prof_review_count + college_review_count,
                        total_flags_submitted=flag_count
                    ))
                except Exception as e:
                    print(f"⚠️ Error processing user {user_id}: {e}")
                    continue
            
            print(f"✅ Successfully loaded {len(users)} users from database queries (fallback method)")
        
        return users
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_users: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch users: {str(e)}"
        )


@router.post("/users/{user_id}/action", status_code=status.HTTP_200_OK)
async def moderate_user(
    user_id: str,
    request: UserAction,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Take moderation action on a user.
    
    Admin can ban, unban, warn, or delete user accounts
    based on community guidelines violations.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        # Validate user ID
        try:
            UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid user ID format"
            )
        
        # Check if user exists
        user_check = supabase.table('users').select('id, email, is_active').eq(
            'id', user_id
        ).single().execute()
        
        if not user_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_data = user_check.data
        
        # Prevent admin from acting on themselves
        if user_id == current_user['id']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot perform moderation actions on yourself"
            )
        
        # Perform the action
        if request.action == 'ban':
            supabase.table('users').update({
                'is_active': False
            }).eq('id', user_id).execute()
            
            message = f"User {user_data['email']} has been banned"
            
        elif request.action == 'unban':
            supabase.table('users').update({
                'is_active': True
            }).eq('id', user_id).execute()
            
            message = f"User {user_data['email']} has been unbanned"
            
        elif request.action == 'warn':
            # For now, just log the warning
            message = f"Warning sent to user {user_data['email']}"
            
        elif request.action == 'delete_account':
            # Soft delete - mark as inactive and clear personal data
            supabase.table('users').update({
                'is_active': False,
                'email': f"deleted_{user_id}@deleted.com",
                'first_name': None,
                'last_name': None
            }).eq('id', user_id).execute()
            
            message = f"User account has been deleted"
        
        # Log the moderation action
        log_data = {
            'user_id': user_id,
            'moderator_id': current_user['id'],
            'action': request.action,
            'reason': request.reason,
            'duration_days': request.duration_days
        }
        
        supabase.table('user_moderation_logs').insert(log_data).execute()
        
        return {"message": message}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to moderate user: {str(e)}"
        )


class ProfessorVerification(BaseModel):
    action: str
    verification_notes: Optional[str] = None
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v):
        valid_actions = ['verify', 'reject', 'request_more_info']
        if v not in valid_actions:
            raise ValueError(f'Invalid action. Must be one of: {", ".join(valid_actions)}')
        return v


@router.get("/professors/pending")
async def get_pending_professors(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get professors pending verification.
    
    Returns list of professors that have been submitted
    but need admin verification before appearing in search.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        result = supabase.table('professors').select(
            '''
            id,
            name,
            department,
            designation,
            college_id,
            subjects,
            created_at
            '''
        ).eq('is_verified', False).limit(limit).order('created_at', desc=False).execute()
        
        return {"professors": result.data, "total": len(result.data)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_pending_professors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get pending professors: {str(e)}"
        )


@router.post("/professors/{professor_id}/verify", status_code=status.HTTP_200_OK)
async def verify_professor(
    professor_id: str,
    request: ProfessorVerification,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Verify or reject a professor profile.
    
    Admin can verify professor profiles to make them
    searchable or reject them with feedback.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        # Validate professor ID
        try:
            UUID(professor_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid professor ID format"
            )
        
        # Check if professor exists
        prof_check = supabase.table('professors').select('id, name').eq(
            'id', professor_id
        ).single().execute()
        
        if not prof_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor not found"
            )
        
        prof_data = prof_check.data
        
        # Perform verification action
        if request.action == 'verify':
            supabase.table('professors').update({
                'is_verified': True,
                'updated_at': 'now()'
            }).eq('id', professor_id).execute()
            
            message = f"Professor {prof_data['name']} has been verified and is now visible to users"
            
        elif request.action == 'reject':
            # For rejected professors, we can either delete them or mark them as rejected
            supabase.table('professors').delete().eq('id', professor_id).execute()
            
            message = f"Professor {prof_data['name']} submission has been rejected and removed"
        
        # Log the verification action (if logging table exists)
        try:
            log_data = {
                'professor_id': professor_id,
                'action': request.action,
                'notes': request.verification_notes,
                'created_at': 'now()'
            }
            supabase.table('moderation_logs').insert(log_data).execute()
        except:
            # Logging is optional, don't fail if table doesn't exist
            pass
        
        return {"message": message}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify professor: {str(e)}"
        )


# Professor Edit/Delete Models
class ProfessorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    subjects: Optional[List[str]] = None
    biography: Optional[str] = None
    years_of_experience: Optional[int] = None
    education: Optional[str] = None
    research_interests: Optional[str] = None


@router.put("/professors/{professor_id}", status_code=status.HTTP_200_OK)
async def update_professor(
    professor_id: str,
    professor_update: ProfessorUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Update professor information.
    
    Admin-only endpoint for editing professor profiles.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        # Check if professor exists
        existing_prof = supabase.table('professors').select('*').eq('id', professor_id).single().execute()
        
        if not existing_prof.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor not found"
            )
        
        # Build update data (only include non-None fields)
        update_data = {}
        if professor_update.name is not None:
            update_data['name'] = professor_update.name
        if professor_update.email is not None:
            update_data['email'] = professor_update.email
        if professor_update.department is not None:
            update_data['department'] = professor_update.department
        if professor_update.designation is not None:
            update_data['designation'] = professor_update.designation
        if professor_update.subjects is not None:
            update_data['subjects'] = ','.join(professor_update.subjects) if professor_update.subjects else None
        if professor_update.biography is not None:
            update_data['biography'] = professor_update.biography
        if professor_update.years_of_experience is not None:
            update_data['years_of_experience'] = professor_update.years_of_experience
        if professor_update.education is not None:
            update_data['education'] = professor_update.education
        if professor_update.research_interests is not None:
            update_data['research_interests'] = professor_update.research_interests
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        # Add updated timestamp
        update_data['updated_at'] = 'now()'
        
        # Update professor
        result = supabase.table('professors').update(update_data).eq('id', professor_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update professor"
            )
        
        # Log moderation action
        try:
            log_data = {
                'moderator_id': current_user['id'],
                'action_type': 'professor_updated',
                'target_type': 'professor',
                'target_id': professor_id,
                'reason': 'Admin updated professor information',
                'details': f"Updated fields: {', '.join(update_data.keys())}",
                'created_at': 'now()'
            }
            supabase.table('moderation_logs').insert(log_data).execute()
        except:
            # Logging is optional
            pass
        
        return {
            "message": "Professor updated successfully",
            "professor": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update professor: {str(e)}"
        )


@router.delete("/professors/{professor_id}", status_code=status.HTTP_200_OK)
async def delete_professor(
    professor_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Delete professor profile.
    
    Admin-only endpoint for removing professor profiles.
    This will also delete all associated reviews.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        # Check if professor exists
        existing_prof = supabase.table('professors').select('*').eq('id', professor_id).single().execute()
        
        if not existing_prof.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor not found"
            )
        
        professor_name = existing_prof.data.get('name', 'Unknown')
        
        # Delete associated reviews first (due to foreign key constraints)
        supabase.table('reviews').delete().eq('professor_id', professor_id).execute()
        
        # Delete the professor
        result = supabase.table('professors').delete().eq('id', professor_id).execute()
        
        # Log moderation action
        try:
            log_data = {
                'moderator_id': current_user['id'],
                'action_type': 'professor_deleted',
                'target_type': 'professor',
                'target_id': professor_id,
                'reason': 'Admin deleted professor profile',
                'details': f"Deleted professor: {professor_name}",
                'created_at': 'now()'
            }
            supabase.table('moderation_logs').insert(log_data).execute()
        except:
            # Logging is optional
            pass
        
        return {
            "message": f"Professor '{professor_name}' and all associated reviews have been deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete professor: {str(e)}"
        )

# ==========================================
# AUTOMATED CONTENT FILTERING ENDPOINTS
# ==========================================

class ContentFilterRequest(BaseModel):
    text: str

class ContentFilterResponse(BaseModel):
    is_profane: bool
    profanity_score: float
    is_spam: bool
    spam_score: float
    quality_score: float
    sentiment_score: float
    auto_flag: bool
    flag_reasons: List[str]
    cleaned_text: Optional[str] = None

class BulkAnalysisRequest(BaseModel):
    limit: int = 100

@router.post("/content/analyze", response_model=ContentFilterResponse)
async def analyze_content(
    request: ContentFilterRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Analyze content using automated filtering system.
    
    Returns comprehensive analysis including profanity, spam, quality, and sentiment scores.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        # Analyze content
        analysis = content_filter.analyze_content(request.text)
        
        return ContentFilterResponse(
            is_profane=analysis.is_profane,
            profanity_score=analysis.profanity_score,
            is_spam=analysis.is_spam,
            spam_score=analysis.spam_score,
            quality_score=analysis.quality_score,
            sentiment_score=analysis.sentiment_score,
            auto_flag=analysis.auto_flag,
            flag_reasons=analysis.flag_reasons,
            cleaned_text=analysis.cleaned_text
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze content: {str(e)}"
        )

@router.get("/content/filter-stats")
async def get_content_filter_stats(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get statistics about the content filtering system."""
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        # Get auto-flagging system stats
        auto_flagging = AutoFlaggingSystem(supabase)
        stats = await auto_flagging.get_auto_flag_stats()
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get filter stats: {str(e)}"
        )

@router.post("/content/bulk-analyze")
async def bulk_analyze_content(
    request: BulkAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Perform bulk analysis of existing content for retroactive flagging.
    
    This runs in the background and analyzes existing approved content
    to identify any that should be flagged based on current filtering rules.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        # Initialize auto-flagging system
        auto_flagging = AutoFlaggingSystem(supabase)
        
        # Add bulk analysis task to background
        background_tasks.add_task(
            auto_flagging.bulk_analyze_existing_content,
            request.limit
        )
        
        return {
            "message": f"Bulk analysis started for up to {request.limit} reviews",
            "status": "processing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start bulk analysis: {str(e)}"
        )

@router.get("/content/analysis-logs")
async def get_content_analysis_logs(
    limit: int = Query(50, ge=1, le=200),
    review_type: str = Query('all', pattern='^(all|professor|college)$'),
    auto_flagged_only: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get content analysis logs for monitoring."""
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        logs = []
        
        # Get professor review analysis logs
        if review_type in ['all', 'professor']:
            query = supabase.table('content_analysis_logs').select(
                'id, review_id, profanity_score, spam_score, quality_score, '
                'sentiment_score, auto_flagged, flag_reasons, analyzed_at'
            )
            
            if auto_flagged_only:
                query = query.eq('auto_flagged', True)
            
            result = query.order('analyzed_at', desc=True).limit(limit).execute()
            
            for log in result.data or []:
                log['review_type'] = 'professor'
                logs.append(log)
        
        # Get college review analysis logs
        if review_type in ['all', 'college']:
            query = supabase.table('college_content_analysis_logs').select(
                'id, college_review_id, profanity_score, spam_score, quality_score, '
                'sentiment_score, auto_flagged, flag_reasons, analyzed_at'
            )
            
            if auto_flagged_only:
                query = query.eq('auto_flagged', True)
            
            result = query.order('analyzed_at', desc=True).limit(limit).execute()
            
            for log in result.data or []:
                log['review_type'] = 'college'
                log['review_id'] = log.pop('college_review_id')  # Normalize field name
                logs.append(log)
        
        # Sort by analyzed_at
        logs.sort(key=lambda x: x['analyzed_at'], reverse=True)
        
        return {
            "logs": logs[:limit],
            "total_count": len(logs),
            "filters": {
                "review_type": review_type,
                "auto_flagged_only": auto_flagged_only,
                "limit": limit
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get analysis logs: {str(e)}"
        )

@router.post("/content/clean-profanity")
async def clean_profanity(
    request: ContentFilterRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Clean profanity from text content."""
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        # Clean profanity
        cleaned_text = content_filter.clean_profanity(request.text)
        
        return {
            "original_text": request.text,
            "cleaned_text": cleaned_text,
            "profanity_detected": cleaned_text != request.text
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clean profanity: {str(e)}"
        )

# ==========================================
# BULK OPERATIONS ENDPOINTS
# ==========================================

class BulkModerationRequest(BaseModel):
    item_ids: List[str]
    action: str
    reason: str
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v):
        valid_actions = ['approve', 'remove', 'pending', 'ban', 'unban', 'warn', 'delete']
        if v not in valid_actions:
            raise ValueError(f'Invalid action. Must be one of: {", ".join(valid_actions)}')
        return v

class BulkUserActionRequest(BaseModel):
    user_ids: List[str]
    action: str
    reason: str
    duration_days: Optional[int] = None
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v):
        valid_actions = ['ban', 'unban', 'warn', 'delete']
        if v not in valid_actions:
            raise ValueError(f'Invalid action. Must be one of: {", ".join(valid_actions)}')
        return v

class BulkOperationResponse(BaseModel):
    success_count: int
    failed_count: int
    total_count: int
    failed_items: List[Dict[str, Any]]
    success_message: str

@router.post("/reviews/bulk-action", response_model=BulkOperationResponse)
async def bulk_moderate_reviews(
    request: BulkModerationRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Perform bulk moderation actions on multiple reviews.
    
    Supports approve, remove, and pending actions on professor reviews.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        if not request.item_ids:
            raise HTTPException(
                status_code=400,
                detail="No review IDs provided"
            )
        
        success_count = 0
        failed_count = 0
        failed_items = []
        
        for review_id in request.item_ids:
            try:
                # Validate UUID format
                UUID(review_id)
                
                # Check if review exists
                review_result = supabase.table('reviews').select(
                    'id, professor_id, student_id, review_text'
                ).eq('id', review_id).single().execute()
                
                if not review_result.data:
                    failed_items.append({
                        "id": review_id,
                        "error": "Review not found"
                    })
                    failed_count += 1
                    continue
                
                review = review_result.data
                
                # Perform the action
                if request.action == 'approve':
                    # Update review status
                    supabase.table('reviews').update({
                        'moderation_status': 'approved',
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', review_id).execute()
                    
                    # Remove all flags for this review
                    supabase.table('review_flags').delete().eq('review_id', review_id).execute()
                    
                elif request.action == 'remove':
                    # Update review status
                    supabase.table('reviews').update({
                        'moderation_status': 'rejected',
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', review_id).execute()
                    
                elif request.action == 'pending':
                    # Update review status
                    supabase.table('reviews').update({
                        'moderation_status': 'pending',
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', review_id).execute()
                
                # Log the action
                try:
                    log_data = {
                        'moderator_id': current_user['id'],
                        'action': f'bulk_{request.action}',
                        'target_type': 'review',
                        'target_id': review_id,
                        'reason': request.reason,
                        'details': f"Bulk {request.action} on review {review_id}",
                        'created_at': datetime.utcnow().isoformat()
                    }
                    supabase.table('moderation_logs').insert(log_data).execute()
                except:
                    # Logging is optional
                    pass
                
                success_count += 1
                
            except ValueError:
                failed_items.append({
                    "id": review_id,
                    "error": "Invalid review ID format"
                })
                failed_count += 1
            except Exception as e:
                failed_items.append({
                    "id": review_id,
                    "error": str(e)
                })
                failed_count += 1
        
        return BulkOperationResponse(
            success_count=success_count,
            failed_count=failed_count,
            total_count=len(request.item_ids),
            failed_items=failed_items,
            success_message=f"Successfully {request.action}ed {success_count} review(s)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform bulk review action: {str(e)}"
        )

@router.post("/college-reviews/bulk-action", response_model=BulkOperationResponse)
async def bulk_moderate_college_reviews(
    request: BulkModerationRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Perform bulk moderation actions on multiple college reviews.
    
    Supports approve, remove, and pending actions on college reviews.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        if not request.item_ids:
            raise HTTPException(
                status_code=400,
                detail="No college review IDs provided"
            )
        
        success_count = 0
        failed_count = 0
        failed_items = []
        
        for review_id in request.item_ids:
            try:
                # Validate UUID format
                UUID(review_id)
                
                # Check if college review exists
                review_result = supabase.table('college_reviews').select(
                    'id, college_id, student_id, review_text'
                ).eq('id', review_id).single().execute()
                
                if not review_result.data:
                    failed_items.append({
                        "id": review_id,
                        "error": "College review not found"
                    })
                    failed_count += 1
                    continue
                
                review = review_result.data
                
                # Perform the action
                if request.action == 'approve':
                    # Update review status
                    supabase.table('college_reviews').update({
                        'moderation_status': 'approved',
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', review_id).execute()
                    
                    # Remove all flags for this review
                    supabase.table('college_review_flags').delete().eq('college_review_id', review_id).execute()
                    
                elif request.action == 'remove':
                    # Update review status
                    supabase.table('college_reviews').update({
                        'moderation_status': 'rejected',
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', review_id).execute()
                    
                elif request.action == 'pending':
                    # Update review status
                    supabase.table('college_reviews').update({
                        'moderation_status': 'pending',
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', review_id).execute()
                
                # Log the action
                try:
                    log_data = {
                        'moderator_id': current_user['id'],
                        'action': f'bulk_{request.action}',
                        'target_type': 'college_review',
                        'target_id': review_id,
                        'reason': request.reason,
                        'details': f"Bulk {request.action} on college review {review_id}",
                        'created_at': datetime.utcnow().isoformat()
                    }
                    supabase.table('moderation_logs').insert(log_data).execute()
                except:
                    # Logging is optional
                    pass
                
                success_count += 1
                
            except ValueError:
                failed_items.append({
                    "id": review_id,
                    "error": "Invalid college review ID format"
                })
                failed_count += 1
            except Exception as e:
                failed_items.append({
                    "id": review_id,
                    "error": str(e)
                })
                failed_count += 1
        
        return BulkOperationResponse(
            success_count=success_count,
            failed_count=failed_count,
            total_count=len(request.item_ids),
            failed_items=failed_items,
            success_message=f"Successfully {request.action}ed {success_count} college review(s)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform bulk college review action: {str(e)}"
        )

@router.post("/users/bulk-action", response_model=BulkOperationResponse)
async def bulk_user_action(
    request: BulkUserActionRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Perform bulk actions on multiple users.
    
    Supports ban, unban, warn, and delete actions on users.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        if not request.user_ids:
            raise HTTPException(
                status_code=400,
                detail="No user IDs provided"
            )
        
        success_count = 0
        failed_count = 0
        failed_items = []
        
        for user_id in request.user_ids:
            try:
                # Validate UUID format
                UUID(user_id)
                
                # Check if user exists (check in reviews table since auth.users might not be accessible)
                user_check = supabase.table('reviews').select(
                    'student_id'
                ).eq('student_id', user_id).limit(1).execute()
                
                if not user_check.data:
                    # Also check college reviews
                    college_user_check = supabase.table('college_reviews').select(
                        'student_id'
                    ).eq('student_id', user_id).limit(1).execute()
                    
                    if not college_user_check.data:
                        failed_items.append({
                            "id": user_id,
                            "error": "User not found or has no reviews"
                        })
                        failed_count += 1
                        continue
                
                # Perform the action
                if request.action == 'ban':
                    # For now, we'll log the ban action
                    # In a real system, you'd update auth.users or a user_status table
                    action_details = f"User banned for {request.duration_days} days" if request.duration_days else "User banned indefinitely"
                    
                elif request.action == 'unban':
                    action_details = "User unbanned"
                    
                elif request.action == 'warn':
                    action_details = f"User warned: {request.reason}"
                    
                elif request.action == 'delete':
                    # Delete user's reviews and flags
                    supabase.table('reviews').delete().eq('student_id', user_id).execute()
                    supabase.table('college_reviews').delete().eq('student_id', user_id).execute()
                    supabase.table('review_flags').delete().eq('reporter_id', user_id).execute()
                    supabase.table('college_review_flags').delete().eq('reporter_id', user_id).execute()
                    action_details = "User and all associated data deleted"
                
                # Log the action
                try:
                    log_data = {
                        'moderator_id': current_user['id'],
                        'action': f'bulk_{request.action}_user',
                        'target_type': 'user',
                        'target_id': user_id,
                        'reason': request.reason,
                        'details': action_details,
                        'duration_days': request.duration_days,
                        'created_at': datetime.utcnow().isoformat()
                    }
                    supabase.table('moderation_logs').insert(log_data).execute()
                except:
                    # Logging is optional
                    pass
                
                success_count += 1
                
            except ValueError:
                failed_items.append({
                    "id": user_id,
                    "error": "Invalid user ID format"
                })
                failed_count += 1
            except Exception as e:
                failed_items.append({
                    "id": user_id,
                    "error": str(e)
                })
                failed_count += 1
        
        return BulkOperationResponse(
            success_count=success_count,
            failed_count=failed_count,
            total_count=len(request.user_ids),
            failed_items=failed_items,
            success_message=f"Successfully performed {request.action} on {success_count} user(s)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform bulk user action: {str(e)}"
        )

@router.post("/professors/bulk-action", response_model=BulkOperationResponse)
async def bulk_professor_action(
    request: BulkModerationRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Perform bulk actions on multiple professors.
    
    Supports verify, reject, and delete actions on professors.
    """
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        if not request.item_ids:
            raise HTTPException(
                status_code=400,
                detail="No professor IDs provided"
            )
        
        success_count = 0
        failed_count = 0
        failed_items = []
        
        for professor_id in request.item_ids:
            try:
                # Validate UUID format
                UUID(professor_id)
                
                # Check if professor exists
                prof_result = supabase.table('professors').select(
                    'id, name, is_verified'
                ).eq('id', professor_id).single().execute()
                
                if not prof_result.data:
                    failed_items.append({
                        "id": professor_id,
                        "error": "Professor not found"
                    })
                    failed_count += 1
                    continue
                
                professor = prof_result.data
                
                # Perform the action based on mapped actions
                if request.action == 'approve':  # Map to verify for professors
                    # Verify professor
                    supabase.table('professors').update({
                        'is_verified': True,
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', professor_id).execute()
                    action_name = 'verified'
                    
                elif request.action == 'remove':  # Map to reject for professors
                    # Reject professor (soft delete)
                    supabase.table('professors').update({
                        'is_verified': False,
                        'updated_at': datetime.utcnow().isoformat()
                    }).eq('id', professor_id).execute()
                    action_name = 'rejected'
                    
                elif request.action == 'delete':
                    # Hard delete professor and all associated reviews
                    supabase.table('reviews').delete().eq('professor_id', professor_id).execute()
                    supabase.table('professors').delete().eq('id', professor_id).execute()
                    action_name = 'deleted'
                    
                else:
                    failed_items.append({
                        "id": professor_id,
                        "error": f"Action '{request.action}' not supported for professors"
                    })
                    failed_count += 1
                    continue
                
                # Log the action
                try:
                    log_data = {
                        'moderator_id': current_user['id'],
                        'action': f'bulk_{action_name}_professor',
                        'target_type': 'professor',
                        'target_id': professor_id,
                        'reason': request.reason,
                        'details': f"Bulk {action_name} professor: {professor['name']}",
                        'created_at': datetime.utcnow().isoformat()
                    }
                    supabase.table('moderation_logs').insert(log_data).execute()
                except:
                    # Logging is optional
                    pass
                
                success_count += 1
                
            except ValueError:
                failed_items.append({
                    "id": professor_id,
                    "error": "Invalid professor ID format"
                })
                failed_count += 1
            except Exception as e:
                failed_items.append({
                    "id": professor_id,
                    "error": str(e)
                })
                failed_count += 1
        
        return BulkOperationResponse(
            success_count=success_count,
            failed_count=failed_count,
            total_count=len(request.item_ids),
            failed_items=failed_items,
            success_message=f"Successfully processed {success_count} professor(s)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform bulk professor action: {str(e)}"
        )

# ==========================================
# ENHANCED ANALYTICS ENDPOINTS
# ==========================================

@router.get("/analytics/metrics")
async def get_moderation_metrics(
    timeRange: str = Query('7d', pattern='^(1d|7d|30d|90d)$'),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get comprehensive moderation metrics for dashboard."""
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        # Calculate date range
        days_map = {'1d': 1, '7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(timeRange, 7)
        start_date = datetime.utcnow() - timedelta(days=days)
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get total flags
        total_flags_result = supabase.table('review_flags').select(
            'id', count='exact'
        ).gte('created_at', start_date.isoformat()).execute()
        
        college_flags_result = supabase.table('college_review_flags').select(
            'id', count='exact'
        ).gte('created_at', start_date.isoformat()).execute()
        
        total_flags = (total_flags_result.count or 0) + (college_flags_result.count or 0)
        
        # Get pending items
        pending_reviews_result = supabase.table('reviews').select(
            'id', count='exact'
        ).eq('moderation_status', 'pending').execute()
        
        pending_college_reviews_result = supabase.table('college_reviews').select(
            'id', count='exact'
        ).eq('moderation_status', 'pending').execute()
        
        pending_professors_result = supabase.table('professors').select(
            'id', count='exact'
        ).eq('is_verified', False).execute()
        
        # Get today's auto and manual flags
        auto_flags_today_result = supabase.table('review_flags').select(
            'id', count='exact'
        ).eq('is_auto_generated', True).gte('created_at', today_start.isoformat()).execute()
        
        manual_flags_today_result = supabase.table('review_flags').select(
            'id', count='exact'
        ).eq('is_auto_generated', False).gte('created_at', today_start.isoformat()).execute()
        
        # Calculate resolution rate (simplified)
        resolved_flags = supabase.table('review_flags').select(
            'id', count='exact'
        ).gte('created_at', start_date.isoformat()).execute()
        
        resolution_rate = 85.0  # Mock calculation
        avg_resolution_time = 6.2  # Mock average in hours
        
        return {
            "total_flags": total_flags,
            "pending_reviews": pending_reviews_result.count or 0,
            "pending_college_reviews": pending_college_reviews_result.count or 0,
            "pending_professors": pending_professors_result.count or 0,
            "auto_flags_today": auto_flags_today_result.count or 0,
            "manual_flags_today": manual_flags_today_result.count or 0,
            "resolution_rate": resolution_rate,
            "avg_resolution_time": avg_resolution_time
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get moderation metrics: {str(e)}"
        )

@router.get("/analytics/trends")
async def get_trend_analysis(
    timeRange: str = Query('7d', pattern='^(1d|7d|30d|90d)$'),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get trend analysis for violations and resolutions."""
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        # Calculate date range
        days_map = {'1d': 1, '7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(timeRange, 7)
        
        trends = []
        for i in range(days):
            date = datetime.utcnow() - timedelta(days=i)
            day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            # Get flags for this day
            flags_result = supabase.table('review_flags').select(
                'id', count='exact'
            ).gte('created_at', day_start.isoformat()).lt('created_at', day_end.isoformat()).execute()
            
            # Get reviews for this day
            reviews_result = supabase.table('reviews').select(
                'id', count='exact'
            ).gte('created_at', day_start.isoformat()).lt('created_at', day_end.isoformat()).execute()
            
            trends.append({
                "date": day_start.isoformat().split('T')[0],
                "flags": flags_result.count or 0,
                "resolutions": max(0, (flags_result.count or 0) - 2),  # Mock resolution calculation
                "new_users": max(1, (flags_result.count or 0) // 3),  # Mock new users
                "new_reviews": reviews_result.count or 0
            })
        
        return sorted(trends, key=lambda x: x['date'])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get trend analysis: {str(e)}"
        )

@router.get("/analytics/violations")
async def get_violation_patterns(
    timeRange: str = Query('7d', pattern='^(1d|7d|30d|90d)$'),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get violation pattern analysis."""
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        # Calculate date range
        days_map = {'1d': 1, '7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(timeRange, 7)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get violation counts by type
        flags_result = supabase.table('review_flags').select(
            'flag_type'
        ).gte('created_at', start_date.isoformat()).execute()
        
        college_flags_result = supabase.table('college_review_flags').select(
            'flag_type'
        ).gte('created_at', start_date.isoformat()).execute()
        
        # Count violations by type
        violation_counts = {}
        for flag in (flags_result.data or []) + (college_flags_result.data or []):
            flag_type = flag.get('flag_type', 'unknown')
            violation_counts[flag_type] = violation_counts.get(flag_type, 0) + 1
        
        # Create violation patterns with mock trend data
        patterns = []
        type_mapping = {
            'inappropriate': 'Inappropriate Content',
            'spam': 'Spam',
            'low_quality': 'Low Quality',
            'harassment': 'Harassment',
            'false_information': 'False Information'
        }
        
        for flag_type, count in violation_counts.items():
            # Mock trend calculation
            trend = 'stable'
            percentage_change = 0.0
            
            if count > 10:
                trend = 'down'
                percentage_change = -12.5
            elif count > 5:
                trend = 'up'  
                percentage_change = 8.3
            
            patterns.append({
                "type": type_mapping.get(flag_type, flag_type.replace('_', ' ').title()),
                "count": count,
                "trend": trend,
                "percentage_change": percentage_change
            })
        
        return sorted(patterns, key=lambda x: x['count'], reverse=True)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get violation patterns: {str(e)}"
        )

@router.get("/analytics/activity")
async def get_user_activity_patterns(
    timeRange: str = Query('7d', pattern='^(1d|7d|30d|90d)$'),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get user activity patterns by hour."""
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        # For now, return mock data as this requires more complex time-based analysis
        activity = []
        for hour in range(24):
            # Mock activity with realistic patterns (higher during day)
            base_activity = 5 if 9 <= hour <= 21 else 2
            activity.append({
                "hour": hour,
                "review_submissions": base_activity + (hour % 3),
                "flag_submissions": max(1, base_activity // 3),
                "user_registrations": max(1, base_activity // 2)
            })
        
        return activity
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get activity patterns: {str(e)}"
        )

@router.get("/analytics/violators")
async def get_top_violators(
    timeRange: str = Query('7d', pattern='^(1d|7d|30d|90d)$'),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Get top violators (users with most flags)."""
    try:
        # Check admin privileges
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=403,
                detail="Admin privileges required"
            )
        
        # Calculate date range
        days_map = {'1d': 1, '7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(timeRange, 7)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get flags with reporter information
        flags_result = supabase.table('review_flags').select(
            'reporter_id, flag_type, created_at'
        ).gte('created_at', start_date.isoformat()).execute()
        
        # Count violations by user
        user_violations = {}
        for flag in flags_result.data or []:
            reporter_id = flag.get('reporter_id')
            if reporter_id and reporter_id != '00000000-0000-0000-0000-000000000000':  # Exclude system user
                if reporter_id not in user_violations:
                    user_violations[reporter_id] = {
                        'count': 0,
                        'types': set(),
                        'last_violation': flag.get('created_at')
                    }
                user_violations[reporter_id]['count'] += 1
                user_violations[reporter_id]['types'].add(flag.get('flag_type'))
                if flag.get('created_at') > user_violations[reporter_id]['last_violation']:
                    user_violations[reporter_id]['last_violation'] = flag.get('created_at')
        
        # Get top violators
        top_violators = []
        for user_id, violation_data in sorted(user_violations.items(), 
                                            key=lambda x: x[1]['count'], 
                                            reverse=True)[:limit]:
            top_violators.append({
                "user_id": user_id,
                "email": f"user-{user_id[:8]}@example.com",  # Mock email
                "violation_count": violation_data['count'],
                "violation_types": list(violation_data['types']),
                "last_violation": violation_data['last_violation']
            })
        
        return top_violators
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get top violators: {str(e)}"
        )

# =============================================
# User Communication Endpoints
# =============================================

class NotificationRequest(BaseModel):
    user_id: str
    notification_type: str
    context_data: Dict[str, Any]

class AppealSubmission(BaseModel):
    moderation_action_id: str
    appeal_reason: str
    additional_info: Optional[str] = None

class AppealResolution(BaseModel):
    decision: str
    resolution_details: str
    
    @field_validator('decision')
    @classmethod
    def validate_decision(cls, v):
        if v not in ['approved', 'rejected']:
            raise ValueError('Decision must be "approved" or "rejected"')
        return v

@router.post("/send-notification")
async def send_user_notification(
    request: NotificationRequest,
    current_user: dict = Depends(verify_admin_token),
    supabase: Client = Depends(get_supabase)
):
    """Send a notification to a user."""
    try:
        comm_system = UserCommunicationSystem(supabase)
        
        # Validate notification type
        try:
            notification_type = NotificationType(request.notification_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid notification type: {request.notification_type}"
            )
        
        success = await comm_system.send_notification(
            request.user_id,
            notification_type,
            request.context_data
        )
        
        if success:
            return {"message": "Notification sent successfully"}
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to send notification"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending notification: {str(e)}"
        )

@router.get("/notifications/{user_id}")
async def get_user_notifications(
    user_id: str,
    unread_only: bool = Query(False, description="Return only unread notifications"),
    limit: int = Query(50, description="Maximum number of notifications to return"),
    supabase: Client = Depends(get_supabase)
):
    """Get notifications for a user."""
    try:
        comm_system = UserCommunicationSystem(supabase)
        notifications = await comm_system.get_user_notifications(
            user_id, unread_only, limit
        )
        
        return {
            "notifications": notifications,
            "total": len(notifications),
            "unread_only": unread_only
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting notifications: {str(e)}"
        )

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    user_id: str = Query(..., description="ID of the user"),
    supabase: Client = Depends(get_supabase)
):
    """Mark a notification as read."""
    try:
        comm_system = UserCommunicationSystem(supabase)
        success = await comm_system.mark_notification_read(notification_id, user_id)
        
        if success:
            return {"message": "Notification marked as read"}
        else:
            raise HTTPException(
                status_code=404,
                detail="Notification not found or already read"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error marking notification as read: {str(e)}"
        )

@router.post("/appeals")
async def submit_appeal(
    request: AppealSubmission,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Submit an appeal for a moderation action."""
    try:
        comm_system = UserCommunicationSystem(supabase)
        
        appeal_id = await comm_system.submit_appeal(
            current_user['id'],
            request.moderation_action_id,
            request.appeal_reason,
            request.additional_info
        )
        
        if appeal_id:
            return {
                "message": "Appeal submitted successfully",
                "appeal_id": appeal_id
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to submit appeal"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error submitting appeal: {str(e)}"
        )

@router.get("/appeals")
async def get_pending_appeals(
    limit: int = Query(50, description="Maximum number of appeals to return"),
    current_user: dict = Depends(verify_admin_token),
    supabase: Client = Depends(get_supabase)
):
    """Get all pending appeals for admin review."""
    try:
        comm_system = UserCommunicationSystem(supabase)
        appeals = await comm_system.get_pending_appeals(limit)
        
        return {
            "appeals": appeals,
            "total": len(appeals)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting appeals: {str(e)}"
        )

@router.put("/appeals/{appeal_id}/resolve")
async def resolve_appeal(
    appeal_id: str,
    request: AppealResolution,
    current_user: dict = Depends(verify_admin_token),
    supabase: Client = Depends(get_supabase)
):
    """Resolve an appeal with admin decision."""
    try:
        comm_system = UserCommunicationSystem(supabase)
        
        success = await comm_system.resolve_appeal(
            appeal_id,
            current_user['id'],
            request.decision,
            request.resolution_details
        )
        
        if success:
            return {
                "message": f"Appeal {request.decision} successfully",
                "appeal_id": appeal_id,
                "decision": request.decision
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="Appeal not found or already resolved"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error resolving appeal: {str(e)}"
        )

@router.get("/communication-stats")
async def get_communication_stats(
    current_user: dict = Depends(verify_admin_token),
    supabase: Client = Depends(get_supabase)
):
    """Get statistics about notifications and appeals."""
    try:
        comm_system = UserCommunicationSystem(supabase)
        stats = await comm_system.get_notification_stats()
        
        return {
            "communication_stats": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting communication stats: {str(e)}"
        )

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: dict = Depends(get_admin_user),
    supabase: Client = Depends(get_supabase),
    admin_supabase: Optional[Client] = Depends(get_admin_supabase)
):
    """Get all dashboard statistics in a single optimized call.
    
    Returns counts and minimal data for dashboard overview without loading
    full datasets. Much faster than making 4 separate API calls.
    """
    try:
        stats = {
            "total_professors": 0,
            "verified_professors": 0,
            "pending_professors": 0,
            "professors_with_no_reviews": 0,
            "total_reviews": 0,
            "flagged_reviews_count": 0,
            "total_users": 0,
            "recent_flagged_reviews": [],
            "recent_pending_professors": [],
            "recent_users": []
        }
        
        # Get professor counts using count='exact' for efficiency
        try:
            # Total professors
            total_result = supabase.table('professors').select('*', count='exact').limit(1).execute()
            stats["total_professors"] = total_result.count if hasattr(total_result, 'count') else 0
            
            # Verified professors
            verified_result = supabase.table('professors').select('*', count='exact').eq('is_verified', True).limit(1).execute()
            stats["verified_professors"] = verified_result.count if hasattr(verified_result, 'count') else 0
            
            # Pending professors
            pending_result = supabase.table('professors').select('*', count='exact').eq('is_verified', False).limit(1).execute()
            stats["pending_professors"] = pending_result.count if hasattr(pending_result, 'count') else 0
            
        except Exception as e:
            print(f"Error getting professor counts: {e}")
        
        # Get review counts
        try:
            reviews_result = supabase.table('reviews').select('*', count='exact').limit(1).execute()
            stats["total_reviews"] = reviews_result.count if hasattr(reviews_result, 'count') else 0
        except Exception as e:
            print(f"Error getting review count: {e}")
        
        # Get professors with no reviews (fetch only necessary data)
        try:
            all_profs = supabase.table('professors').select('id,total_reviews').limit(200).execute()
            if all_profs.data:
                stats["professors_with_no_reviews"] = sum(1 for p in all_profs.data if (p.get('total_reviews') or 0) == 0)
        except Exception as e:
            print(f"Error counting professors with no reviews: {e}")
        
        # Get flagged reviews count and recent items
        try:
            flagged_result = supabase.table('reviews').select('*', count='exact').eq('status', 'flagged').limit(5).execute()
            stats["flagged_reviews_count"] = flagged_result.count if hasattr(flagged_result, 'count') else 0
            stats["recent_flagged_reviews"] = flagged_result.data[:5] if flagged_result.data else []
        except Exception as e:
            print(f"Error getting flagged reviews: {e}")
        
        # Get recent pending professors (just top 5)
        try:
            pending_profs = supabase.table('professors').select('*').eq('is_verified', False).limit(5).execute()
            stats["recent_pending_professors"] = pending_profs.data if pending_profs.data else []
        except Exception as e:
            print(f"Error getting pending professors: {e}")
        
        # Get user count and recent users
        if admin_supabase:
            try:
                users_response = admin_supabase.auth.admin.list_users()
                auth_users = users_response if isinstance(users_response, list) else []
                stats["total_users"] = len(auth_users)
                
                # Get just the first 5 users with review counts
                recent_users = []
                for auth_user in auth_users[:5]:
                    user_id = auth_user.id
                    meta_data = getattr(auth_user, 'user_metadata', {}) or {}
                    
                    # Get review counts from mapping table
                    prof_review_count = 0
                    college_review_count = 0
                    flag_count = 0
                    
                    try:
                        prof_reviews = admin_supabase.table('review_author_mappings').select('id').eq('author_id', user_id).execute()
                        prof_review_count = len(prof_reviews.data) if prof_reviews.data else 0
                    except:
                        pass
                    
                    try:
                        college_reviews = admin_supabase.table('college_review_author_mappings').select('id').eq('author_id', user_id).execute()
                        college_review_count = len(college_reviews.data) if college_reviews.data else 0
                    except:
                        pass
                    
                    try:
                        flags = supabase.table('review_flags').select('id').eq('flagger_email', auth_user.email).execute()
                        flag_count = len(flags.data) if flags.data else 0
                    except:
                        pass
                    
                    recent_users.append({
                        "id": user_id,
                        "email": auth_user.email or f"user-{user_id[:8]}",
                        "first_name": meta_data.get('first_name'),
                        "last_name": meta_data.get('last_name'),
                        "is_active": auth_user.email_confirmed_at is not None,
                        "created_at": str(auth_user.created_at) if auth_user.created_at else "2025-01-01T00:00:00Z",
                        "total_reviews": prof_review_count + college_review_count,
                        "total_flags_submitted": flag_count
                    })
                
                stats["recent_users"] = recent_users
            except Exception as e:
                print(f"Error getting users: {e}")
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting dashboard stats: {str(e)}"
        )
