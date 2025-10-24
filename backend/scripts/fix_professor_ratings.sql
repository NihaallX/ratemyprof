-- ============================================================================
-- Recalculate All Professor Ratings (Approved Reviews Only)
-- ============================================================================
-- This script fixes professor ratings to use only approved reviews
-- and the correct calculation: AVG(overall_rating)
--
-- Run this in Supabase SQL Editor to fix all existing professor data
-- ============================================================================

-- Update all professors with correct ratings from approved reviews
UPDATE professors p
SET 
  average_rating = COALESCE(
    (
      SELECT ROUND(AVG(overall_rating)::numeric, 1)
      FROM reviews r
      WHERE r.professor_id = p.id
      AND r.status = 'approved'
    ),
    0.0
  ),
  total_reviews = COALESCE(
    (
      SELECT COUNT(*)::integer
      FROM reviews r
      WHERE r.professor_id = p.id
      AND r.status = 'approved'
    ),
    0
  );

-- Show results to verify
SELECT 
  full_name,
  average_rating,
  total_reviews
FROM professors
WHERE total_reviews > 0
ORDER BY average_rating DESC, total_reviews DESC
LIMIT 20;
