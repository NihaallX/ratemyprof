-- ===================================================================
-- FINAL FIX FOR REVIEWS TABLE RLS POLICY
-- ===================================================================
-- This script fixes the Row-Level Security policies for the reviews table
-- to allow authenticated users to insert reviews via the anon key with JWT
-- ===================================================================

-- Step 1: Check current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'reviews';

-- Step 2: Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "reviews_insert_anon_with_jwt" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_public" ON reviews;
DROP POLICY IF EXISTS "reviews_authenticated_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;

-- Step 4: Drop all existing SELECT policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Public views approved non-deleted reviews" ON reviews;
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;

-- Step 5: Drop service role policy to recreate it
DROP POLICY IF EXISTS "reviews_service_role_all" ON reviews;
DROP POLICY IF EXISTS "Service role has full access" ON reviews;
DROP POLICY IF EXISTS "Service role can manage reviews" ON reviews;

-- Step 6: Create INSERT policy for authenticated users (via anon key with JWT)
-- This is the key policy that allows your app to insert reviews
CREATE POLICY "reviews_insert_authenticated"
    ON reviews
    AS PERMISSIVE
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        -- Allow insert if user is authenticated (has a valid JWT)
        auth.uid() IS NOT NULL
    );

-- Step 7: Create SELECT policy for reading reviews
CREATE POLICY "reviews_select_public"
    ON reviews
    AS PERMISSIVE
    FOR SELECT
    TO anon, authenticated, public
    USING (
        -- Everyone can read approved reviews that are not deleted
        (status = 'approved' AND deleted_at IS NULL)
        OR
        -- Service role can see everything (handled in separate policy)
        false
    );

-- Step 8: Create service role policy (full access for admin operations)
CREATE POLICY "reviews_service_role_all"
    ON reviews
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 9: Grant necessary permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON reviews TO anon, authenticated;
GRANT ALL ON reviews TO service_role;

-- Step 10: Verify the setup
SELECT 
    '✅ RLS Status:' as section,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'reviews';

SELECT 
    '✅ INSERT Policies:' as section,
    policyname,
    roles::text as applies_to,
    cmd as operation,
    qual as using_clause,
    with_check as check_clause
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'reviews' AND cmd = 'INSERT'
ORDER BY policyname;

SELECT 
    '✅ SELECT Policies:' as section,
    policyname,
    roles::text as applies_to,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'reviews' AND cmd = 'SELECT'
ORDER BY policyname;

SELECT 
    '✅ ALL Policies:' as section,
    policyname,
    roles::text as applies_to,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'reviews'
ORDER BY cmd, policyname;

-- Step 11: Test permissions
SELECT 
    '✅ Permissions Check:' as section,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'reviews'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;
