-- ===================================================================
-- TEMPORARY: Disable RLS completely to test
-- ===================================================================
-- This will prove if RLS is the problem
-- REMEMBER TO RE-ENABLE AFTER TESTING!
-- ===================================================================

-- Disable RLS on reviews table
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN NOT rowsecurity THEN '✅ RLS DISABLED - Try submitting review NOW!'
        ELSE '❌ Still enabled'
    END as status
FROM pg_tables
WHERE tablename = 'reviews';

-- ===================================================================
-- AFTER TESTING, RE-ENABLE WITH THIS:
-- ===================================================================
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
-- ===================================================================
