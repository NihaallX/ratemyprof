-- Diagnose flagging and voting issues

-- 1. Check college_review_flags table structure and data
SELECT 
    id,
    college_review_id,
    reporter_id,
    flag_type,
    status,
    created_at
FROM college_review_flags
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check for orphaned flags (flags without matching reviews)
SELECT 
    f.id as flag_id,
    f.college_review_id,
    f.reporter_id,
    f.status,
    r.id as review_exists
FROM college_review_flags f
LEFT JOIN college_reviews r ON f.college_review_id = r.id
WHERE r.id IS NULL;

-- 3. Check for duplicate flags from same user
SELECT 
    college_review_id,
    reporter_id,
    COUNT(*) as flag_count
FROM college_review_flags
GROUP BY college_review_id, reporter_id
HAVING COUNT(*) > 1;

-- 4. Check current vote counts vs actual votes
SELECT 
    r.id,
    r.helpful_count,
    r.not_helpful_count,
    COUNT(CASE WHEN v.vote_type = 'helpful' THEN 1 END) as actual_helpful,
    COUNT(CASE WHEN v.vote_type = 'not_helpful' THEN 1 END) as actual_not_helpful
FROM college_reviews r
LEFT JOIN college_review_votes v ON r.id = v.college_review_id
GROUP BY r.id, r.helpful_count, r.not_helpful_count
HAVING 
    r.helpful_count != COUNT(CASE WHEN v.vote_type = 'helpful' THEN 1 END)
    OR r.not_helpful_count != COUNT(CASE WHEN v.vote_type = 'not_helpful' THEN 1 END);

-- 5. Check RLS policies on flags table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'college_review_flags'
ORDER BY policyname;
