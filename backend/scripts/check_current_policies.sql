-- Check current RLS policies on voting and flagging tables
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
WHERE schemaname = 'public'
  AND tablename IN ('college_review_votes', 'college_review_flags')
ORDER BY tablename, policyname;
