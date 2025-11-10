-- Fix RLS policies for college_reviews table
-- Problem: Authenticated users cannot insert because policies are checking for student_id
-- Solution: Allow authenticated users to insert without student_id check (reviews are anonymous)

-- Drop all existing policies on college_reviews
DROP POLICY IF EXISTS "college_reviews_public_read" ON college_reviews;
DROP POLICY IF EXISTS "college_reviews_authenticated_insert" ON college_reviews;
DROP POLICY IF EXISTS "college_reviews_service_role_all" ON college_reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON college_reviews;
DROP POLICY IF EXISTS "Authenticated can view approved reviews" ON college_reviews;
DROP POLICY IF EXISTS "Service role can view all reviews" ON college_reviews;
DROP POLICY IF EXISTS "Allow public to read approved college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Allow authenticated users to create college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Allow users to update their own college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Allow users to delete their own college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Users can read approved college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Authenticated users create college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Users update own college reviews" ON college_reviews;
DROP POLICY IF EXISTS "Users delete own college reviews" ON college_reviews;

-- Enable RLS
ALTER TABLE college_reviews ENABLE ROW LEVEL SECURITY;

-- 1. Public can read approved college reviews
CREATE POLICY "college_reviews_public_read"
ON college_reviews
FOR SELECT
TO PUBLIC
USING (status = 'approved');

-- 2. Authenticated users can insert college reviews (NO student_id check needed)
CREATE POLICY "college_reviews_authenticated_insert"
ON college_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);  -- Just verify they're authenticated

-- 3. Authenticated users can update their own reviews (using mapping table)
CREATE POLICY "college_reviews_authenticated_update"
ON college_reviews
FOR UPDATE
TO authenticated
USING (
  -- Check if this user owns the review via mapping table
  EXISTS (
    SELECT 1 FROM college_review_author_mappings
    WHERE college_review_author_mappings.review_id = college_reviews.id
    AND college_review_author_mappings.author_id = auth.uid()
  )
)
WITH CHECK (
  -- Same check for updates
  EXISTS (
    SELECT 1 FROM college_review_author_mappings
    WHERE college_review_author_mappings.review_id = college_reviews.id
    AND college_review_author_mappings.author_id = auth.uid()
  )
);

-- 4. Authenticated users can delete their own reviews (using mapping table)
CREATE POLICY "college_reviews_authenticated_delete"
ON college_reviews
FOR DELETE
TO authenticated
USING (
  -- Check if this user owns the review via mapping table
  EXISTS (
    SELECT 1 FROM college_review_author_mappings
    WHERE college_review_author_mappings.review_id = college_reviews.id
    AND college_review_author_mappings.author_id = auth.uid()
  )
);

-- 5. Service role has full access (for admin operations)
CREATE POLICY "college_reviews_service_role_all"
ON college_reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies were created
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
WHERE tablename = 'college_reviews'
ORDER BY policyname;
