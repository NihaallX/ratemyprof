-- ================================================================
-- ANONYMOUS REVIEW SYSTEM - DATABASE MIGRATION SCRIPT
-- ================================================================
-- This script implements true anonymity for all reviews by:
-- 1. Creating a private mapping table (review_author_mappings)
-- 2. Creating an audit log table (moderation_audit_logs)
-- 3. Migrating existing review data
-- 4. Cleaning the reviews table of user identifiers
-- 5. Setting up Row-Level Security (RLS) policies
-- ================================================================

-- ================================================================
-- STEP 1: BACKUP CURRENT DATA (Run this first in a transaction)
-- ================================================================

BEGIN;

-- Create backup tables
CREATE TABLE IF NOT EXISTS reviews_backup AS SELECT * FROM reviews;
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Verify backup
DO $$
DECLARE
    reviews_count INTEGER;
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO reviews_count FROM reviews;
    SELECT COUNT(*) INTO backup_count FROM reviews_backup;
    
    IF reviews_count != backup_count THEN
        RAISE EXCEPTION 'Backup failed: review counts do not match';
    END IF;
    
    RAISE NOTICE 'Backup successful: % reviews backed up', backup_count;
END $$;

COMMIT;

-- ================================================================
-- STEP 2: CREATE NEW TABLES
-- ================================================================

BEGIN;

-- Create review_author_mappings table (PRIVATE - Admin Only)
CREATE TABLE IF NOT EXISTS review_author_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL,
    author_id UUID NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one mapping per review
    CONSTRAINT unique_review_mapping UNIQUE (review_id),
    
    -- Foreign key constraints
    CONSTRAINT fk_review FOREIGN KEY (review_id) 
        REFERENCES reviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_author FOREIGN KEY (author_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for fast lookups
CREATE INDEX idx_review_author_mappings_review_id 
    ON review_author_mappings(review_id);
    
CREATE INDEX idx_review_author_mappings_author_id 
    ON review_author_mappings(author_id);

-- Create moderation_audit_logs table (PRIVATE - Admin Only)
CREATE TABLE IF NOT EXISTS moderation_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    review_id UUID,
    author_id UUID,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_admin FOREIGN KEY (admin_id) 
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_review FOREIGN KEY (review_id) 
        REFERENCES reviews(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_author FOREIGN KEY (author_id) 
        REFERENCES users(id) ON DELETE SET NULL,
        
    -- Validate action types
    CONSTRAINT valid_action_type CHECK (
        action_type IN (
            'view_author',
            'delete_review',
            'approve_review',
            'reject_review',
            'flag_review',
            'unflag_review',
            'ban_user',
            'unban_user'
        )
    )
);

-- Create indexes for audit logs
CREATE INDEX idx_moderation_audit_logs_admin_id 
    ON moderation_audit_logs(admin_id);
    
CREATE INDEX idx_moderation_audit_logs_created_at 
    ON moderation_audit_logs(created_at DESC);
    
CREATE INDEX idx_moderation_audit_logs_review_id 
    ON moderation_audit_logs(review_id);

COMMIT;

-- ================================================================
-- STEP 3: MIGRATE EXISTING DATA
-- ================================================================

BEGIN;

-- Populate review_author_mappings from existing reviews
-- Using student_id column from current schema
INSERT INTO review_author_mappings (review_id, author_id, created_at)
SELECT 
    id AS review_id,
    student_id AS author_id,  -- Changed to match your schema
    created_at
FROM reviews
WHERE student_id IS NOT NULL
ON CONFLICT (review_id) DO NOTHING;

-- Verify migration
DO $$
DECLARE
    reviews_with_users INTEGER;
    mappings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO reviews_with_users 
    FROM reviews WHERE student_id IS NOT NULL;
    
    SELECT COUNT(*) INTO mappings_count 
    FROM review_author_mappings;
    
    IF reviews_with_users != mappings_count THEN
        RAISE EXCEPTION 'Migration incomplete: % reviews but % mappings', 
            reviews_with_users, mappings_count;
    END IF;
    
    RAISE NOTICE 'Migration successful: % review-author mappings created', 
        mappings_count;
END $$;

COMMIT;

-- ================================================================
-- STEP 4: CLEAN REVIEWS TABLE
-- ================================================================

BEGIN;

-- Add verified_student column if it doesn't exist
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS verified_student BOOLEAN DEFAULT TRUE;

-- Remove user identifier columns (matching your current schema)
ALTER TABLE reviews 
DROP COLUMN IF EXISTS student_id CASCADE;

ALTER TABLE reviews 
DROP COLUMN IF EXISTS is_anonymous CASCADE;

-- Verify cleanup
DO $$
BEGIN
    -- Check that no user columns remain
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reviews' 
        AND column_name IN ('student_id', 'is_anonymous')
    ) THEN
        RAISE EXCEPTION 'Cleanup failed: user columns still exist in reviews table';
    END IF;
    
    RAISE NOTICE 'Reviews table cleanup successful';
END $$;

COMMIT;

