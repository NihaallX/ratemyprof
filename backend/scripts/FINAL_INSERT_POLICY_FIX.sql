-- ===================================================================
-- FINAL FIX: Recreate INSERT policy with explicit syntax
-- ===================================================================
-- Sometimes policies need to be recreated with explicit command
-- ===================================================================

-- Step 1: Drop the current INSERT policy completely
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "reviews_authenticated_insert" ON reviews;

-- Step 2: Create policy with EXPLICIT command and ALL options
CREATE POLICY "reviews_insert_policy"
    ON reviews
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Step 3: Also ensure service_role has ALL access
DROP POLICY IF EXISTS "Service role has full access" ON reviews;
DROP POLICY IF EXISTS "reviews_service_role_all" ON reviews;

CREATE POLICY "reviews_service_role_all"
    ON reviews
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 4: Verify the policies
SELECT 
    policyname,
    cmd,
    permissive,
    roles::text,
    qual as using_expr,
    with_check
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY cmd, policyname;

-- Step 5: Test if authenticated role can insert
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'reviews' 
                AND cmd = 'INSERT'
                AND with_check = 'true'
                AND 'authenticated' = ANY(roles)
        )
        THEN '✅ INSERT policy configured correctly'
        ELSE '❌ INSERT policy STILL MISSING or WRONG!'
    END as final_status;
