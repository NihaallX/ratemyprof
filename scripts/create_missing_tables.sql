-- Create Users Table and Communication Tables for RateMyProf
-- This creates the basic user structure and communication system

-- First, create the users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(100),
    college_id UUID REFERENCES colleges(id),
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flags table for content moderation
CREATE TABLE IF NOT EXISTS flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'review', 'professor', 'college_review'
    content_id UUID NOT NULL,
    flagger_id UUID REFERENCES users(id),
    flag_reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    action_required BOOLEAN DEFAULT FALSE,
    appeal_allowed BOOLEAN DEFAULT FALSE,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appeals table
CREATE TABLE IF NOT EXISTS appeals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderation_action_id UUID, -- References to various moderation actions
    appeal_reason TEXT NOT NULL,
    additional_info TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    resolved_by UUID REFERENCES users(id),
    resolution_details TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User moderation history table for tracking moderation actions
CREATE TABLE IF NOT EXISTS user_moderation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES users(id),
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('warning', 'ban', 'unban')),
    reason TEXT NOT NULL,
    duration_days INTEGER, -- NULL for permanent bans, warnings
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content analysis log for tracking automated content filtering
CREATE TABLE IF NOT EXISTS content_analysis_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    analysis_type VARCHAR(50) NOT NULL, -- 'profanity', 'spam', 'quality', 'sentiment'
    score DECIMAL(5,4),
    details JSONB,
    flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample users if the table is empty
INSERT INTO users (email, first_name, last_name, display_name, is_admin, is_verified)
SELECT 'admin@gmail.com', 'Admin', 'User', 'Administrator', true, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gmail.com');

INSERT INTO users (email, first_name, last_name, display_name, is_verified)
SELECT 'student1@example.com', 'John', 'Doe', 'Student1', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student1@example.com');

INSERT INTO users (email, first_name, last_name, display_name, is_verified)
SELECT 'student2@example.com', 'Jane', 'Smith', 'Student2', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student2@example.com');

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);

CREATE INDEX IF NOT EXISTS idx_flags_content ON flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_flags_status ON flags(status);
CREATE INDEX IF NOT EXISTS idx_flags_created_at ON flags(created_at);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_appeals_user_id ON appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_created_at ON appeals(created_at);

CREATE INDEX IF NOT EXISTS idx_user_moderation_history_user_id ON user_moderation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_history_active ON user_moderation_history(is_active);
CREATE INDEX IF NOT EXISTS idx_user_moderation_history_expires ON user_moderation_history(expires_at);

CREATE INDEX IF NOT EXISTS idx_content_analysis_log_content ON content_analysis_log(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_analysis_log_flagged ON content_analysis_log(flagged);
CREATE INDEX IF NOT EXISTS idx_content_analysis_log_created_at ON content_analysis_log(created_at);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flags_updated_at 
    BEFORE UPDATE ON flags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notifications_updated_at 
    BEFORE UPDATE ON user_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appeals_updated_at 
    BEFORE UPDATE ON appeals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_moderation_history_updated_at 
    BEFORE UPDATE ON user_moderation_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_moderation_history ENABLE ROW LEVEL SECURITY;

-- Users can see their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can create flags
CREATE POLICY "Users can create flags" ON flags
    FOR INSERT WITH CHECK (auth.uid() = flagger_id);

-- Users can view flags they created
CREATE POLICY "Users can view own flags" ON flags
    FOR SELECT USING (auth.uid() = flagger_id);

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON user_notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only view their own appeals
CREATE POLICY "Users can view own appeals" ON appeals
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create appeals for themselves
CREATE POLICY "Users can create own appeals" ON appeals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own moderation history
CREATE POLICY "Users can view own moderation history" ON user_moderation_history
    FOR SELECT USING (auth.uid() = user_id);

-- Admin policies would be handled by service role or admin-specific policies