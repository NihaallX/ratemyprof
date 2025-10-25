-- Add voting support for college reviews
-- This script adds a voting table and counts for college reviews

-- College review votes table for helpful/not helpful voting
CREATE TABLE IF NOT EXISTS college_review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one vote per user per college review
    UNIQUE(college_review_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_college_review_votes_college_review_id ON college_review_votes(college_review_id);
CREATE INDEX IF NOT EXISTS idx_college_review_votes_user_id ON college_review_votes(user_id);

-- Add RLS policies for college review votes
ALTER TABLE college_review_votes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read votes
CREATE POLICY "college_review_votes_public_read"
ON college_review_votes FOR SELECT
TO PUBLIC
USING (true);

-- Allow authenticated users to insert votes
CREATE POLICY "college_review_votes_authenticated_insert"
ON college_review_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own votes
CREATE POLICY "college_review_votes_authenticated_update_own"
ON college_review_votes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "college_review_votes_service_role_all"
ON college_review_votes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: The helpful_count and not_helpful_count columns already exist in college_reviews table
-- If they don't exist, run:
-- ALTER TABLE college_reviews 
-- ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;
