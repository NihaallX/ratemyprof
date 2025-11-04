"""
Settings API endpoints
Handles global site settings like maintenance mode
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from ..lib.database import get_supabase, get_supabase_admin
from ..lib.auth import verify_admin_token

router = APIRouter(tags=["settings"])


# Pydantic Models
class MaintenanceModeResponse(BaseModel):
    """Response for maintenance mode status"""
    maintenance_mode_enabled: bool
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None


class MaintenanceModeUpdate(BaseModel):
    """Request to update maintenance mode"""
    enabled: bool


class SettingsResponse(BaseModel):
    """Response for all site settings"""
    maintenance_mode_enabled: bool
    updated_at: Optional[datetime] = None


@router.get("/maintenance", response_model=MaintenanceModeResponse)
async def get_maintenance_mode():
    """
    Get current maintenance mode status.
    Public endpoint - no authentication required.
    
    Returns:
        MaintenanceModeResponse: Current maintenance mode status
    """
    try:
        supabase = get_supabase()
        
        # Query the site_settings table
        result = supabase.table('site_settings') \
            .select('*') \
            .eq('setting_key', 'maintenance_mode') \
            .single() \
            .execute()
        
        if result.data:
            return MaintenanceModeResponse(
                maintenance_mode_enabled=result.data.get('setting_value', False),
                updated_at=result.data.get('updated_at'),
                updated_by=result.data.get('updated_by')
            )
        else:
            # If no record exists, return default (disabled)
            return MaintenanceModeResponse(
                maintenance_mode_enabled=False,
                updated_at=None,
                updated_by=None
            )
            
    except Exception as e:
        # If table doesn't exist or other error, return default
        print(f"Error fetching maintenance mode: {str(e)}")
        return MaintenanceModeResponse(
            maintenance_mode_enabled=False,
            updated_at=None,
            updated_by=None
        )


@router.post("/maintenance", response_model=MaintenanceModeResponse)
async def update_maintenance_mode(
    update: MaintenanceModeUpdate,
    authorization: Optional[str] = Header(None)
):
    """
    Update maintenance mode status.
    Admin only endpoint - requires admin token.
    
    Args:
        update: New maintenance mode state
        authorization: Admin JWT token in Authorization header
        
    Returns:
        MaintenanceModeResponse: Updated maintenance mode status
        
    Raises:
        HTTPException: If not authenticated as admin or update fails
    """
    # Verify admin token
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        # Extract token from "Bearer <token>" format
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        admin_username = verify_admin_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid admin token: {str(e)}")
    
    try:
        # Use admin client to bypass RLS
        supabase = get_supabase_admin()
        
        if not supabase:
            raise HTTPException(status_code=500, detail="Database admin access not configured")
        
        # Check if setting exists
        existing = supabase.table('site_settings') \
            .select('*') \
            .eq('setting_key', 'maintenance_mode') \
            .execute()
        
        setting_data = {
            'setting_key': 'maintenance_mode',
            'setting_value': update.enabled,
            'updated_at': datetime.utcnow().isoformat(),
            'updated_by': admin_username
        }
        
        if existing.data and len(existing.data) > 0:
            # Update existing record
            result = supabase.table('site_settings') \
                .update(setting_data) \
                .eq('setting_key', 'maintenance_mode') \
                .execute()
        else:
            # Insert new record
            result = supabase.table('site_settings') \
                .insert(setting_data) \
                .execute()
        
        if result.data:
            return MaintenanceModeResponse(
                maintenance_mode_enabled=update.enabled,
                updated_at=datetime.utcnow(),
                updated_by=admin_username
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to update maintenance mode")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating maintenance mode: {str(e)}")


@router.get("", response_model=SettingsResponse)
async def get_all_settings():
    """
    Get all public site settings.
    Public endpoint - no authentication required.
    
    Returns:
        SettingsResponse: All public site settings
    """
    try:
        supabase = get_supabase()
        
        # Query maintenance mode
        result = supabase.table('site_settings') \
            .select('*') \
            .eq('setting_key', 'maintenance_mode') \
            .single() \
            .execute()
        
        if result.data:
            return SettingsResponse(
                maintenance_mode_enabled=result.data.get('setting_value', False),
                updated_at=result.data.get('updated_at')
            )
        else:
            return SettingsResponse(
                maintenance_mode_enabled=False,
                updated_at=None
            )
            
    except Exception as e:
        print(f"Error fetching settings: {str(e)}")
        return SettingsResponse(
            maintenance_mode_enabled=False,
            updated_at=None
        )
