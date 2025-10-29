-- ===================================================================
-- CLEAN RECREATION: Drop and recreate ALL policies from scratch
-- ===================================================================
-- Use simple syntax without explicit PERMISSIVE/RESTRICTIVE keywords
-- ===================================================================

-- Step 1: Drop ALL policies on reviews table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'reviews')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON reviews';
    END LOOP;
END $$;

-- Step 2: Verify all policies are gone
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All policies dropped'
        ELSE '❌ Still have ' || COUNT(*) || ' policies'
    END as status
FROM pg_policies 
WHERE tablename = 'reviews';

-- Step 3: Create simple INSERT policy for anon role
CREATE POLICY "anon_insert" 
    ON reviews 
    FOR INSERT 
    TO anon 
    WITH CHECK (true);

-- Step 4: Create simple INSERT policy for authenticated role  
CREATE POLICY "auth_insert" 
    ON reviews 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Step 5: Create simple INSERT policy for public role
CREATE POLICY "public_insert" 
    ON reviews 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Step 6: Service role ALL access
CREATE POLICY "service_all" 
    ON reviews 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Step 7: Public SELECT (approved reviews only)
CREATE POLICY "public_select" 
    ON reviews 
    FOR SELECT 
    TO public 
    USING (status = 'approved' AND deleted_at IS NULL);

-- Step 8: Verify new policies
SELECT 
    '✅ New policies created:' as info,
    policyname,
    cmd,
    roles::text
FROM pg_policies 
WHERE tablename = 'reviews'
ORDER BY cmd, policyname;
