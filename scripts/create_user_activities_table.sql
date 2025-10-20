-- Create user_activities table for rate limiting
-- This table tracks user actions to implement daily rate limits

CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_date DATE NOT NULL,
    action_count INTEGER NOT NULL DEFAULT 1,
    last_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    target_id VARCHAR(100), -- ID of created professor, review, etc.
    ip_address VARCHAR(45), -- IPv4/IPv6 address
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_action_type ON user_activities(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_action_date ON user_activities(action_date);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_action_date ON user_activities(user_id, action_type, action_date);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- Create unique constraint to prevent duplicate records for same user/action/date
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activities_unique 
ON user_activities(user_id, action_type, action_date);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own activity records
CREATE POLICY "Users can view own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own activity records
CREATE POLICY "Users can insert own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own activity records  
CREATE POLICY "Users can update own activities" ON user_activities
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins can view all activities (for moderation)
CREATE POLICY "Admins can view all activities" ON user_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.user_metadata->>'role' = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE user_activities IS 'Tracks user actions for rate limiting and abuse prevention';
COMMENT ON COLUMN user_activities.action_type IS 'Type of action: professor_create, review_create, etc.';
COMMENT ON COLUMN user_activities.action_date IS 'Date of action (for daily rate limiting)';
COMMENT ON COLUMN user_activities.action_count IS 'Number of actions performed on this date';
COMMENT ON COLUMN user_activities.target_id IS 'ID of target object (professor_id, review_id, etc.)';
COMMENT ON COLUMN user_activities.ip_address IS 'IP address for fraud detection';