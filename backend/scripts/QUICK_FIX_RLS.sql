-- ===================================================================
-- QUICK FIX: Just fix the INSERT policy (run this if in a hurry)
-- ===================================================================
-- This is the minimal fix to get reviews working NOW
-- Run the full fix_professor_reviews_rls.sql later for soft delete
-- ===================================================================

-- Drop restrictive INSERT policies
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users create reviews" ON reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON reviews;
DROP POLICY IF EXISTS "Users create own reviews" ON reviews;

-- Create permissive INSERT policy
CREATE POLICY "Authenticated users can insert reviews" ON reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Verify it worked
SELECT 
    policyname,
    cmd,
    roles,
    '✅ FIXED!' as status
FROM pg_policies
WHERE tablename = 'reviews' AND cmd = 'INSERT';
