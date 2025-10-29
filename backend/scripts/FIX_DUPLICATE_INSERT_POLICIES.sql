-- ===================================================================
-- FIX: Remove duplicate/conflicting INSERT policies
-- ===================================================================
-- The issue: Multiple INSERT policies can conflict
-- We need ONLY ONE permissive INSERT policy
-- ===================================================================

-- Step 1: Check current INSERT policies
SELECT 
    pol.polname as policyname,
    pol.polcmd as cmd,
    pol.polpermissive as permissive,
    pol.polroles::regrole[] as roles,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'reviews' 
    AND pol.polcmd = 'w'  -- 'w' = INSERT
ORDER BY pol.polname;

-- Step 2: Drop ALL INSERT policies (clean slate)
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "reviews_authenticated_insert" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users create reviews" ON reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON reviews;
DROP POLICY IF EXISTS "Users create own reviews" ON reviews;

-- Step 3: Create ONE clean permissive INSERT policy
CREATE POLICY "reviews_insert_authenticated" ON reviews
    AS PERMISSIVE  -- Explicitly mark as permissive (OR logic)
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- Allow all authenticated users

-- Step 4: Verify only ONE INSERT policy exists
SELECT 
    '✅ SUCCESS' as status,
    pol.polname as policyname,
    'Permissive: ' || pol.polpermissive::text as type,
    'Roles: ' || pol.polroles::regrole[]::text as applies_to,
    'Check: ' || pg_get_expr(pol.polwithcheck, pol.polrelid) as logic
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'reviews' 
    AND pol.polcmd = 'w';