-- ================================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
        AND (
            email LIKE '%@ratemyprof.in' 
            OR role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get review author (admin only)
CREATE OR REPLACE FUNCTION get_review_author(review_uuid UUID)
RETURNS TABLE (
    review_id UUID,
    author_id UUID,
    author_email TEXT,
    author_name TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT
) AS $$
BEGIN
    -- Check if user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Log the access
    INSERT INTO moderation_audit_logs (
        admin_id,
        action_type,
        review_id,
        author_id,
        created_at
    )
    SELECT 
        auth.uid(),
        'view_author',
        review_uuid,
        m.author_id,
        NOW()
    FROM review_author_mappings m
    WHERE m.review_id = review_uuid;
    
    -- Return author information
    RETURN QUERY
    SELECT 
        m.review_id,
        m.author_id,
        u.email AS author_email,
        u.full_name AS author_name,
        m.created_at AS submitted_at,
        m.ip_address
    FROM review_author_mappings m
    JOIN users u ON u.id = m.author_id
    WHERE m.review_id = review_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's own reviews
CREATE OR REPLACE FUNCTION get_my_reviews()
RETURNS TABLE (
    id UUID,
    professor_id UUID,
    course_taken TEXT,
    semester_taken TEXT,
    ratings JSONB,
    review_text TEXT,
    verified_student BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.professor_id,
        r.course_taken,
        r.semester_taken,
        r.ratings,
        r.review_text,
        r.verified_student,
        r.created_at,
        r.updated_at
    FROM reviews r
    JOIN review_author_mappings m ON m.review_id = r.id
    WHERE m.author_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user's own review
CREATE OR REPLACE FUNCTION delete_my_review(review_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_owner BOOLEAN;
BEGIN
    -- Check if user owns the review
    SELECT EXISTS (
        SELECT 1 
        FROM review_author_mappings 
        WHERE review_id = review_uuid 
        AND author_id = auth.uid()
    ) INTO is_owner;
    
    IF NOT is_owner THEN
        RAISE EXCEPTION 'Access denied: You can only delete your own reviews';
    END IF;
    
    -- Delete the review (mapping will be deleted via CASCADE)
    DELETE FROM reviews WHERE id = review_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 6: SET UP ROW-LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE review_author_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- RLS POLICIES FOR review_author_mappings (PRIVATE TABLE)
-- ================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can read mappings" ON review_author_mappings;
DROP POLICY IF EXISTS "Service role can insert mappings" ON review_author_mappings;
DROP POLICY IF EXISTS "No public access to mappings" ON review_author_mappings;

-- Policy: Admins can read all mappings
CREATE POLICY "Admins can read mappings"
ON review_author_mappings FOR SELECT
TO authenticated
USING (is_admin());

-- Policy: Service role can insert mappings (for review submission)
CREATE POLICY "Service role can insert mappings"
ON review_author_mappings FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: No public read access
CREATE POLICY "No public access to mappings"
ON review_author_mappings FOR SELECT
TO anon
USING (false);

-- ================================================================
-- RLS POLICIES FOR moderation_audit_logs (PRIVATE TABLE)
-- ================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can read audit logs" ON moderation_audit_logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON moderation_audit_logs;

-- Policy: Admins can read all audit logs
CREATE POLICY "Admins can read audit logs"
ON moderation_audit_logs FOR SELECT
TO authenticated
USING (is_admin());

-- Policy: Service role can insert audit logs
CREATE POLICY "Service role can insert logs"
ON moderation_audit_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- ================================================================
-- RLS POLICIES FOR reviews (PUBLIC TABLE - NO USER INFO)
-- ================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Service role can manage reviews" ON reviews;

-- Policy: Anyone can read reviews (no user info exposed)
CREATE POLICY "Anyone can read reviews"
ON reviews FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Service role can do anything (for admin operations)
CREATE POLICY "Service role can manage reviews"
ON reviews FOR ALL
TO service_role
USING (true);

-- ================================================================
-- STEP 7: GRANT PERMISSIONS
-- ================================================================

-- Grant read access to authenticated users for public functions
GRANT EXECUTE ON FUNCTION get_my_reviews() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_my_review(UUID) TO authenticated;

-- Grant execute access to admin functions only to admins
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_author(UUID) TO authenticated;

-- ================================================================
-- STEP 8: VERIFICATION QUERIES
-- ================================================================

-- Run these manually to verify the migration

-- 1. Check that reviews table has no user columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;

-- 2. Check that all reviews have mappings
SELECT 
    (SELECT COUNT(*) FROM reviews) AS total_reviews,
    (SELECT COUNT(*) FROM review_author_mappings) AS total_mappings,
    (SELECT COUNT(*) FROM reviews) - (SELECT COUNT(*) FROM review_author_mappings) AS missing_mappings;

-- 3. Test that public query doesn't expose user info
SELECT * FROM reviews LIMIT 1;

-- 4. Test admin function (must be admin)
-- SELECT * FROM get_review_author('some-review-uuid');

-- 5. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('reviews', 'review_author_mappings', 'moderation_audit_logs')
ORDER BY tablename, policyname;

-- ================================================================
-- ROLLBACK INSTRUCTIONS (In case of issues)
-- ================================================================

/*
-- To rollback, run these commands:

BEGIN;

-- Restore from backup
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS review_author_mappings CASCADE;
DROP TABLE IF EXISTS moderation_audit_logs CASCADE;

CREATE TABLE reviews AS SELECT * FROM reviews_backup;
CREATE TABLE users AS SELECT * FROM users_backup;

-- Recreate indexes and constraints as needed
-- (Add your original schema recreation here)

COMMIT;

-- Then drop backup tables
DROP TABLE reviews_backup;
DROP TABLE users_backup;
*/

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ANONYMOUS REVIEW SYSTEM MIGRATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run verification queries above';
    RAISE NOTICE '2. Test review submission';
    RAISE NOTICE '3. Test admin functions';
    RAISE NOTICE '4. Deploy backend and frontend changes';
    RAISE NOTICE '========================================';
END $$;
