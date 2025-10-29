-- ===================================================================
-- FIX: RLS policy for ANON KEY with JWT authentication
-- ===================================================================
-- The issue: When using ANON KEY with JWT, the role is 'anon' not 'authenticated'
-- We need to add policy for BOTH authenticated AND anon roles
-- ===================================================================

-- Step 1: Drop existing INSERT policies
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;

-- Step 2: Create INSERT policy for ANON role (which gets JWT)
-- This is the key - ANON KEY clients use 'anon' role even with JWT!
CREATE POLICY "reviews_insert_anon_with_jwt"
    ON reviews
    AS PERMISSIVE
    FOR INSERT
    TO anon
    WITH CHECK (auth.uid() IS NOT NULL);  -- Must have valid JWT

-- Step 3: Also allow authenticated role (for direct auth)
CREATE POLICY "reviews_insert_authenticated"
    ON reviews
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Step 4: Service role full access
DROP POLICY IF EXISTS "Service role has full access" ON reviews;
DROP POLICY IF EXISTS "reviews_service_role_all" ON reviews;

CREATE POLICY "reviews_service_role_all"
    ON reviews
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 5: Verify policies
SELECT 
    policyname,
    cmd,
    roles::text,
    with_check,
    CASE 
        WHEN cmd = 'INSERT' AND 'anon' = ANY(roles) THEN '✅ ANON can INSERT (with JWT)'
        WHEN cmd = 'INSERT' AND 'authenticated' = ANY(roles) THEN '✅ AUTHENTICATED can INSERT'
        ELSE 'ℹ️ Other policy'
    END as status
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY cmd, policyname;
