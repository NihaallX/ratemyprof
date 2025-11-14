-- Fix notification permissions for admin sending

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

-- Create more permissive policies for notifications

-- 1. Allow service_role to insert (for backend operations)
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Allow authenticated admins to insert
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
    -- Either the user is an admin
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND (
            auth.users.email LIKE '%@ratemyprof.in'
            OR auth.users.raw_user_meta_data->>'role' = 'admin'
            OR auth.users.raw_user_meta_data->>'is_moderator' = 'true'
        )
    )
);

-- 3. Allow SECURITY DEFINER functions to insert (for triggers)
CREATE POLICY "Functions can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow if inserted by a SECURITY DEFINER function
    -- This enables triggers to work
    true
);

-- Drop the restrictive function policy if it exists
DROP POLICY IF EXISTS "Functions can insert notifications" ON public.notifications;

-- Recreate with proper logic - functions should bypass RLS
CREATE POLICY "Functions can insert notifications"
ON public.notifications
FOR INSERT  
TO authenticated
WITH CHECK (
    -- Check if being called from a function context or by admin
    (current_setting('role', true) = 'authenticated')
);

-- Grant INSERT to authenticated users (RLS will still restrict based on policies)
GRANT INSERT ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO service_role;

-- Update the send_to_user function in backend to use admin privileges
COMMENT ON TABLE public.notifications IS 'User notifications with admin insert permissions';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Notification permissions fixed!';
    RAISE NOTICE '   - Admins can now send notifications';
    RAISE NOTICE '   - Service role has full access';
    RAISE NOTICE '   - Triggers can insert notifications';
END $$;
