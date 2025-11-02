# Automatic Notification Triggers Setup

## Overview
This script adds automatic notification triggers that send notifications to users on:
1. **New User Signup**: Welcome message with a humorous tone
2. **Professor Approval**: Notification when admin approves a new professor

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `add_automatic_notification_triggers.sql`
5. Click **Run** or press `Ctrl+Enter`

### Option 2: Supabase CLI
```bash
supabase db execute --file backend/scripts/add_automatic_notification_triggers.sql
```

### Option 3: psql
```bash
psql -h your-db-host -U postgres -d your-database -f backend/scripts/add_automatic_notification_triggers.sql
```

## What It Does

### 1. Welcome Notification Trigger
- **Trigger**: `trigger_welcome_notification`
- **Fires**: When a new user signs up (`AFTER INSERT` on `auth.users`)
- **Message**: 
  ```
  🎉 Welcome to RateMyProf!
  
  Hey there! Ready to spill the tea on professors? ☕ Rate your profs, 
  help your juniors dodge bullets, and maybe roast a few along the way. 
  Let's make education transparent! 🎓✨
  ```
- **Expires**: 4 days from creation

### 2. Professor Approval Notification
- **Trigger**: `trigger_notify_new_professor`
- **Fires**: When admin approves a professor (`AFTER UPDATE` when `is_verified` becomes `true`)
- **Message**: 
  ```
  🎓 Fresh Professor Alert!
  
  Dr. Sharma from VIT University just landed! Time to share your wisdom 
  (or warnings 😏). Be the hero your juniors need! 🦸
  ```
- **Broadcasts**: To ALL users
- **Expires**: 4 days from creation

## Testing

### Test Welcome Notification
1. Create a new user account on your site
2. Check the notifications inbox - should see welcome message immediately

### Test Professor Approval Notification
1. Submit a new professor (unverified)
2. Go to admin panel → Pending Approval
3. Approve the professor
4. All users should receive a notification about the new professor

## Notification Behavior

- **Welcome**: Sent only to the new user (personal notification)
- **Professor Approval**: Broadcast to all users (everyone gets notified)
- **Auto-Expiry**: Both types auto-delete after 4 days
- **Read Status**: Users can mark as read or dismiss
- **Database Trigger**: Fully automatic, no manual intervention needed

## Rollback (if needed)

To remove the triggers:
```sql
-- Remove welcome trigger
DROP TRIGGER IF EXISTS trigger_welcome_notification ON auth.users;
DROP FUNCTION IF EXISTS public.send_welcome_notification();

-- Remove professor approval trigger  
DROP TRIGGER IF EXISTS trigger_notify_new_professor ON public.professors;
DROP FUNCTION IF EXISTS public.notify_new_professor();
```

## Dependencies

Requires:
- ✅ `notifications` table (from `create_notifications_system.sql`)
- ✅ `create_broadcast_notification()` function
- ✅ `auth.users` table (Supabase built-in)
- ✅ `professors` table with `is_verified` column

## Notes

- The welcome trigger works on `auth.users` which is Supabase's built-in auth table
- The professor trigger now only fires when `is_verified` changes from `false` to `true` (preventing duplicate notifications)
- Both notifications use humorous, engaging language to increase user engagement
- Notifications are mobile-friendly and appear in the bell icon inbox
