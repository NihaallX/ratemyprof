"""College review moderation utilities for Supabase-based RateMyProf platform.

Provides functions for flagging and moderating college reviews.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from supabase import Client


def flag_college_review(
    supabase: Client,
    college_review_id: str,
    reporter_id: str,
    flag_type: str,
    reason: Optional[str] = None
) -> Dict[str, Any]:
    """Flag a college review for moderation.
    
    Args:
        supabase: Supabase client
        college_review_id: ID of college review to flag
        reporter_id: ID of user reporting the review
        flag_type: Type of violation
        reason: Optional detailed reason
        
    Returns:
        Created flag record
        
    Raises:
        Exception: If flagging fails
    """
    # Check if user has already flagged this review
    existing_flag = supabase.table('college_review_flags').select('id').eq(
        'college_review_id', college_review_id
    ).eq(
        'reporter_id', reporter_id
    ).execute()
    
    if existing_flag.data:
        raise Exception("You have already flagged this review")
    
    # Create flag record
    flag_data = {
        'college_review_id': college_review_id,
        'reporter_id': reporter_id,
        'flag_type': flag_type,
        'reason': reason,
        'status': 'pending',
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('college_review_flags').insert(flag_data).execute()
    
    if not result.data:
        raise Exception("Failed to create flag")
    
    return result.data[0]


def get_flagged_college_reviews(
    supabase: Client,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """Get flagged college reviews for admin review.
    
    Args:
        supabase: Supabase client
        status: Filter by flag status (pending, reviewed, dismissed)
        limit: Number of records to return
        offset: Number of records to skip
        
    Returns:
        List of flagged college reviews with flag details
    """
    # Build query - simplified to avoid nested join issues
    query = supabase.table('college_review_flags').select('*')
    
    if status:
        query = query.eq('status', status)
    
    query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
    
    result = query.execute()
    flags = result.data if result.data else []
    
    # For each flag, fetch the college review and college details separately
    for flag in flags:
        try:
            # Get college review
            review_response = supabase.table('college_reviews').select('*').eq('id', flag['college_review_id']).execute()
            if review_response.data and len(review_response.data) > 0:
                flag['college_review'] = review_response.data[0]
                
                # Get college details
                college_id = flag['college_review'].get('college_id')
                if college_id:
                    college_response = supabase.table('colleges').select('id, name, city, state').eq('id', college_id).execute()
                    if college_response.data and len(college_response.data) > 0:
                        flag['college'] = college_response.data[0]
                    else:
                        flag['college'] = {'name': 'Unknown', 'city': 'Unknown', 'state': 'Unknown'}
                else:
                    flag['college'] = {'name': 'Unknown', 'city': 'Unknown', 'state': 'Unknown'}
            else:
                flag['college_review'] = None
                flag['college'] = None
        except Exception as e:
            print(f"Error fetching details for flag {flag['id']}: {e}")
            flag['college_review'] = None
            flag['college'] = None
    
    return flags


def review_college_review_flag(
    supabase: Client,
    flag_id: str,
    admin_id: str,
    action: str,  # 'approve_flag', 'dismiss_flag'
    admin_notes: Optional[str] = None
) -> Dict[str, Any]:
    """Admin review of a college review flag.
    
    Args:
        supabase: Supabase client (should be service_role client for admin)
        flag_id: ID of flag to review
        admin_id: ID of admin reviewing the flag
        action: Action to take (approve_flag, dismiss_flag)
        admin_notes: Optional admin notes
        
    Returns:
        Updated flag record
        
    Raises:
        Exception: If review fails
    """
    try:
        now = datetime.utcnow().isoformat()
        
        print(f"[FLAG REVIEW] Starting review for flag_id={flag_id}, action={action}")
        
        # Get flag details
        flag_result = supabase.table('college_review_flags').select('*').eq('id', flag_id).single().execute()
        print(f"[FLAG REVIEW] Flag query result: {flag_result}")
        
        if not flag_result.data:
            raise Exception("Flag not found")
        
        flag = flag_result.data
        print(f"[FLAG REVIEW] Flag data: status={flag.get('status')}, college_review_id={flag.get('college_review_id')}")
        
        if flag.get('status') != 'pending':
            raise Exception(f"Flag has already been reviewed (current status: {flag.get('status')})")
        
        # Update flag status
        update_data = {
            'status': 'reviewed',
            'reviewed_by': admin_id,
            'admin_notes': admin_notes,
            'reviewed_at': now,
            'updated_at': now
        }
        
        print(f"[FLAG REVIEW] Updating flag with data: {update_data}")
        updated_flag = supabase.table('college_review_flags').update(update_data).eq('id', flag_id).execute()
        print(f"[FLAG REVIEW] Flag updated: {updated_flag}")
        
        # If flag is approved, take action on the review
        if action == 'approve_flag':
            print(f"[FLAG REVIEW] Approving flag - marking review as flagged")
            # Mark college review as flagged/hidden
            review_update = supabase.table('college_reviews').update({
                'is_flagged': True,
                'status': 'flagged',
                'updated_at': now
            }).eq('id', flag['college_review_id']).execute()
            print(f"[FLAG REVIEW] Review updated: {review_update}")
            
            # Try to log moderation action (optional - don't fail if it errors)
            try:
                log_moderation_action(
                    supabase,
                    admin_id,
                    'college_review_flagged',
                    'college_review',
                    flag['college_review_id'],
                    f"Approved flag: {flag['flag_type']}",
                    admin_notes or f"College review flagged for: {flag['flag_type']}"
                )
            except Exception as log_error:
                # Log error but don't fail the whole operation
                print(f"[FLAG REVIEW] Warning: Failed to log moderation action: {log_error}")
        
        result = updated_flag.data[0] if updated_flag.data else flag
        print(f"[FLAG REVIEW] Completed successfully, returning: {result}")
        return result
        
    except Exception as e:
        print(f"[FLAG REVIEW] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_college_review_moderation_stats(supabase: Client) -> Dict[str, int]:
    """Get college review moderation statistics.
    
    Args:
        supabase: Supabase client
        
    Returns:
        Dictionary with moderation stats
    """
    try:
        # Count pending flags
        pending_flags = supabase.table('college_review_flags').select('*').eq('status', 'pending').execute()
        
        # Count total flagged reviews
        total_flags = supabase.table('college_review_flags').select('*').execute()
        
        # Count flagged college reviews (reviews that are hidden due to flags)
        flagged_reviews = supabase.table('college_reviews').select('*').eq('is_flagged', True).execute()
        
        # Count total college reviews
        total_reviews = supabase.table('college_reviews').select('*').execute()
        
        return {
            'pending_college_review_flags': len(pending_flags.data) if pending_flags.data else 0,
            'total_college_review_flags': len(total_flags.data) if total_flags.data else 0,
            'flagged_college_reviews': len(flagged_reviews.data) if flagged_reviews.data else 0,
            'total_college_reviews': len(total_reviews.data) if total_reviews.data else 0
        }
    except Exception:
        return {
            'pending_college_review_flags': 0,
            'total_college_review_flags': 0,
            'flagged_college_reviews': 0,
            'total_college_reviews': 0
        }


def log_moderation_action(
    supabase: Client,
    moderator_id: str,
    action_type: str,
    target_type: str,
    target_id: str,
    reason: str,
    details: str,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    """Log a moderation action for audit trail.
    
    Args:
        supabase: Supabase client
        moderator_id: ID of moderator taking action
        action_type: Type of action taken
        target_type: Type of target (college_review, flag, etc.)
        target_id: ID of target object
        reason: Reason for action
        details: Additional details
        ip_address: Optional IP address
        
    Returns:
        Created log record
    """
    log_data = {
        'moderator_id': moderator_id,
        'action_type': action_type,
        'target_type': target_type,
        'target_id': target_id,
        'reason': reason,
        'details': details,
        'ip_address': ip_address,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('moderation_logs').insert(log_data).execute()
    return result.data[0] if result.data else log_data


def get_valid_college_review_flag_types() -> List[Dict[str, str]]:
    """Get list of valid flag types for college reviews.
    
    Returns:
        List of flag types with descriptions
    """
    return [
        {"type": "spam", "description": "Spam, promotional content, or advertisements"},
        {"type": "inappropriate", "description": "Inappropriate or unsuitable content"},
        {"type": "fake", "description": "Fake, fraudulent, or misleading review"},
        {"type": "offensive", "description": "Offensive language or inappropriate content"},
        {"type": "harassment", "description": "Harassment, bullying, or personal attacks"},
        {"type": "irrelevant", "description": "Content not relevant to the college"},
        {"type": "duplicate", "description": "Duplicate or repeated review content"},
        {"type": "other", "description": "Other violation (please specify in reason)"}
    ]