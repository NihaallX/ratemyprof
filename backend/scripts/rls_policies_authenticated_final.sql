-- ============================================================================
-- COMPREHENSIVE RLS POLICIES FOR RATEMYPROF - AUTHENTICATED CLIENT APPROACH
-- ============================================================================
-- This script enables Row-Level Security on all tables and creates policies
-- that work with authenticated Supabase clients (NOT service_role bypass)
-- 
-- Security Model:
-- - Frontend sends JWT token with requests
-- - Backend validates token and passes to Supabase
-- - RLS policies check auth.uid() and auth.role()
-- - No admin client usage in user-facing endpoints
-- ============================================================================

-- ============================================================================
-- PROFESSORS TABLE
-- ============================================================================
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public read verified professors" ON professors;
DROP POLICY IF EXISTS "Authenticated read all professors" ON professors;
DROP POLICY IF EXISTS "Service role insert professors" ON professors;
DROP POLICY IF EXISTS "Service role update professors" ON professors;
DROP POLICY IF EXISTS "Service role delete professors" ON professors;
DROP POLICY IF EXISTS "Allow backend professor inserts" ON professors;
DROP POLICY IF EXISTS "Allow public read access on professors" ON professors;

-- Public can read verified professors
CREATE POLICY "professors_public_read"
ON professors FOR SELECT
USING (is_verified = true);

-- Authenticated users can insert professors (will be unverified)
CREATE POLICY "professors_authenticated_insert"
ON professors FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Service role can do everything (for admin operations)
CREATE POLICY "professors_service_role_all"
ON professors FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public read approved reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated read all reviews" ON reviews;
DROP POLICY IF EXISTS "Service role insert reviews" ON reviews;
DROP POLICY IF EXISTS "Service role update reviews" ON reviews;
DROP POLICY IF EXISTS "Service role delete reviews" ON reviews;
DROP POLICY IF EXISTS "Allow public read access on reviews" ON reviews;
DROP POLICY IF EXISTS "Allow authenticated insert on reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Service role can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Allow users to update own reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;

-- Public can read approved reviews
CREATE POLICY "reviews_public_read"
ON reviews FOR SELECT
USING (status = 'approved');

-- Authenticated users can insert reviews
CREATE POLICY "reviews_authenticated_insert"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update their own reviews (via mapping table)
CREATE POLICY "reviews_authenticated_update_own"
ON reviews FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT review_id FROM review_author_mappings
    WHERE author_id = auth.uid()
  )
);

-- Service role can do everything
CREATE POLICY "reviews_service_role_all"
ON reviews FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- REVIEW_AUTHOR_MAPPINGS TABLE (Anonymous Review Protection)
-- ============================================================================
ALTER TABLE review_author_mappings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Service role manage review author mappings" ON review_author_mappings;
DROP POLICY IF EXISTS "Users read own review mappings" ON review_author_mappings;
DROP POLICY IF EXISTS "Block public access to review mappings" ON review_author_mappings;
DROP POLICY IF EXISTS "Service role can insert mappings" ON review_author_mappings;
DROP POLICY IF EXISTS "Admins can read mappings" ON review_author_mappings;
DROP POLICY IF EXISTS "No public access to mappings" ON review_author_mappings;

-- Block all public access
CREATE POLICY "review_mappings_block_anon"
ON review_author_mappings FOR ALL
TO anon
USING (false);

-- Authenticated users can insert (for their own reviews)
CREATE POLICY "review_mappings_authenticated_insert"
ON review_author_mappings FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- Authenticated users can read their own mappings only
CREATE POLICY "review_mappings_authenticated_read_own"
ON review_author_mappings FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- Service role has full access (for admin/moderation)
CREATE POLICY "review_mappings_service_role_all"
ON review_author_mappings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- REVIEW_VOTES TABLE
-- ============================================================================
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public read review votes" ON review_votes;
DROP POLICY IF EXISTS "Service role manage review votes" ON review_votes;
DROP POLICY IF EXISTS "Allow authenticated insert on review_votes" ON review_votes;

-- Public can read votes
CREATE POLICY "review_votes_public_read"
ON review_votes FOR SELECT
USING (true);

-- Authenticated users can insert votes
CREATE POLICY "review_votes_authenticated_insert"
ON review_votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Authenticated users can update their own votes
CREATE POLICY "review_votes_authenticated_update_own"
ON review_votes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Service role has full access
CREATE POLICY "review_votes_service_role_all"
ON review_votes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- COLLEGE_REVIEWS TABLE
-- ============================================================================
ALTER TABLE college_reviews ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public read approved college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Authenticated read all college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Service role insert college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Service role update college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Service role delete college reviews" ON college_reviews;

-- Public can read approved college reviews
CREATE POLICY "college_reviews_public_read"
ON college_reviews FOR SELECT
USING (status = 'approved');

-- Authenticated users can insert college reviews
CREATE POLICY "college_reviews_authenticated_insert"
ON college_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Service role has full access
CREATE POLICY "college_reviews_service_role_all"
ON college_reviews FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- COLLEGE_REVIEW_AUTHOR_MAPPINGS TABLE
-- ============================================================================
ALTER TABLE college_review_author_mappings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Service role manage college review author mappings" ON college_review_author_mappings;
DROP POLICY IF EXISTS "Users read own college review mappings" ON college_review_author_mappings;
DROP POLICY IF EXISTS "Block public access to college review mappings" ON college_review_author_mappings;
DROP POLICY IF EXISTS "Service role can manage college review mappings" ON college_review_author_mappings;
DROP POLICY IF EXISTS "Users can view own college review mappings" ON college_review_author_mappings;

