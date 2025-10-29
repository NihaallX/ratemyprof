"""Authentication API routes for RateMyProf backend using Supabase Auth."""
from typing import Optional, Dict, Any
import uuid
import re
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator
from supabase import Client

from src.lib.database import get_supabase

router = APIRouter()

class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    college_id: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError('Name must be at least 2 characters long')
            if len(v) > 100:
                raise ValueError('Name cannot be longer than 100 characters')
            return v
        return v
    
    @field_validator('college_id')
    @classmethod
    def validate_college_id(cls, v):
        if v is not None:
            v = v.strip()
            
            # Indian College ID Patterns
            patterns = [
                # PRN Numbers (Maharashtra - Pune University, VU, etc.)
                r'^[0-9]{10,15}$',  # 10-15 digit PRN like 312303501027X
                
                # University/College Code formats
                r'^[A-Z]{2,6}[/-][0-9]{4}[/-][A-Z0-9]{3,10}$',  # VU/2023/CSE001, DU-2023-12345
                r'^[A-Z]{2,6}[0-9]{6,12}$',  # VU20231234, DU202312345
                
                # State University formats
                r'^[A-Z]{2}[/-][A-Z]{2,6}[/-][0-9]{4}[/-][A-Z0-9]{3,8}$',  # MH/VU/2023/CSE001
                r'^[A-Z]{2,4}[0-9]{2}[A-Z]{2,4}[0-9]{4,8}$',  # MH23CSE12345
                
                # AICTE/Central University formats  
                r'^[0-9]{2}[A-Z]{2,4}[0-9]{6,10}$',  # 23CSE1234567
                r'^[A-Z]{3,6}[/-][0-9]{4}[/-][0-9]{4,8}$',  # IIITD/2023/12345
                
                # Delhi University style
                r'^DU[/-][0-9]{4}[/-][A-Z]{2,6}[/-][0-9]{3,6}$',  # DU/2023/CSE/001
                
                # Generic college codes
                r'^[A-Z0-9]{6,20}$',  # Alphanumeric 6-20 chars
                
                # Legacy UUID support (for existing test data)
                r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            ]
            
            # Check if ID matches any valid pattern
            if not any(re.match(pattern, v, re.IGNORECASE) for pattern in patterns):
                raise ValueError(
                    'College ID must be a valid format (PRN number, university code, or standard Indian college ID)'
                )
        return v

class UserLoginRequest(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if not v or not v.strip():
            raise ValueError('Email cannot be empty')
        return v.strip()
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if not v or not v.strip():
            raise ValueError('Password cannot be empty')
        return v


class SignupResponse(BaseModel):
    message: str
    user_id: str


class TokenResponse(BaseModel):
    """Response model for authentication tokens."""
    access_token: str
    token_type: str
    expires_in: int
    user: Dict[str, Any]


class ErrorResponse(BaseModel):
    error: str
    message: str

@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(request: UserSignupRequest, supabase: Client = Depends(get_supabase)):
    try:
        user_metadata = {}
        if request.name:
            user_metadata["name"] = request.name
        if request.college_id:
            user_metadata["college_id"] = request.college_id
        
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {"data": user_metadata}
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )
        
        return SignupResponse(
            message="Account created successfully. Please check your email for verification link.",
            user_id=auth_response.user.id
        )
        
    except Exception as e:
        error_msg = str(e).lower()
        
        # Handle duplicate email
        if "user already registered" in error_msg or "already exists" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists"
            )
        
        # Handle other Supabase auth errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create account: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: UserLoginRequest,
    supabase: Client = Depends(get_supabase)
):
    """Authenticate user and return access tokens.
    
    Validates user credentials and returns JWT tokens for API access.
    """
    try:
        # Check for hardcoded admin credentials first
        if request.email == "admin@gmail.com" and request.password == "gauravnihal123":
            # Create admin token using the same JWT system
            from datetime import datetime, timedelta
            import jwt
            
            SECRET_KEY = "ratemyprof-admin-secret-key-2025"
            ALGORITHM = "HS256"
            ACCESS_TOKEN_EXPIRE_HOURS = 24
            
            expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
            admin_token_data = {
                "sub": "admin@gmail.com",
                "email": "admin@gmail.com",
                "username": "admin@gmail.com",
                "role": "admin",
                "exp": expire
            }
            admin_token = jwt.encode(admin_token_data, SECRET_KEY, algorithm=ALGORITHM)
            
            admin_user_data = {
                "id": "admin-user-id",
                "email": "admin@gmail.com", 
                "is_verified": True,
                "is_moderator": True,
                "name": "Administrator"
            }
            
            return TokenResponse(
                access_token=admin_token,
                token_type="bearer",
                expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600,
                user=admin_user_data
            )
        
        # Regular Supabase authentication
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user_data = {
            "id": auth_response.user.id,
            "email": auth_response.user.email,
            "is_verified": auth_response.user.email_confirmed_at is not None,
            "is_moderator": False,  # Default - can be enhanced later
            "name": auth_response.user.user_metadata.get("name")
        }
        
        return TokenResponse(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            expires_in=auth_response.session.expires_in or 3600,
            user=user_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        if "invalid login credentials" in error_msg or "invalid email or password" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login failed"
        )


class UserVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str
    
    @field_validator('otp_code')
    @classmethod
    def validate_otp_code(cls, v):
        # Must be exactly 6 digits
        if not re.match(r'^[0-9]{6}$', v):
            raise ValueError('OTP code must be exactly 6 digits')
        return v


@router.post("/verify")
async def verify_email(
    request: UserVerifyRequest,
    supabase: Client = Depends(get_supabase)
):
    """Verify user email address with OTP code.
    
    Confirms the user's email address using the OTP sent during signup.
    """
    try:
        # Verify the OTP with Supabase
        verify_response = supabase.auth.verify_otp({
            "email": request.email,
            "token": request.otp_code,
            "type": "email"
        })
        
        if not verify_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired verification code"
            )
        
        return {"message": "Email verified successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        
        if "token has expired" in error_msg or "expired" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Verification code has expired"
            )
        elif "invalid" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid verification code"
            )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification failed"
        )


@router.delete("/delete-account")
async def delete_account(
    supabase: Client = Depends(get_supabase)
):
    """Delete the authenticated user's account and all associated data.
    
    This endpoint:
    1. Deletes all user reviews
    2. Deletes all user activities
    3. Deletes the user's profile data
    4. Deletes the user account from Supabase Auth
    
    This action is irreversible.
    """
    try:
        # Get the authenticated user from the request
        user = supabase.auth.get_user()
        
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        user_id = user.user.id
        
        # Use admin client for deletion operations
        from src.lib.database import get_admin_supabase
        admin_supabase = get_admin_supabase()
        
        # Delete user's reviews (both professor and college reviews)
        admin_supabase.table('reviews').delete().eq('user_id', user_id).execute()
        admin_supabase.table('college_reviews').delete().eq('user_id', user_id).execute()
        
        # Delete user's review votes
        admin_supabase.table('review_votes').delete().eq('user_id', user_id).execute()
        admin_supabase.table('college_review_votes').delete().eq('user_id', user_id).execute()
        
        # Delete user activities
        admin_supabase.table('user_activities').delete().eq('user_id', user_id).execute()
        
        # Finally, delete the user account
        admin_supabase.auth.admin.delete_user(user_id)
        
        return {
            "message": "Account deleted successfully",
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )
