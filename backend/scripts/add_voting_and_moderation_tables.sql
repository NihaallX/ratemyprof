-- Add voting and moderation tables for RateMyProf platform
-- This script adds support for review voting, user moderation, and professor verification

-- Review votes table for helpful/not helpful voting
CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one vote per user per review
    UNIQUE(review_id, user_id)
);

-- Add voting counts to reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

-- User moderation logs table
CREATE TABLE IF NOT EXISTS user_moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('ban', 'unban', 'warn', 'delete_account')),
    reason TEXT NOT NULL,
    duration_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professor verification logs table
CREATE TABLE IF NOT EXISTS professor_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('verify', 'reject', 'request_more_info')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_logs_user_id ON user_moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_logs_moderator_id ON user_moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_professor_verification_logs_professor_id ON professor_verification_logs(professor_id);
CREATE INDEX IF NOT EXISTS idx_professor_verification_logs_moderator_id ON professor_verification_logs(moderator_id);

-- Update existing reviews to have voting counts
UPDATE reviews SET helpful_count = 0, not_helpful_count = 0 WHERE helpful_count IS NULL;

-- Add review flag status enum if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_status') THEN
        CREATE TYPE flag_status AS ENUM ('pending', 'reviewed', 'dismissed');
    END IF;
END $$;

-- Update review_flags table to use enum
ALTER TABLE review_flags 
ALTER COLUMN status SET DEFAULT 'pending',
ALTER COLUMN status TYPE flag_status USING status::flag_status;

-- Add moderation status to reviews if not exists
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

-- Update existing reviews to have approved status
UPDATE reviews SET moderation_status = 'approved' WHERE moderation_status IS NULL;

COMMENT ON TABLE review_votes IS 'Stores user votes on review helpfulness';
COMMENT ON TABLE user_moderation_logs IS 'Logs of moderation actions taken on users';
COMMENT ON TABLE professor_verification_logs IS 'Logs of professor profile verification actions';