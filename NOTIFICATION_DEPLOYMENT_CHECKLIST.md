# Notification Fix Deployment Checklist

## Pre-Deployment Verification

- [x] Code changes made to `backend/src/routers/notifications.py`
- [x] No syntax errors in modified files
- [x] No database schema changes required
- [x] No new dependencies added

## Deployment Steps

### 1. Backup Current State (Optional but Recommended)
```powershell
# Commit current changes
git add backend/src/routers/notifications.py
git commit -m "fix: notification RLS authentication context issue"
```

### 2. Deploy to Railway

Railway will automatically redeploy when you push to GitHub:

```powershell
# Push to main branch
git push origin main
```

Or manually trigger a deployment in Railway dashboard.

### 3. Verify Environment Variables

Ensure these are set in Railway:
- ✅ `SUPABASE_URL` 
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` ← **CRITICAL** for admin notifications

To check in Railway:
1. Go to your backend service
2. Click "Variables" tab
3. Verify all three Supabase variables are present

### 4. Monitor Deployment

Watch Railway logs for:
```
✅ Service role client initialized (RLS bypass enabled)
✅ Authorization header correctly set with JWT token
```

If you see:
```
⚠️ SUPABASE_SERVICE_ROLE_KEY not set - admin operations will use anon key (RLS applies)
```
→ Admin sending notifications will fail. Add the service role key.

## Post-Deployment Testing

### Test 1: Admin Sends Notification to User

1. **Admin Panel**: 
   - Go to Notifications tab
   - Select a user (e.g., Gaurav)
   - Send a test notification
   - Should see success message

2. **Check Railway Logs**:
   ```
   🔑 Using SERVICE ROLE client for notification insert
   📨 Insert result data: [{'id': '...', 'user_id': '...', ...}]
   INFO: "POST /v1/notifications/send-to-user HTTP/1.1" 200 OK
   ```

### Test 2: User Receives Notification

1. **Login as the target user** (gauravguddeti682005@gmail.com)

2. **Check notification bell** in the top navigation
   - Should show a badge with unread count
   - Click to open notification inbox

3. **Verify notification appears**
   - Should see the notification you sent from admin
   - Title, message, and timestamp should be correct

4. **Check Railway Logs**:
   ```
   ✅ Supabase user found: gauravguddeti682005@gmail.com
   🔑 Authorization header correctly set with JWT token
   INFO: "GET /v1/notifications?limit=3 HTTP/1.1" 200 OK
   ```

### Test 3: Mark as Read

1. **Click on a notification**
   - Should mark it as read
   - Badge count should decrease

2. **Refresh the page**
   - Notification should still show as read

### Test 4: Broadcast Notification

1. **Admin Panel**: 
   - Go to Notifications tab
   - Use "Send to All Users" feature
   - Send a broadcast message

2. **Login as different users**
   - All users should receive the notification

## Troubleshooting

### Issue: User still can't see notifications

**Check Railway logs for:**
```
⚠️ ERROR: Authorization header is not properly set!
```

**Solution**: This indicates a problem with JWT token setup. Verify:
- Frontend is sending `Authorization: Bearer <token>` header
- Token is a valid Supabase JWT
- Token hasn't expired

### Issue: Admin can't send notifications

**Check Railway logs for:**
```
⚠️ SUPABASE_SERVICE_ROLE_KEY not set
```

**Solution**: Add the service role key to Railway environment variables.

**Get the service role key:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "service_role" key (starts with `eyJ...`)
4. Add to Railway as `SUPABASE_SERVICE_ROLE_KEY`

### Issue: RLS still blocking notifications

**Verify RLS policies in Supabase:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'notifications';

-- Should show rowsecurity = true

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';

-- Should show:
-- 1. "Users can view their own notifications" (SELECT)
-- 2. "Users can update their own notifications" (UPDATE)
-- 3. "Admins can insert notifications" (INSERT)
```

If policies are missing, run:
```sql
-- From: backend/scripts/create_notifications_system.sql
```

## Rollback Plan

If issues occur, rollback is simple:

```powershell
# Revert the commit
git revert HEAD

# Push to trigger redeployment
git push origin main
```

The old code will use the anon client, which won't work for notifications, but won't break anything else.

## Success Criteria

✅ Admin can send notifications to individual users  
✅ Admin can broadcast notifications to all users  
✅ Users receive notifications in real-time  
✅ Users can mark notifications as read  
✅ Users can delete their own notifications  
✅ Notification count badge updates correctly  
✅ No error logs in Railway  

## Support

If you encounter issues:
1. Check Railway logs for specific error messages
2. Verify environment variables are set correctly
3. Test with a single user first before broadcasting
4. Check browser console for frontend errors

## Notes

- This fix does NOT require database migrations
- This fix does NOT require frontend changes
- Service role key is required for admin operations
- Users' JWT tokens are automatically validated by existing auth middleware
