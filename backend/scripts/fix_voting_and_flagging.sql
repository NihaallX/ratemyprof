-- ============================================================================
-- FIX VOTING AND FLAGGING RLS POLICIES - FINAL VERSION
-- ============================================================================
-- This script fixes RLS policies to allow voting and flagging operations
-- The issue: RLS policies are blocking INSERT even for authenticated users
-- The fix: Use proper RLS policies that check auth.uid() correctly
-- ============================================================================

-- ============================================================================
-- FIX 1: COLLEGE_REVIEW_VOTES TABLE
-- ============================================================================

-- Ensure table exists with correct foreign keys
CREATE TABLE IF NOT EXISTS college_review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(college_review_id, user_id)
);

-- Enable RLS
ALTER TABLE college_review_votes ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "college_review_votes_public_read" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_select_all" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_insert" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_insert_authenticated" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_insert_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_update_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_update_authenticated" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_update_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_delete_authenticated" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_delete_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_service_role_all" ON college_review_votes;

-- Create working policies
-- Allow public to SELECT (read votes)
CREATE POLICY "Enable read for all users"
ON college_review_votes FOR SELECT
USING (true);

-- Allow authenticated users to INSERT their own votes
CREATE POLICY "Enable insert for authenticated users"
ON college_review_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to UPDATE their own votes
CREATE POLICY "Enable update for vote owners"
ON college_review_votes FOR UPDATE
USING (auth.uid() = user_id);

-- Allow service_role full access (for admin operations)
CREATE POLICY "Enable all for service_role"
ON college_review_votes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FIX 2: COLLEGE_REVIEW_FLAGS TABLE
-- ============================================================================

-- Ensure table exists
CREATE TABLE IF NOT EXISTS college_review_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flag_type VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE college_review_flags ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "college_review_flags_authenticated_read" ON college_review_flags;
DROP POLICY IF EXISTS "college_review_flags_authenticated_insert" ON college_review_flags;
DROP POLICY IF EXISTS "college_review_flags_service_role_all" ON college_review_flags;
DROP POLICY IF EXISTS "Users can create flags" ON college_review_flags;
DROP POLICY IF EXISTS "Users can view own flags" ON college_review_flags;

-- Create working policies
-- Allow authenticated users to read flags
CREATE POLICY "Enable read for authenticated users"
ON college_review_flags FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to INSERT flags
CREATE POLICY "Enable insert for authenticated users"
ON college_review_flags FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Allow service_role full access (for admin moderation)
CREATE POLICY "Enable all for service_role"
ON college_review_flags FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FIX 3: ENSURE COLLEGE_REVIEWS CAN BE UPDATED FOR VOTE COUNTS
-- ============================================================================

ALTER TABLE college_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "college_reviews_public_read" ON college_reviews;
DROP POLICY IF EXISTS "college_reviews_authenticated_insert" ON college_reviews;
DROP POLICY IF EXISTS "college_reviews_service_role_all" ON college_reviews;

-- Allow public to read approved reviews
CREATE POLICY "Enable read for public"
ON college_reviews FOR SELECT
USING (status = 'approved' OR status IS NULL);

-- Allow authenticated users to INSERT reviews
CREATE POLICY "Enable insert for authenticated users"
ON college_reviews FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow service_role full access (for vote count updates and moderation)
CREATE POLICY "Enable all for service_role"
ON college_reviews FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('college_review_votes', 'college_review_flags', 'college_reviews')
ORDER BY tablename, policyname;

-- Test that tables exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('college_review_votes', 'college_review_flags')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ VOTING AND FLAGGING FIXED!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ college_review_votes table ready';
    RAISE NOTICE '✅ college_review_flags table ready';
    RAISE NOTICE '✅ RLS policies allow authenticated operations';
    RAISE NOTICE '✅ Service role can update vote counts';
    RAISE NOTICE '';
    RAISE NOTICE 'Users can now:';
    RAISE NOTICE '  - Vote on college reviews (helpful/not helpful)';
    RAISE NOTICE '  - Flag inappropriate reviews';
    RAISE NOTICE '  - Both operations work for authenticated users';
    RAISE NOTICE '============================================';
END $$;
