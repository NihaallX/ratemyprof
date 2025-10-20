-- Create tables for automated content filtering and analysis logging

-- Content analysis logs for professor reviews
CREATE TABLE IF NOT EXISTS content_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    profanity_score FLOAT NOT NULL DEFAULT 0.0,
    spam_score FLOAT NOT NULL DEFAULT 0.0,
    quality_score FLOAT NOT NULL DEFAULT 0.0,
    sentiment_score FLOAT NOT NULL DEFAULT 0.0,
    auto_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reasons TEXT[] DEFAULT '{}',
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content analysis logs for college reviews
CREATE TABLE IF NOT EXISTS college_content_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
    profanity_score FLOAT NOT NULL DEFAULT 0.0,
    spam_score FLOAT NOT NULL DEFAULT 0.0,
    quality_score FLOAT NOT NULL DEFAULT 0.0,
    sentiment_score FLOAT NOT NULL DEFAULT 0.0,
    auto_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reasons TEXT[] DEFAULT '{}',
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add auto-generated flag indicator to existing flag tables
ALTER TABLE review_flags 
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE;

ALTER TABLE college_review_flags 
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE;

-- Add moderation status to reviews if not exists
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved';

ALTER TABLE college_reviews 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_analysis_logs_review_id ON content_analysis_logs(review_id);
CREATE INDEX IF NOT EXISTS idx_content_analysis_logs_auto_flagged ON content_analysis_logs(auto_flagged);
CREATE INDEX IF NOT EXISTS idx_content_analysis_logs_analyzed_at ON content_analysis_logs(analyzed_at);

CREATE INDEX IF NOT EXISTS idx_college_content_analysis_logs_review_id ON college_content_analysis_logs(college_review_id);
CREATE INDEX IF NOT EXISTS idx_college_content_analysis_logs_auto_flagged ON college_content_analysis_logs(auto_flagged);
CREATE INDEX IF NOT EXISTS idx_college_content_analysis_logs_analyzed_at ON college_content_analysis_logs(analyzed_at);

CREATE INDEX IF NOT EXISTS idx_review_flags_auto_generated ON review_flags(is_auto_generated);
CREATE INDEX IF NOT EXISTS idx_college_review_flags_auto_generated ON college_review_flags(is_auto_generated);

CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_college_reviews_moderation_status ON college_reviews(moderation_status);

-- Create function to update moderation status based on flags
CREATE OR REPLACE FUNCTION update_moderation_status_on_flag()
RETURNS TRIGGER AS $$
BEGIN
    -- Update review moderation status to pending when flagged
    IF TG_TABLE_NAME = 'review_flags' THEN
        UPDATE reviews 
        SET moderation_status = 'pending', 
            updated_at = NOW() 
        WHERE id = NEW.review_id;
    ELSIF TG_TABLE_NAME = 'college_review_flags' THEN
        UPDATE college_reviews 
        SET moderation_status = 'pending', 
            updated_at = NOW() 
        WHERE id = NEW.college_review_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update moderation status
DROP TRIGGER IF EXISTS trigger_update_review_moderation_status ON review_flags;
CREATE TRIGGER trigger_update_review_moderation_status
    AFTER INSERT ON review_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_moderation_status_on_flag();

DROP TRIGGER IF EXISTS trigger_update_college_review_moderation_status ON college_review_flags;
CREATE TRIGGER trigger_update_college_review_moderation_status
    AFTER INSERT ON college_review_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_moderation_status_on_flag();

-- Insert system user for auto-flagging if not exists
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system@ratemyprof.in',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for content analysis logs
ALTER TABLE content_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_content_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read all content analysis logs
CREATE POLICY "Admins can read all content analysis logs" ON content_analysis_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.email LIKE '%@ratemyprof.in'
                OR auth.users.raw_user_meta_data->>'is_admin' = 'true'
            )
        )
    );

CREATE POLICY "Admins can read all college content analysis logs" ON college_content_analysis_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.email LIKE '%@ratemyprof.in'
                OR auth.users.raw_user_meta_data->>'is_admin' = 'true'
            )
        )
    );

-- Policy for system to insert content analysis logs
CREATE POLICY "System can insert content analysis logs" ON content_analysis_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert college content analysis logs" ON college_content_analysis_logs
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE content_analysis_logs IS 'Logs of automated content analysis for professor reviews';
COMMENT ON TABLE college_content_analysis_logs IS 'Logs of automated content analysis for college reviews';
COMMENT ON COLUMN review_flags.is_auto_generated IS 'Indicates if the flag was generated automatically by the system';
COMMENT ON COLUMN college_review_flags.is_auto_generated IS 'Indicates if the flag was generated automatically by the system';
COMMENT ON COLUMN reviews.moderation_status IS 'Current moderation status: approved, pending, rejected';
COMMENT ON COLUMN college_reviews.moderation_status IS 'Current moderation status: approved, pending, rejected';