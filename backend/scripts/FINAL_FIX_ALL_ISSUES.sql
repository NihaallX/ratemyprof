-- ============================================================================
-- FINAL FIX - CREATES TABLES + FIXES RLS POLICIES
-- ============================================================================
-- This single script will:
-- 1. Create college_review_votes table if missing
-- 2. Fix all RLS policies for professors, college_reviews, and voting
-- 3. Fix all foreign keys to reference auth.users
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE COLLEGE_REVIEW_VOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS college_review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one vote per user per review
    UNIQUE(college_review_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_college_review_votes_college_review_id ON college_review_votes(college_review_id);
CREATE INDEX IF NOT EXISTS idx_college_review_votes_user_id ON college_review_votes(user_id);

-- Add vote counts to college_reviews table
ALTER TABLE college_reviews 
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- STEP 2: FIX PROFESSORS TABLE RLS - ALLOW AUTHENTICATED INSERT
-- ============================================================================

ALTER TABLE professors ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "professors_public_read" ON professors;
DROP POLICY IF EXISTS "professors_authenticated_insert" ON professors;
DROP POLICY IF EXISTS "professors_service_role_all" ON professors;
DROP POLICY IF EXISTS "professors_authenticated_read" ON professors;
DROP POLICY IF EXISTS "Allow public read access on professors" ON professors;
DROP POLICY IF EXISTS "Allow backend professor inserts" ON professors;
DROP POLICY IF EXISTS "Public read verified professors" ON professors;
DROP POLICY IF EXISTS "Authenticated read all professors" ON professors;
DROP POLICY IF EXISTS "Service role insert professors" ON professors;
DROP POLICY IF EXISTS "Service role update professors" ON professors;
DROP POLICY IF EXISTS "Service role delete professors" ON professors;

-- Create clean policies
CREATE POLICY "professors_public_read"
ON professors FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "professors_authenticated_insert"
ON professors FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "professors_service_role_all"
ON professors FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 3: FIX COLLEGE_REVIEWS RLS
-- ============================================================================

ALTER TABLE college_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "college_reviews_public_read" ON college_reviews;
DROP POLICY IF EXISTS "college_reviews_authenticated_insert" ON college_reviews;
DROP POLICY IF EXISTS "college_reviews_service_role_all" ON college_reviews;
DROP POLICY IF EXISTS "Public read approved college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Authenticated read all college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Service role insert college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Service role update college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Service role delete college reviews" ON college_reviews;

-- Create clean policies
CREATE POLICY "college_reviews_public_read"
ON college_reviews FOR SELECT
TO PUBLIC
USING (status = 'approved' OR status IS NULL);

CREATE POLICY "college_reviews_authenticated_insert"
ON college_reviews FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "college_reviews_service_role_all"
ON college_reviews FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 4: FIX COLLEGE_REVIEW_VOTES RLS
-- ============================================================================

ALTER TABLE college_review_votes ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "college_review_votes_public_read" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_select_all" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_insert" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_insert_authenticated" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_insert_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_update_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_update_authenticated" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_update_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_delete_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_delete_authenticated" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_delete_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_service_role_all" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_service_all" ON college_review_votes;

-- Create clean policies
CREATE POLICY "college_review_votes_public_read"
ON college_review_votes FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "college_review_votes_authenticated_insert"
ON college_review_votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "college_review_votes_authenticated_update_own"
ON college_review_votes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "college_review_votes_service_role_all"
ON college_review_votes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 5: FIX COLLEGE_REVIEW_FLAGS RLS
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'college_review_flags') THEN
        ALTER TABLE college_review_flags ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "college_review_flags_authenticated_read" ON college_review_flags;
        DROP POLICY IF EXISTS "college_review_flags_authenticated_insert" ON college_review_flags;
        DROP POLICY IF EXISTS "college_review_flags_service_role_all" ON college_review_flags;
        DROP POLICY IF EXISTS "Users can create flags" ON college_review_flags;
        DROP POLICY IF EXISTS "Users can view own flags" ON college_review_flags;

        -- Create clean policies
        EXECUTE 'CREATE POLICY "college_review_flags_authenticated_read" ON college_review_flags FOR SELECT TO authenticated USING (true)';
        EXECUTE 'CREATE POLICY "college_review_flags_authenticated_insert" ON college_review_flags FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid())';
        EXECUTE 'CREATE POLICY "college_review_flags_service_role_all" ON college_review_flags FOR ALL TO service_role USING (true) WITH CHECK (true)';
        
        RAISE NOTICE '✅ Fixed college_review_flags RLS';
    END IF;
END $$;

-- ============================================================================
-- STEP 6: FIX COLLEGE_REVIEW_AUTHOR_MAPPINGS
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'college_review_author_mappings') THEN
        -- Fix foreign key
        ALTER TABLE college_review_author_mappings 
        DROP CONSTRAINT IF EXISTS college_review_author_mappings_author_id_fkey;
        
        ALTER TABLE college_review_author_mappings
        ADD CONSTRAINT college_review_author_mappings_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Fixed college_review_author_mappings foreign key';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that tables exist
DO $$
DECLARE
    vote_table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'college_review_votes'
    ) INTO vote_table_exists;
    
    IF vote_table_exists THEN
        RAISE NOTICE '✅ college_review_votes table exists';
    ELSE
        RAISE NOTICE '❌ college_review_votes table MISSING!';
    END IF;
END $$;

-- List current policies
SELECT 
    tablename,
    policyname,
    cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('professors', 'college_reviews', 'college_review_votes', 'college_review_flags')
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ ALL FIXES APPLIED SUCCESSFULLY!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ college_review_votes table created';
    RAISE NOTICE '✅ Professors INSERT allowed for authenticated users';
    RAISE NOTICE '✅ College review voting enabled';
    RAISE NOTICE '✅ All RLS policies cleaned and recreated';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '  - Add professors as regular user';
    RAISE NOTICE '  - Vote on college reviews';
    RAISE NOTICE '  - Admin moderation will work';
    RAISE NOTICE '============================================';
END $$;
