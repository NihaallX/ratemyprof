-- Add automatic notification triggers for welcome and professor approval

-- =====================================================
-- WELCOME NOTIFICATION TRIGGER
-- Sends welcome notification to new users on first login
-- =====================================================

-- Trigger function to send welcome notification to new users
CREATE OR REPLACE FUNCTION public.send_welcome_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expires_time TIMESTAMP;
BEGIN
    -- Set expiration to 4 days from now
    expires_time := NOW() + INTERVAL '4 days';
    
    -- Insert welcome notification for this specific user
    INSERT INTO public.notifications (user_id, title, message, type, is_read, created_at, expires_at, metadata)
    VALUES (
        NEW.id,
        '🎉 Welcome to RateMyProf!',
        'Hey there! Ready to spill the tea on professors? ☕ Rate your profs, help your juniors dodge bullets, and maybe roast a few along the way. Let''s make education transparent! 🎓✨',
        'system',
        false,
        NOW(),
        expires_time,
        jsonb_build_object('welcome', true, 'user_id', NEW.id)
    );
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_welcome_notification ON auth.users;

-- Create trigger on auth.users table for new signups
CREATE TRIGGER trigger_welcome_notification
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.send_welcome_notification();


-- =====================================================
-- PROFESSOR APPROVAL NOTIFICATION
-- Update existing trigger to use humorous message
-- =====================================================

-- Update the professor notification trigger with humorous message
CREATE OR REPLACE FUNCTION public.notify_new_professor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    college_name_var TEXT;
BEGIN
    -- Get college name if college_id exists
    IF NEW.college_id IS NOT NULL THEN
        SELECT name INTO college_name_var
        FROM public.colleges
        WHERE id = NEW.college_id;
    END IF;

    -- Only notify when professor is verified (approved by admin)
    -- This prevents notifications for unverified submissions
    IF NEW.is_verified = true THEN
        -- Create notification for all users
        PERFORM public.create_broadcast_notification(
            '🎓 Fresh Professor Alert!',
            CASE 
                WHEN college_name_var IS NOT NULL THEN
                    format('%s from %s just landed! Time to share your wisdom (or warnings 😏). Be the hero your juniors need! 🦸', NEW.name, college_name_var)
                ELSE
                    format('%s is now rateable! Got opinions? We''re all ears 👂 Drop your honest review and save someone from a boring semester! 💤➡️🔥', NEW.name)
            END,
            'new_professor',
            jsonb_build_object('professor_id', NEW.id, 'professor_name', NEW.name, 'college_id', NEW.college_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger (it will use the updated function)
DROP TRIGGER IF EXISTS trigger_notify_new_professor ON public.professors;

CREATE TRIGGER trigger_notify_new_professor
AFTER INSERT OR UPDATE OF is_verified ON public.professors
FOR EACH ROW
WHEN (NEW.is_verified = true AND (TG_OP = 'INSERT' OR OLD.is_verified = false))
EXECUTE FUNCTION public.notify_new_professor();


-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.send_welcome_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_professor TO authenticated;

-- Comments
COMMENT ON FUNCTION public.send_welcome_notification IS 'Sends welcome notification to new users on signup';
COMMENT ON FUNCTION public.notify_new_professor IS 'Notifies all users when a professor is approved by admin (humorous version)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Automatic notification triggers added successfully!';
    RAISE NOTICE '   - Welcome notifications: ON (triggers on new user signup)';
    RAISE NOTICE '   - Professor approval notifications: ON (triggers when admin approves)';
END $$;
