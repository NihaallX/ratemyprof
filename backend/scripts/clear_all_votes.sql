-- Clear all votes and reset counts to start fresh

-- 1. Delete all votes
DELETE FROM college_review_votes;

-- 2. Reset all vote counts to 0
UPDATE college_reviews
SET 
    helpful_count = 0,
    not_helpful_count = 0,
    updated_at = NOW();

-- 3. Verify everything is cleared
SELECT 
    (SELECT COUNT(*) FROM college_review_votes) as total_votes,
    (SELECT COUNT(*) FROM college_reviews WHERE helpful_count != 0 OR not_helpful_count != 0) as reviews_with_non_zero_counts;
