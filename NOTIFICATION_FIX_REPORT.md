# Notification System Fix Report

## Date: November 14, 2025

## Problem Summary
Notifications were being successfully inserted into the database by admin but were **not visible to users** when they requested their notifications.

## Root Cause Analysis

### The Issue
The notification system had a critical authentication context mismatch between the backend API and Supabase Row-Level Security (RLS):

1. **Admin sends notification**: Uses service role client → bypasses RLS → ✅ INSERT succeeds
2. **User requests notifications**: Backend uses anon client WITHOUT user JWT context → RLS checks `auth.uid()` → returns NULL → ❌ SELECT returns empty

### Technical Details

#### What Was Happening:
```
Admin Panel → POST /v1/notifications/send-to-user
  └─> Backend uses service_role client
  └─> RLS bypassed (service_role has all permissions)
  └─> Notification inserted: ✅ SUCCESS
  
User Frontend → GET /v1/notifications
  └─> Backend uses get_supabase() (anon client)
  └─> No user JWT context set on Supabase client
  └─> RLS policy: USING (auth.uid() = user_id)
  └─> auth.uid() returns NULL (no auth context)
  └─> RLS blocks all rows: ❌ EMPTY RESULT
```

#### Evidence from Logs:
```
✅ Admin token verified for: admin
🔑 Using SERVICE ROLE client for notification insert
📨 Insert result data: [{'id': 'bf3fd6f0-f267-457c-aa43-788fa5c13111', ...}]
INFO: "POST /v1/notifications/send-to-user HTTP/1.1" 200 OK

⚠️ Not an admin token (JWT error): Signature verification failed
🔍 Attempting Supabase token verification...
✅ Supabase user found: gauravguddeti682005@gmail.com
INFO: "GET /v1/notifications?limit=3 HTTP/1.1" 200 OK
```

**Note**: The GET request returned `200 OK` but with **empty data** because RLS silently filtered out all notifications.

## The Fix

### Changes Made to `backend/src/routers/notifications.py`:

#### 1. Updated Imports
```python
# Before
from ..lib.database import get_supabase, supabase_admin
from ..lib.auth import get_current_user

# After
from ..lib.database import get_supabase, get_supabase_service
from ..lib.auth import get_current_user, get_authenticated_supabase
```

#### 2. Fixed All GET/UPDATE/DELETE Endpoints
Updated these endpoints to use `get_authenticated_supabase()`:
- `GET /notifications` - Fetch user notifications
- `POST /notifications/{id}/read` - Mark notification as read
- `POST /notifications/read-all` - Mark all as read  
- `DELETE /notifications/{id}` - Delete notification

**Before:**
```python
async def get_user_notifications(
    current_user = Depends(get_current_user)
):
    supabase = get_supabase()  # ❌ No auth context
    user_id = current_user.get('id')
    query = supabase.table("notifications").select("*")
    query = query.eq("user_id", user_id)  # RLS still blocks this
```

**After:**
```python
async def get_user_notifications(
    current_user = Depends(get_current_user),
    supabase = Depends(get_authenticated_supabase)  # ✅ Has user JWT
):
    user_id = current_user.get('id')
    query = supabase.table("notifications").select("*")
    query = query.eq("user_id", user_id)  # RLS allows this now
```

#### 3. Improved Admin Send Endpoint
```python
# Before
admin_client = supabase_admin if supabase_admin else supabase

# After  
try:
    admin_client = get_supabase_service()
    using_service_role = True
except ValueError:
    admin_client = supabase
    using_service_role = False
```

## How the Fix Works

### Authentication Flow

1. **Frontend sends request** with `Authorization: Bearer <user_jwt_token>`
2. **Backend `get_current_user()`** validates the JWT and extracts user info
3. **Backend `get_authenticated_supabase()`** creates a Supabase client with the JWT token set
4. **Supabase client** makes database query with JWT in Authorization header
5. **RLS policy** sees `auth.uid()` from the JWT and allows access to matching rows

### Key Function: `get_authenticated_supabase()`

