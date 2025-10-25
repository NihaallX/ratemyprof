-- Diagnostic script to check college_review_votes table and related issues
-- Run this in Supabase SQL Editor to diagnose voting problems

-- 1. Check if college_review_votes table exists
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE tablename = 'college_review_votes';

-- 2. Check the structure of college_review_votes table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'college_review_votes'
ORDER BY ordinal_position;

-- 3. Check foreign key constraints on college_review_votes
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='college_review_votes';

-- 4. Check RLS policies on college_review_votes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'college_review_votes';

-- 5. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'college_review_votes';

-- 6. Count existing votes
SELECT COUNT(*) as total_votes FROM college_review_votes;

-- 7. Check if there are any votes with invalid user_ids
-- (This will fail if user_id references wrong table)
SELECT 
    crv.id,
    crv.user_id,
    crv.college_review_id,
    crv.vote_type,
    CASE 
        WHEN au.id IS NOT NULL THEN 'Valid (auth.users)'
        WHEN pu.id IS NOT NULL THEN 'Valid (public.users)'
        ELSE 'INVALID'
    END as user_id_status
FROM college_review_votes crv
LEFT JOIN auth.users au ON au.id = crv.user_id
LEFT JOIN public.users pu ON pu.id = crv.user_id
LIMIT 10;

-- 8. Check if the test review exists
SELECT 
    id,
    college_id,
    helpful_count,
    not_helpful_count,
    created_at
FROM college_reviews
WHERE id = 'db165ed5-3587-41fc-a216-e680184039af';

-- 9. Check current user (if running in authenticated context)
SELECT auth.uid() as current_user_id;

-- 10. Test if we can insert a vote (will show the error if foreign key is wrong)
-- Uncomment the lines below to test (replace with actual IDs)
-- INSERT INTO college_review_votes (college_review_id, user_id, vote_type)
-- VALUES (
--     'db165ed5-3587-41fc-a216-e680184039af',  -- your review ID
--     auth.uid(),                               -- current user
--     'helpful'
-- );
