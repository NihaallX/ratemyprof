-- Remove duplicate/old RLS policies from college_reviews table
-- Keep only the new properly named policies

-- Drop the old generic named policies
DROP POLICY IF EXISTS "Enable all for service_role" ON college_reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON college_reviews;
DROP POLICY IF EXISTS "Enable read for public" ON college_reviews;

-- The following policies should remain (created by fix_college_reviews_rls.sql):
-- - college_reviews_public_read
-- - college_reviews_authenticated_insert
-- - college_reviews_authenticated_update
-- - college_reviews_authenticated_delete
-- - college_reviews_service_role_all

-- Verify only the correct policies exist
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'college_reviews'
ORDER BY policyname;
