# Notification System Testing Guide

## Issues Fixed:
1. ✅ Added option to send to specific user (User ID required)
2. ✅ Added detailed console logging for debugging
3. ✅ Updated UI to show both broadcast and specific user options

## Testing Steps:

### 1. Test Admin Notification Sending

**To test broadcast notifications:**
1. Login as admin (email ending with @ratemyprof.in)
2. Go to Admin Panel > Notifications tab
3. Select a template from the dropdown
4. Fill in required fields
5. Keep "All Users (Broadcast)" selected
6. Click "Send to All Users"
7. Check console logs for:
   - `📤 Sending notification to:` - Should show broadcast endpoint
   - `📦 Request body:` - Should show template_id and template_data
   - `📡 Response status:` - Should be 200
   - `📨 Response data:` - Should show notification_count

**To test specific user notifications:**
1. Go to Admin Panel > Users tab
2. Copy a user's ID
3. Go to Notifications tab
4. Select a template
5. Fill in required fields
6. Select "Specific User" radio button
7. Paste the User ID
8. Click "Send to User"

### 2. Test Automatic Notifications

**Welcome Notification:**
1. Create a new user account
2. After signup, check the notification inbox
3. Should see: "🎉 Welcome to RateMyProf!"

**New Professor Notification:**
1. Admin adds a new professor
2. Admin approves the professor (sets is_verified = true)
3. All users should receive: "🎓 Fresh Professor Alert!"

### 3. Check Database Functions

Run these SQL queries in Supabase SQL Editor:

```sql
-- Check if notification functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%';

-- Check if triggers exist
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%notification%';

-- Test broadcast function
SELECT create_broadcast_notification(
  'Test Notification',
  'This is a test message',
  'custom',
  '{}'::jsonb
);

-- Check recent notifications
SELECT id, user_id, title, message, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
```

### 4. Common Issues & Solutions

**Issue: "No auth token available"**
- Solution: Make sure you're logged in as admin
- Check localStorage for 'adminToken' or 'adminSession'

**Issue: "Failed to fetch templates"**
- Solution: Backend might not be running
- Check API endpoint: http://localhost:8000/v1/notifications/templates

**Issue: "Authentication required"**
- Solution: Your session expired, log out and log back in

**Issue: Welcome notification not sent**
- Solution: Trigger might not be installed
- Run: `backend/scripts/add_automatic_notification_triggers.sql`

**Issue: Professor notification not sent**
- Solution: Professor must be APPROVED (is_verified = true)
- Check if trigger exists on professors table

### 5. Verify Permissions

```sql
-- Check RLS policies on notifications table
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Check function permissions
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
AND routine_name LIKE '%notification%';
```

## Expected Console Logs (Success):

```
✅ Using admin token from localStorage
🔍 Fetching templates from: https://ratemyprof-production.up.railway.app/v1/notifications/templates
📡 Response status: 200 OK
✅ Templates received: 20 templates
📤 Sending notification to: .../notifications/broadcast
📦 Request body: { template_id: "PROFESSOR_TRENDING", template_data: {...} }
📡 Response status: 200
📨 Response data: { success: true, message: "Notification sent to 42 users", notification_count: 42 }
```

## API Endpoints Used:

- GET `/v1/notifications/templates` - Get all templates
- POST `/v1/notifications/broadcast` - Send to all users
- POST `/v1/notifications/send-to-user` - Send to specific user
- GET `/v1/notifications` - Get user's notifications
- POST `/v1/notifications/{id}/read` - Mark as read
