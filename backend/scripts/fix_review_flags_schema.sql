-- Fix review_flags table schema to use flagger_email instead of flagger_id
-- This ensures compatibility with the API code

-- First, drop any policies that depend on flagger_id
DROP POLICY IF EXISTS review_flags_authenticated_insert ON review_flags;
DROP POLICY IF EXISTS review_flags_select_policy ON review_flags;
DROP POLICY IF EXISTS review_flags_insert_policy ON review_flags;
DROP POLICY IF EXISTS review_flags_delete_policy ON review_flags;

-- Check if column exists and alter if needed
DO $$ 
BEGIN
    -- Check if flagger_id exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='review_flags' AND column_name='flagger_id'
    ) THEN
        -- Add flagger_email column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name='review_flags' AND column_name='flagger_email'
        ) THEN
            ALTER TABLE review_flags ADD COLUMN flagger_email TEXT;
        END IF;
        
        -- Drop the flagger_id column (CASCADE to drop dependent policies)
        ALTER TABLE review_flags DROP COLUMN IF EXISTS flagger_id CASCADE;
        
        -- Make flagger_email NOT NULL
        ALTER TABLE review_flags ALTER COLUMN flagger_email SET NOT NULL;
        
        RAISE NOTICE 'Converted review_flags from flagger_id to flagger_email';
    END IF;
    
    -- Ensure flagger_email exists (if table was created with flagger_email from the start)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='review_flags' AND column_name='flagger_email'
    ) THEN
        ALTER TABLE review_flags ADD COLUMN flagger_email TEXT NOT NULL;
        RAISE NOTICE 'Added flagger_email column';
    END IF;
END $$;

-- Recreate RLS policies for review_flags (using flagger_email instead of flagger_id)
-- Enable RLS if not already enabled
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert flags with their email
CREATE POLICY review_flags_authenticated_insert ON review_flags
    FOR INSERT
    TO authenticated
    WITH CHECK (flagger_email = auth.jwt()->>'email');

-- Policy: Users can view their own flags
CREATE POLICY review_flags_select_own ON review_flags
    FOR SELECT
    TO authenticated
    USING (flagger_email = auth.jwt()->>'email');

-- Policy: Admins can view all flags
CREATE POLICY review_flags_select_admin ON review_flags
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt()->>'email' IN ('admin@gmail.com') OR
        auth.jwt()->>'email' LIKE '%@ratemyprof.in'
    );

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'review_flags'
ORDER BY ordinal_position;