Located in `backend/src/lib/auth.py`, this function:
```python
async def get_authenticated_supabase(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Client:
    """Get Supabase client authenticated with the current user's JWT token.
    
    This is required for RLS policies to work correctly - the client needs
    the user's JWT token so that auth.uid() returns the correct user ID.
    """
    if not credentials:
        raise AuthError("Authorization header missing")
    
    token = credentials.credentials
    
    # Verify token is valid
    anon_supabase = get_supabase()
    user = get_user_from_token(anon_supabase, token)
    if user is None:
        raise AuthError("Invalid token or user not found")
    
    # Return authenticated client with JWT token
    return get_supabase_with_token(token)
```

And `get_supabase_with_token()` in `backend/src/lib/database.py`:
```python
def get_supabase_with_token(token: str) -> Client:
    """Get Supabase client authenticated with user's JWT token."""
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Set the JWT token on the postgrest client
    client.postgrest.auth(token)
    
    # Ensure the Authorization header is set
    client.postgrest.session.headers['Authorization'] = f"Bearer {token}"
    client.postgrest.session.headers['apikey'] = SUPABASE_ANON_KEY
    
    return client
```

## RLS Policies (No Changes Needed)

The existing RLS policies are correct:

```sql
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

These policies work correctly **when the Supabase client has the user's JWT token set**.

## Testing the Fix

### Before Fix:
```bash
# Admin sends notification
POST /v1/notifications/send-to-user
→ 200 OK, notification inserted

# User requests notifications  
GET /v1/notifications
→ 200 OK, but notifications: []  # ❌ Empty!
```

### After Fix:
```bash
# Admin sends notification
POST /v1/notifications/send-to-user
→ 200 OK, notification inserted

# User requests notifications
GET /v1/notifications  
→ 200 OK, notifications: [{...}]  # ✅ Shows notifications!
```

## What This Means

### For Users:
- ✅ Notifications sent from admin panel now appear immediately
- ✅ Notification bell will show correct unread count
- ✅ Users can mark notifications as read
- ✅ Users can delete their own notifications

### For Admins:
- ✅ Send notifications to individual users works
- ✅ Broadcast notifications to all users works
- ✅ Service role client properly bypasses RLS for admin operations

## Security Considerations

### This Fix Is Secure Because:
1. **RLS is still enforced** - users can only see their own notifications
2. **JWT validation happens** in `get_current_user()` before creating authenticated client
3. **Service role is only used** for admin operations (insert from admin panel)
4. **User operations use user's own JWT** - can't access other users' data

### The Authentication Chain:
```
Frontend JWT → FastAPI validates → Creates authenticated Supabase client
                                  → RLS sees auth.uid()
                                  → Only returns user's own data
```

## Files Modified
- `backend/src/routers/notifications.py` - Updated 6 endpoints to use authenticated Supabase client

## Files NOT Modified (Already Correct)
- `backend/src/lib/auth.py` - Already had `get_authenticated_supabase()`
- `backend/src/lib/database.py` - Already had `get_supabase_with_token()`
- `backend/scripts/create_notifications_system.sql` - RLS policies are correct
- Frontend code - No changes needed

## Deployment Notes

### No Database Changes Required
- No SQL scripts need to be run
- No RLS policies need to be updated
- Just deploy the updated backend code

### Environment Variables Required
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Anon/public key for client operations
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations (bypasses RLS)

### Verification Steps After Deployment:
1. Admin sends a notification to a specific user
2. That user logs in and checks notifications
3. Notification should appear immediately
4. User can mark it as read
5. Check Railway logs for successful queries

## Summary

The notification system was failing because the backend was using an unauthenticated Supabase client to fetch user notifications. This caused RLS to block all results since `auth.uid()` was NULL.

By switching to `get_authenticated_supabase()`, which creates a Supabase client with the user's JWT token properly set, RLS can now correctly identify the authenticated user and allow them to read their own notifications.

**The fix is minimal, secure, and follows Supabase best practices for RLS authentication.**
