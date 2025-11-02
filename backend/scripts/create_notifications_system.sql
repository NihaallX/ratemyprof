-- Notifications System for RateMyProf
-- Stores system notifications, new professor/college alerts, and admin custom notifications

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('new_professor', 'new_college', 'custom', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '4 days'),
    
    -- Optional metadata
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_expires_at ON public.notifications(expires_at);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only read their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only admins can insert notifications
-- For broadcast notifications (user_id is NULL), admins insert then trigger creates copies for each user
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
    -- Check if user is admin
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND (
            auth.users.email LIKE '%@ratemyprof.in'
            OR auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    )
);

-- Admins can delete any notification
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND (
            auth.users.email LIKE '%@ratemyprof.in'
            OR auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    )
);

-- Function to create notification for all users (broadcast)
CREATE OR REPLACE FUNCTION public.create_broadcast_notification(
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'custom',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_count INTEGER := 0;
BEGIN
    -- Insert notification for all authenticated users
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    SELECT 
        id,
        p_title,
        p_message,
        p_type,
        p_metadata
    FROM auth.users
    WHERE id IS NOT NULL;
    
    GET DIAGNOSTICS notification_count = ROW_COUNT;
    
    RETURN notification_count;
END;
$$;

-- Function to auto-cleanup expired notifications (run daily via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM public.notifications
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Trigger function to create notification when new professor is added
CREATE OR REPLACE FUNCTION public.notify_new_professor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create notification for all users
    PERFORM public.create_broadcast_notification(
        '👨‍🏫 New Professor Added!',
        format('Check out %s from %s department', NEW.name, NEW.department),
        'new_professor',
        jsonb_build_object('professor_id', NEW.id, 'professor_name', NEW.name)
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for new professors
CREATE TRIGGER trigger_notify_new_professor
AFTER INSERT ON public.professors
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_professor();

-- Trigger function to create notification when new college is added
CREATE OR REPLACE FUNCTION public.notify_new_college()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create notification for all users
    PERFORM public.create_broadcast_notification(
        '🏛️ New College Added!',
        format('%s from %s, %s is now on RateMyProf!', NEW.name, NEW.city, NEW.state),
        'new_college',
        jsonb_build_object('college_id', NEW.id, 'college_name', NEW.name)
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for new colleges
CREATE TRIGGER trigger_notify_new_college
AFTER INSERT ON public.colleges
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_college();

-- Grant permissions
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_broadcast_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_notifications TO authenticated;

-- Comments
COMMENT ON TABLE public.notifications IS 'Stores user notifications with 4-day expiry';
COMMENT ON FUNCTION public.create_broadcast_notification IS 'Creates a notification for all users';
COMMENT ON FUNCTION public.cleanup_expired_notifications IS 'Removes notifications older than expires_at';
