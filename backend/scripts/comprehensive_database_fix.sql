-- ============================================================================
-- COMPREHENSIVE DATABASE FIX FOR RATEMYPROF INDIA PLATFORM
-- ============================================================================
-- This script fixes all critical issues identified in the platform:
-- 1. Foreign keys pointing to public.users instead of auth.users
-- 2. RLS policies blocking legitimate operations
-- 3. Missing RLS policies for voting tables
-- 4. Admin moderation permissions
-- ============================================================================

-- ============================================================================
-- ISSUE #1: FIX FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- All user_id columns should reference auth.users(id), not public.users(id)

-- Fix review_votes table
ALTER TABLE review_votes 
DROP CONSTRAINT IF EXISTS review_votes_user_id_fkey;

ALTER TABLE review_votes
ADD CONSTRAINT review_votes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix college_review_votes table
ALTER TABLE college_review_votes 
DROP CONSTRAINT IF EXISTS college_review_votes_user_id_fkey;

ALTER TABLE college_review_votes
ADD CONSTRAINT college_review_votes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix user_moderation_logs table
ALTER TABLE user_moderation_logs 
DROP CONSTRAINT IF EXISTS user_moderation_logs_user_id_fkey,
DROP CONSTRAINT IF EXISTS user_moderation_logs_moderator_id_fkey;

ALTER TABLE user_moderation_logs
ADD CONSTRAINT user_moderation_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
ADD CONSTRAINT user_moderation_logs_moderator_id_fkey 
FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix professor_verification_logs table
ALTER TABLE professor_verification_logs 
DROP CONSTRAINT IF EXISTS professor_verification_logs_moderator_id_fkey;

ALTER TABLE professor_verification_logs
ADD CONSTRAINT professor_verification_logs_moderator_id_fkey 
FOREIGN KEY (moderator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix college_review_flags table (reviewed_by should reference auth.users)
ALTER TABLE college_review_flags 
DROP CONSTRAINT IF EXISTS college_review_flags_reviewed_by_fkey;

ALTER TABLE college_review_flags
ADD CONSTRAINT college_review_flags_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix college_review_author_mappings table
ALTER TABLE college_review_author_mappings 
DROP CONSTRAINT IF EXISTS college_review_author_mappings_author_id_fkey;

ALTER TABLE college_review_author_mappings
ADD CONSTRAINT college_review_author_mappings_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix review_author_mappings table
ALTER TABLE review_author_mappings 
DROP CONSTRAINT IF EXISTS review_author_mappings_author_id_fkey;

ALTER TABLE review_author_mappings
ADD CONSTRAINT review_author_mappings_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- ISSUE #2: FIX PROFESSORS TABLE RLS POLICIES
-- ============================================================================
-- Allow authenticated users to INSERT professors (for "Add Professor" form)
-- Keep UPDATE/DELETE restricted to service_role (admins)

ALTER TABLE professors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "professors_public_read" ON professors;
DROP POLICY IF EXISTS "professors_authenticated_insert" ON professors;
DROP POLICY IF EXISTS "professors_service_role_all" ON professors;
DROP POLICY IF EXISTS "professors_authenticated_read" ON professors;

-- Everyone can read professors
CREATE POLICY "professors_public_read"
ON professors FOR SELECT
TO PUBLIC
USING (true);

-- Authenticated users can insert professors
CREATE POLICY "professors_authenticated_insert"
ON professors FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role can do everything (for admin operations)
CREATE POLICY "professors_service_role_all"
ON professors FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ISSUE #3: FIX COLLEGE_REVIEW_VOTES RLS POLICIES
-- ============================================================================
-- Allow authenticated users to vote on college reviews

ALTER TABLE college_review_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "college_review_votes_public_read" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_insert" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_update_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_service_role_all" ON college_review_votes;

-- Public can read votes
CREATE POLICY "college_review_votes_public_read"
ON college_review_votes FOR SELECT
TO PUBLIC
USING (true);

-- Authenticated users can insert votes
CREATE POLICY "college_review_votes_authenticated_insert"
ON college_review_votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Authenticated users can update their own votes
CREATE POLICY "college_review_votes_authenticated_update_own"
ON college_review_votes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Service role has full access
CREATE POLICY "college_review_votes_service_role_all"
ON college_review_votes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ISSUE #4: FIX COLLEGE_REVIEW_FLAGS RLS POLICIES
-- ============================================================================
-- Ensure admins can update flags for moderation

ALTER TABLE college_review_flags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "college_review_flags_authenticated_read" ON college_review_flags;
DROP POLICY IF EXISTS "college_review_flags_authenticated_insert" ON college_review_flags;
DROP POLICY IF EXISTS "college_review_flags_service_role_all" ON college_review_flags;

-- Authenticated users can read all flags
CREATE POLICY "college_review_flags_authenticated_read"
ON college_review_flags FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert flags (report reviews)
CREATE POLICY "college_review_flags_authenticated_insert"
ON college_review_flags FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

-- Service role can do everything (admin moderation actions)
CREATE POLICY "college_review_flags_service_role_all"
ON college_review_flags FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ISSUE #5: FIX COLLEGE_REVIEWS RLS POLICIES
-- ============================================================================
-- Ensure service role can update reviews for moderation

ALTER TABLE college_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "college_reviews_public_read" ON college_reviews;
DROP POLICY IF EXISTS "college_reviews_authenticated_insert" ON college_reviews;
DROP POLICY IF EXISTS "college_reviews_service_role_all" ON college_reviews;

-- Public can read approved college reviews
CREATE POLICY "college_reviews_public_read"
ON college_reviews FOR SELECT
TO PUBLIC
USING (status = 'approved' OR status IS NULL);

-- Authenticated users can insert college reviews
CREATE POLICY "college_reviews_authenticated_insert"
ON college_reviews FOR INSERT
TO authenticated
WITH CHECK (true);

-- Service role has full access (for moderation)
CREATE POLICY "college_reviews_service_role_all"
ON college_reviews FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ISSUE #6: ENSURE is_flagged COLUMN EXISTS ON college_reviews
-- ============================================================================

-- Add is_flagged column if it doesn't exist
ALTER TABLE college_reviews 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('college_review_votes', 'review_votes', 'user_moderation_logs', 
                        'professor_verification_logs', 'college_review_flags',
                        'college_review_author_mappings', 'review_author_mappings')
  AND kcu.column_name LIKE '%user_id%' OR kcu.column_name IN ('moderator_id', 'author_id', 'reviewed_by')
ORDER BY tc.table_name, kcu.column_name;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'professors',
    'college_reviews',
    'college_review_votes',
    'college_review_flags'
)
ORDER BY tablename;

-- List active policies
SELECT 
    tablename,
    policyname,
    cmd as "Command",
    roles as "Roles"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'professors',
    'college_reviews',
    'college_review_votes',
    'college_review_flags'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Database fixes applied successfully!';
    RAISE NOTICE 'Fixed Issues:';
    RAISE NOTICE '  1. Foreign keys now reference auth.users(id)';
    RAISE NOTICE '  2. Professors table allows authenticated INSERT';
    RAISE NOTICE '  3. College review voting enabled for authenticated users';
    RAISE NOTICE '  4. Admin moderation actions enabled';
    RAISE NOTICE '  5. All RLS policies updated correctly';
END $$;
