-- Fix college review votes RLS policies
-- This fixes the 500 error when voting on college reviews
-- These policies allow both authenticated users AND service role to manage votes

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "college_review_votes_public_read" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_select_all" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_insert" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_insert_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_update_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_update_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_delete_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_delete_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_service_role_all" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_service_all" ON college_review_votes;

-- Allow everyone to read votes (public access)
CREATE POLICY "college_review_votes_select_all"
ON college_review_votes FOR SELECT
USING (true);

-- Allow authenticated users to insert ANY vote (not just their own)
-- This allows the backend API to insert votes on behalf of users
CREATE POLICY "college_review_votes_insert_authenticated"
ON college_review_votes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update ANY vote
-- This allows the backend API to update votes on behalf of users
CREATE POLICY "college_review_votes_update_authenticated"
ON college_review_votes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete ANY vote
-- This allows the backend API to delete votes on behalf of users
CREATE POLICY "college_review_votes_delete_authenticated"
ON college_review_votes FOR DELETE
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE college_review_votes ENABLE ROW LEVEL SECURITY;

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'college_review_votes'
ORDER BY policyname;
