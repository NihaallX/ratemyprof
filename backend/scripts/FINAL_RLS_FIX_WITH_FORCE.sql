-- ===================================================================
-- RE-ENABLE RLS and fix with FORCE ROW LEVEL SECURITY
-- ===================================================================
-- The issue might be that RLS policies don't apply to table owner (postgres)
-- We need to FORCE RLS to apply to all roles including owner
-- ===================================================================

-- Step 1: Re-enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Step 2: FORCE RLS (this is the key - makes RLS apply to ALL roles)
ALTER TABLE reviews FORCE ROW LEVEL SECURITY;

-- Step 3: Ensure anon policy exists and is correct
DROP POLICY IF EXISTS "reviews_insert_anon_with_jwt" ON reviews;

CREATE POLICY "reviews_insert_anon_with_jwt"
    ON reviews
    AS PERMISSIVE
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Step 4: Ensure authenticated policy exists
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON reviews;

CREATE POLICY "reviews_insert_authenticated"
    ON reviews
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Step 5: Public role for backwards compatibility
DROP POLICY IF EXISTS "reviews_insert_public" ON reviews;

CREATE POLICY "reviews_insert_public"
    ON reviews
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Step 6: Service role full access
DROP POLICY IF EXISTS "reviews_service_role_all" ON reviews;

CREATE POLICY "reviews_service_role_all"
    ON reviews
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 7: Verify setup
SELECT 
    '✅ RLS Configuration:' as info,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as rls_status
FROM pg_tables
WHERE tablename = 'reviews';

SELECT 
    '✅ INSERT Policies:' as info,
    policyname,
    roles::text,
    with_check
FROM pg_policies
WHERE tablename = 'reviews' AND cmd = 'INSERT'
ORDER BY policyname;
