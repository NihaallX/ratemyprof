-- Fix college review votes RLS policies
-- This fixes the 500 error when voting on college reviews
-- Run this if you're still getting 500 errors after creating the table

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "college_review_votes_public_read" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_insert" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_update_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_authenticated_delete_own" ON college_review_votes;
DROP POLICY IF EXISTS "college_review_votes_service_role_all" ON college_review_votes;

-- Allow everyone to read votes (public access)
CREATE POLICY "college_review_votes_select_all"
ON college_review_votes FOR SELECT
USING (true);

-- Allow service role to do everything (this is what the backend uses)
CREATE POLICY "college_review_votes_service_all"
ON college_review_votes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to insert their own votes
CREATE POLICY "college_review_votes_insert_own"
ON college_review_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

-- Allow authenticated users to update their own votes
CREATE POLICY "college_review_votes_update_own"
ON college_review_votes FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Allow authenticated users to delete their own votes
CREATE POLICY "college_review_votes_delete_own"
ON college_review_votes FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id::text);

-- Ensure RLS is enabled
ALTER TABLE college_review_votes ENABLE ROW LEVEL SECURITY;

-- Verify the table exists and check structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'college_review_votes'
ORDER BY 
    ordinal_position;
