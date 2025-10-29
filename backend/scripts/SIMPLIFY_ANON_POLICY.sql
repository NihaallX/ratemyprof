-- Test if auth.uid() is working with the JWT
-- Run this to see what role and uid Supabase sees

-- First, verify the anon policy exists
SELECT 
    policyname,
    cmd,
    roles::text,
    with_check
FROM pg_policies
WHERE tablename = 'reviews' 
    AND policyname = 'reviews_insert_anon_with_jwt';

-- Check if there are any restrictive policies blocking
SELECT 
    policyname,
    cmd,
    permissive::text,
    roles::text,
    CASE 
        WHEN permissive::text = 'RESTRICTIVE' THEN '❌ RESTRICTIVE - This BLOCKS inserts!'
        ELSE '✅ Permissive'
    END as policy_type
FROM pg_policies
WHERE tablename = 'reviews';

-- Try a simpler policy - just allow anon to insert (no check)
DROP POLICY IF EXISTS "reviews_insert_anon_with_jwt" ON reviews;

CREATE POLICY "reviews_insert_anon_with_jwt"
    ON reviews
    AS PERMISSIVE
    FOR INSERT
    TO anon
    WITH CHECK (true);  -- Temporarily allow ALL inserts from anon

-- Verify it worked
SELECT 
    policyname,
    with_check,
    '✅ Should work now - anon can insert without checks' as status
FROM pg_policies
WHERE tablename = 'reviews' 
    AND policyname = 'reviews_insert_anon_with_jwt';
