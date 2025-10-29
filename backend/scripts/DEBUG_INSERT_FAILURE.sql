-- Debug: Check what's blocking the INSERT
-- Run this to see the exact RLS policy logic

-- Check if reviews table still has user_id column
SELECT 
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_name = 'reviews' 
    AND column_name IN ('user_id', 'student_id', 'author_id')
ORDER BY column_name;

-- Check for NOT NULL constraints that might fail
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'reviews' 
    AND is_nullable = 'NO'
    AND column_default IS NULL
ORDER BY column_name;

-- Check the exact WITH CHECK expression for INSERT policies
SELECT 
    policyname,
    pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'reviews' 
    AND polcmd = 'w';  -- 'w' means INSERT