-- Block anon access
CREATE POLICY "college_review_mappings_block_anon"
ON college_review_author_mappings FOR ALL
TO anon
USING (false);

-- Authenticated users can insert their own mappings
CREATE POLICY "college_review_mappings_authenticated_insert"
ON college_review_author_mappings FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- Authenticated users can read their own mappings
CREATE POLICY "college_review_mappings_authenticated_read_own"
ON college_review_author_mappings FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- Service role has full access
CREATE POLICY "college_review_mappings_service_role_all"
ON college_review_author_mappings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- USER_ACTIVITIES TABLE
-- ============================================================================
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users read own activities" ON user_activities;
DROP POLICY IF EXISTS "Service role manage user activities" ON user_activities;
DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can update own activities" ON user_activities;

-- Users can only read their own activities
CREATE POLICY "user_activities_read_own"
ON user_activities FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own activities
CREATE POLICY "user_activities_insert_own"
ON user_activities FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own activities
CREATE POLICY "user_activities_update_own"
ON user_activities FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Service role has full access
CREATE POLICY "user_activities_service_role_all"
ON user_activities FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- COLLEGES TABLE (Public Read)
-- ============================================================================
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public read colleges" ON colleges;
DROP POLICY IF EXISTS "Service role manage colleges" ON colleges;
DROP POLICY IF EXISTS "Allow public read access on colleges" ON colleges;

-- Everyone can read colleges
CREATE POLICY "colleges_public_read"
ON colleges FOR SELECT
USING (true);

-- Service role can manage colleges
CREATE POLICY "colleges_service_role_all"
ON colleges FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- REVIEW_FLAGS TABLE
-- ============================================================================
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated read review flags" ON review_flags;
DROP POLICY IF EXISTS "Service role manage review flags" ON review_flags;
DROP POLICY IF EXISTS "Flags are viewable by moderators" ON review_flags;
DROP POLICY IF EXISTS "Users can flag reviews" ON review_flags;
DROP POLICY IF EXISTS "Allow authenticated insert on review_flags" ON review_flags;

-- Authenticated users can read all flags
CREATE POLICY "review_flags_authenticated_read"
ON review_flags FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert flags
CREATE POLICY "review_flags_authenticated_insert"
ON review_flags FOR INSERT
TO authenticated
WITH CHECK (flagger_id = auth.uid());

-- Service role has full access
CREATE POLICY "review_flags_service_role_all"
ON review_flags FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- COLLEGE_REVIEW_FLAGS TABLE
-- ============================================================================
ALTER TABLE college_review_flags ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated read college review flags" ON college_review_flags;
DROP POLICY IF EXISTS "Service role manage college review flags" ON college_review_flags;
DROP POLICY IF EXISTS "Users can create flags" ON college_review_flags;
DROP POLICY IF EXISTS "Users can view own flags" ON college_review_flags;

-- Authenticated users can read all flags
CREATE POLICY "college_review_flags_authenticated_read"
ON college_review_flags FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert flags
CREATE POLICY "college_review_flags_authenticated_insert"
ON college_review_flags FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

-- Service role has full access
CREATE POLICY "college_review_flags_service_role_all"
ON college_review_flags FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- MODERATION_LOG TABLE (Admin only)
-- ============================================================================
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated read moderation log" ON moderation_log;
DROP POLICY IF EXISTS "Service role manage moderation log" ON moderation_log;
DROP POLICY IF EXISTS "Moderation log viewable by moderators" ON moderation_log;

-- Only service role can access (admin operations)
CREATE POLICY "moderation_log_service_role_all"
ON moderation_log FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- MODERATION_AUDIT_LOGS TABLE (Admin only)
-- ============================================================================
ALTER TABLE moderation_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated read moderation audit logs" ON moderation_audit_logs;
DROP POLICY IF EXISTS "Service role manage moderation audit logs" ON moderation_audit_logs;
DROP POLICY IF EXISTS "Admins can read audit logs" ON moderation_audit_logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON moderation_audit_logs;

-- Only service role can access
CREATE POLICY "moderation_audit_logs_service_role_all"
ON moderation_audit_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'professors',
    'colleges', 
    'college_reviews',
    'college_review_author_mappings',
    'reviews',
    'review_author_mappings',
    'review_votes',
    'review_flags',
    'college_review_flags',
    'user_activities',
    'moderation_log',
    'moderation_audit_logs'
)
ORDER BY tablename;

-- List all active policies
SELECT 
    tablename,
    policyname,
    cmd as "Command",
    roles as "Roles",
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as "Using",
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as "With Check"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'professors',
    'colleges', 
    'college_reviews',
    'college_review_author_mappings',
    'reviews',
    'review_author_mappings',
    'review_votes',
    'review_flags',
    'college_review_flags',
    'user_activities',
    'moderation_log',
    'moderation_audit_logs'
)
ORDER BY tablename, policyname;
