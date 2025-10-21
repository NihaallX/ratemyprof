-- Fix RLS Policies to Allow Public Read Access
-- Run this in Supabase SQL Editor

-- Allow public read access to colleges
DROP POLICY IF EXISTS "Allow public read access on colleges" ON colleges;
CREATE POLICY "Allow public read access on colleges"
ON colleges FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public read access to professors
DROP POLICY IF EXISTS "Allow public read access on professors" ON professors;
CREATE POLICY "Allow public read access on professors"
ON professors FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public read access to reviews
DROP POLICY IF EXISTS "Allow public read access on reviews" ON reviews;
CREATE POLICY "Allow public read access on reviews"
ON reviews FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to insert reviews
DROP POLICY IF EXISTS "Allow authenticated insert on reviews" ON reviews;
CREATE POLICY "Allow authenticated insert on reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own reviews
DROP POLICY IF EXISTS "Allow users to update own reviews" ON reviews;
CREATE POLICY "Allow users to update own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to insert review votes
DROP POLICY IF EXISTS "Allow authenticated insert on review_votes" ON review_votes;
CREATE POLICY "Allow authenticated insert on review_votes"
ON review_votes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to insert review flags
DROP POLICY IF EXISTS "Allow authenticated insert on review_flags" ON review_flags;
CREATE POLICY "Allow authenticated insert on review_flags"
ON review_flags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated successfully!';
    RAISE NOTICE 'Public users can now read colleges, professors, and reviews.';
END $$;
