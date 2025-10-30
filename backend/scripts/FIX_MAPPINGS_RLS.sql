-- ===================================================================
-- FIX RLS POLICIES FOR REVIEW_AUTHOR_MAPPINGS TABLE
-- ===================================================================
-- This script ensures that authenticated users can create mappings
-- and read their own mappings
-- ===================================================================

-- Step 1: Check if table exists and has RLS enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'review_author_mappings';

-- Step 2: Enable RLS
ALTER TABLE review_author_mappings ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users create own mappings" ON review_author_mappings;
DROP POLICY IF EXISTS "Users read own mappings" ON review_author_mappings;
DROP POLICY IF EXISTS "mappings_insert_authenticated" ON review_author_mappings;
DROP POLICY IF EXISTS "mappings_select_own" ON review_author_mappings;
DROP POLICY IF EXISTS "mappings_service_role_all" ON review_author_mappings;

-- Step 4: Create INSERT policy (users can create mappings for themselves)
CREATE POLICY "mappings_insert_authenticated"
    ON review_author_mappings
    AS PERMISSIVE
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        -- User can only create mappings for themselves
        auth.uid() = author_id
    );

-- Step 5: Create SELECT policy (users can read their own mappings)
CREATE POLICY "mappings_select_own"
    ON review_author_mappings
    AS PERMISSIVE
    FOR SELECT
    TO anon, authenticated
    USING (
        -- User can only see their own mappings
        auth.uid() = author_id
    );

-- Step 6: Create service role policy (full access for admin)
CREATE POLICY "mappings_service_role_all"
    ON review_author_mappings
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 7: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON review_author_mappings TO anon, authenticated;
GRANT ALL ON review_author_mappings TO service_role;

-- Step 8: Verify setup
SELECT 
    '✅ RLS Status:' as section,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'review_author_mappings';

SELECT 
    '✅ Policies:' as section,
    policyname,
    roles::text as applies_to,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING'
    END as using_present,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK'
    END as check_present
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'review_author_mappings'
ORDER BY cmd, policyname;

SELECT 
    '✅ Permissions:' as section,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'review_author_mappings'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;
