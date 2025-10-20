-- User Communication System Tables
-- Create tables for notifications and appeals

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

-- User warning/ban history table for tracking moderation actions
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

-- Indexes for better performance
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

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_moderation_history ENABLE ROW LEVEL SECURITY;

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

-- Admin policies (assuming admin role exists)
-- Admins can view all notifications, appeals, and moderation history
-- These would be handled by service role or admin-specific policies