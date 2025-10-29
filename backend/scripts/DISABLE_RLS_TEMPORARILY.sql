-- ===================================================================
-- NUCLEAR OPTION: Temporarily disable RLS to test
-- ===================================================================
-- This will help us determine if RLS is the problem
-- WARNING: This makes the table publicly writable temporarily!
-- ===================================================================

-- Step 1: Disable RLS on reviews table
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN NOT rowsecurity THEN '✅ RLS DISABLED - Try inserting now!'
        ELSE '❌ RLS still enabled'
    END as status
FROM pg_tables
WHERE tablename = 'reviews';

-- ===================================================================
-- After testing, RE-ENABLE RLS with this command:
-- ===================================================================
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
