-- Complete college review moderation system setup
-- This script ensures proper moderation flow with approval required

-- 1. Check current college_reviews table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'college_reviews'
    AND column_name IN ('status', 'moderated_at', 'moderated_by', 'moderation_reason', 'is_flagged')
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add status column if missing (default: pending)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'college_reviews' AND column_name = 'status') THEN
        ALTER TABLE college_reviews ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_college_reviews_status ON college_reviews(status);
        RAISE NOTICE 'Added status column';
    END IF;
    
    -- Add moderated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'college_reviews' AND column_name = 'moderated_at') THEN
        ALTER TABLE college_reviews ADD COLUMN moderated_at TIMESTAMPTZ;
        RAISE NOTICE 'Added moderated_at column';
    END IF;
    
    -- Add moderated_by column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'college_reviews' AND column_name = 'moderated_by') THEN
        ALTER TABLE college_reviews ADD COLUMN moderated_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added moderated_by column';
    END IF;
    
    -- Add moderation_reason column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'college_reviews' AND column_name = 'moderation_reason') THEN
        ALTER TABLE college_reviews ADD COLUMN moderation_reason TEXT;
        RAISE NOTICE 'Added moderation_reason column';
    END IF;
    
    -- Add is_flagged boolean if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'college_reviews' AND column_name = 'is_flagged') THEN
        ALTER TABLE college_reviews ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_flagged column';
    END IF;
    
    -- Add warning_count column for tracking warnings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'college_reviews' AND column_name = 'warning_count') THEN
        ALTER TABLE college_reviews ADD COLUMN warning_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added warning_count column';
    END IF;
    
    -- Add last_warned_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'college_reviews' AND column_name = 'last_warned_at') THEN
        ALTER TABLE college_reviews ADD COLUMN last_warned_at TIMESTAMPTZ;
        RAISE NOTICE 'Added last_warned_at column';
    END IF;
END $$;

-- 3. Set all existing approved reviews to 'approved' status if needed
UPDATE college_reviews
SET status = 'approved'
WHERE status IS NULL OR status = '';

-- 4. Update RLS policies to only show approved reviews to public
-- Drop existing SELECT policy for anonymous
DROP POLICY IF EXISTS "Enable read access for all users" ON college_reviews;
DROP POLICY IF EXISTS "Enable anonymous read for approved reviews" ON college_reviews;

-- Create new SELECT policy: Anonymous can only see approved reviews
CREATE POLICY "Public can view approved reviews" ON college_reviews
    FOR SELECT
    USING (status = 'approved');

-- Authenticated users can see approved reviews
CREATE POLICY "Authenticated can view approved reviews" ON college_reviews
    FOR SELECT
    TO authenticated
    USING (status = 'approved');

-- Service role can see everything
CREATE POLICY "Service role can view all reviews" ON college_reviews
    FOR SELECT
    TO service_role
    USING (true);

-- 5. Verify RLS policies
SELECT 
    policyname,
    roles,
    cmd,
    qual as using_condition
FROM pg_policies
WHERE tablename = 'college_reviews' AND cmd = 'SELECT'
ORDER BY policyname;

-- 6. Check current status distribution
SELECT 
    status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_flagged = true) as flagged_count,
    COUNT(*) FILTER (WHERE warning_count > 0) as warned_count
FROM college_reviews
GROUP BY status
ORDER BY status;
