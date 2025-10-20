-- Create college review flags table for moderation
-- This table allows users to flag inappropriate college reviews

CREATE TABLE IF NOT EXISTS college_review_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flag_type VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_college_review_flags_college_review_id ON college_review_flags(college_review_id);
CREATE INDEX IF NOT EXISTS idx_college_review_flags_reporter_id ON college_review_flags(reporter_id);
CREATE INDEX IF NOT EXISTS idx_college_review_flags_flag_type ON college_review_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_college_review_flags_status ON college_review_flags(status);
CREATE INDEX IF NOT EXISTS idx_college_review_flags_reviewed_by ON college_review_flags(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_college_review_flags_created_at ON college_review_flags(created_at);

-- Create unique constraint to prevent duplicate flags from same user for same review
CREATE UNIQUE INDEX IF NOT EXISTS idx_college_review_flags_unique 
ON college_review_flags(college_review_id, reporter_id);

-- Add is_flagged column to college_reviews table if it doesn't exist
ALTER TABLE college_reviews 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for flagged reviews
CREATE INDEX IF NOT EXISTS idx_college_reviews_is_flagged ON college_reviews(is_flagged);

-- Add RLS (Row Level Security) policies
ALTER TABLE college_review_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view flags they created
CREATE POLICY "Users can view own flags" ON college_review_flags
    FOR SELECT USING (auth.uid() = reporter_id);

-- Policy: Users can create flags for college reviews
CREATE POLICY "Users can create flags" ON college_review_flags
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Policy: Admins can view all flags
CREATE POLICY "Admins can view all flags" ON college_review_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.user_metadata->>'role' = 'admin'
        )
    );

-- Policy: Admins can update flag status
CREATE POLICY "Admins can update flags" ON college_review_flags
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.user_metadata->>'role' = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE college_review_flags IS 'Flags for inappropriate college reviews requiring moderation';
COMMENT ON COLUMN college_review_flags.flag_type IS 'Type of violation: spam, inappropriate, fake, offensive, harassment, irrelevant, duplicate, other';
COMMENT ON COLUMN college_review_flags.status IS 'Flag status: pending, reviewed, dismissed';
COMMENT ON COLUMN college_review_flags.reason IS 'Optional detailed reason for flagging';
COMMENT ON COLUMN college_review_flags.admin_notes IS 'Admin notes on flag review decision';
COMMENT ON COLUMN college_reviews.is_flagged IS 'Indicates if review has been flagged by moderators';