-- Fix the notification triggers to use 'body' instead of 'message'
-- The notifications table has 'title' and 'body' columns, not 'message'

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_notify_new_professor ON public.professors;
DROP TRIGGER IF EXISTS trigger_notify_new_college ON public.colleges;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.notify_new_professor();
DROP FUNCTION IF EXISTS public.notify_new_college();
DROP FUNCTION IF EXISTS public.create_broadcast_notification(TEXT, TEXT, TEXT, JSONB);

-- Recreate the broadcast notification function with correct column name
CREATE OR REPLACE FUNCTION public.create_broadcast_notification(
    p_title TEXT,
    p_body TEXT,  -- Changed from p_message to p_body
    p_category TEXT DEFAULT 'engagement',
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
    INSERT INTO public.notifications (user_id, title, body, category, metadata)
    SELECT 
        id,
        p_title,
        p_body,
        p_category,
        p_metadata
    FROM auth.users
    WHERE id IS NOT NULL;
    
    GET DIAGNOSTICS notification_count = ROW_COUNT;
    
    RETURN notification_count;
END;
$$;

-- Recreate trigger function for new professors
CREATE OR REPLACE FUNCTION public.notify_new_professor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create notification for all users
    PERFORM public.create_broadcast_notification(
        'New Professor Added!',
        format('Check out %s from %s department', NEW.name, NEW.department),
        'engagement',
        jsonb_build_object('professor_id', NEW.id, 'professor_name', NEW.name)
    );
    
    RETURN NEW;
END;
$$;

-- Recreate trigger function for new colleges  
CREATE OR REPLACE FUNCTION public.notify_new_college()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create notification for all users
    PERFORM public.create_broadcast_notification(
        'New College Added!',
        format('%s from %s, %s is now on RateMyProf!', NEW.name, NEW.city, NEW.state),
        'engagement',
        jsonb_build_object('college_id', NEW.id, 'college_name', NEW.name)
    );
    
    RETURN NEW;
END;
$$;

-- Recreate the triggers
CREATE TRIGGER trigger_notify_new_professor
AFTER INSERT ON public.professors
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_professor();

CREATE TRIGGER trigger_notify_new_college
AFTER INSERT ON public.colleges
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_college();

-- Test by selecting from notifications to verify column names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('title', 'body', 'message');
