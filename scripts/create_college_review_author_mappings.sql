-- Create college_review_author_mappings table
-- This table links college reviews to authors for privacy-preserving review tracking
-- Similar to review_author_mappings but for college reviews

-- Drop table if exists (for clean reinstall)
-- DROP TABLE IF EXISTS college_review_author_mappings CASCADE;

CREATE TABLE IF NOT EXISTS college_review_author_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one author per review
    UNIQUE(review_id)
);

-- Create index for finding reviews by author (for "My Reviews" page)
CREATE INDEX IF NOT EXISTS idx_college_review_author_mappings_author_id 
ON college_review_author_mappings(author_id);

-- Create index for finding author by review (for ownership verification)
CREATE INDEX IF NOT EXISTS idx_college_review_author_mappings_review_id 
ON college_review_author_mappings(review_id);

-- Enable Row Level Security
ALTER TABLE college_review_author_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can do anything (for backend operations)
DROP POLICY IF EXISTS "Service role can manage college review mappings" ON college_review_author_mappings;
CREATE POLICY "Service role can manage college review mappings"
ON college_review_author_mappings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policy: Users can only see their own mappings (for "My Reviews" page)
DROP POLICY IF EXISTS "Users can view own college review mappings" ON college_review_author_mappings;
CREATE POLICY "Users can view own college review mappings"
ON college_review_author_mappings
FOR SELECT
TO authenticated
USING (auth.uid() = author_id);

-- Add comment to table
COMMENT ON TABLE college_review_author_mappings IS 'Maps college reviews to their authors privately. Reviews do not store author_id directly for anonymity.';
COMMENT ON COLUMN college_review_author_mappings.review_id IS 'Foreign key to college_reviews.id';
COMMENT ON COLUMN college_review_author_mappings.author_id IS 'Foreign key to auth.users.id - the review author';
COMMENT ON COLUMN college_review_author_mappings.ip_address IS 'IP address of the review author (optional, for spam prevention)';
COMMENT ON COLUMN college_review_author_mappings.user_agent IS 'User agent of the review author (optional, for spam prevention)';
