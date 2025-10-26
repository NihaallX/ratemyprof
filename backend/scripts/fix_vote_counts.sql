-- Fix all vote counts to match actual votes in college_review_votes table

-- 1. First, let's see the current mismatches
SELECT 
    r.id,
    r.helpful_count as stored_helpful,
    r.not_helpful_count as stored_not_helpful,
    COUNT(CASE WHEN v.vote_type = 'helpful' THEN 1 END) as actual_helpful,
    COUNT(CASE WHEN v.vote_type = 'not_helpful' THEN 1 END) as actual_not_helpful,
    COUNT(CASE WHEN v.vote_type = 'helpful' THEN 1 END) - COALESCE(r.helpful_count, 0) as helpful_diff,
    COUNT(CASE WHEN v.vote_type = 'not_helpful' THEN 1 END) - COALESCE(r.not_helpful_count, 0) as not_helpful_diff
FROM college_reviews r
LEFT JOIN college_review_votes v ON r.id = v.college_review_id
GROUP BY r.id, r.helpful_count, r.not_helpful_count
HAVING 
    COALESCE(r.helpful_count, 0) != COUNT(CASE WHEN v.vote_type = 'helpful' THEN 1 END)
    OR COALESCE(r.not_helpful_count, 0) != COUNT(CASE WHEN v.vote_type = 'not_helpful' THEN 1 END);

-- 2. Fix all vote counts by recalculating from actual votes
UPDATE college_reviews r
SET 
    helpful_count = COALESCE(vote_counts.helpful, 0),
    not_helpful_count = COALESCE(vote_counts.not_helpful, 0),
    updated_at = NOW()
FROM (
    SELECT 
        college_review_id,
        COUNT(CASE WHEN vote_type = 'helpful' THEN 1 END) as helpful,
        COUNT(CASE WHEN vote_type = 'not_helpful' THEN 1 END) as not_helpful
    FROM college_review_votes
    GROUP BY college_review_id
) as vote_counts
WHERE r.id = vote_counts.college_review_id;

-- 3. Set counts to 0 for reviews with no votes at all
UPDATE college_reviews
SET 
    helpful_count = 0,
    not_helpful_count = 0,
    updated_at = NOW()
WHERE id NOT IN (
    SELECT DISTINCT college_review_id 
    FROM college_review_votes
)
AND (helpful_count IS NULL OR helpful_count != 0 OR not_helpful_count IS NULL OR not_helpful_count != 0);

-- 4. Verify all counts are now correct
SELECT 
    COUNT(*) as total_mismatches
FROM (
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
        COALESCE(r.helpful_count, 0) != COUNT(CASE WHEN v.vote_type = 'helpful' THEN 1 END)
        OR COALESCE(r.not_helpful_count, 0) != COUNT(CASE WHEN v.vote_type = 'not_helpful' THEN 1 END)
) as mismatches;
