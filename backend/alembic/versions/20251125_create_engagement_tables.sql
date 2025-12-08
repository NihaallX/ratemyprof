-- Migration: Create Engagement & Retention System Tables
-- Version: 20251125_001
-- Date: November 25, 2025
-- Description: Adds event-based notification system, threaded comments, gamification, and weekly digests

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. EVENTS TABLE
-- ============================================================================
-- Stores all platform events for triggering notifications and analytics

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- e.g., 'review.created', 'review.helpful_vote'
    resource_type VARCHAR(50) NOT NULL, -- e.g., 'review', 'professor', 'college'
    resource_id UUID NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- user who triggered the event
    metadata JSONB DEFAULT '{}', -- flexible event data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE
);

-- Indexes for fast event querying
CREATE INDEX idx_events_type_created ON events(event_type, created_at DESC);
CREATE INDEX idx_events_resource ON events(resource_type, resource_id);
CREATE INDEX idx_events_actor ON events(actor_id, created_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_events_processed ON events(processed) WHERE NOT processed;

-- RLS Policy: Events table is service-role only (contains actor_id for anonymous reviews)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for events"
ON events FOR ALL
USING (false); -- No direct user access, only via API

-- ============================================================================
-- 2. NOTIFICATION TEMPLATES TABLE
-- ============================================================================
-- Stores reusable notification templates with placeholders

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'REVIEW_HELPFUL_VOTE'
    name VARCHAR(200) NOT NULL,
    description TEXT,
    title_template TEXT NOT NULL, -- e.g., "Your review received {{vote_count}} helpful votes"
    body_template TEXT NOT NULL,
    action_url_template TEXT, -- e.g., "/reviews/{{review_id}}"
    category VARCHAR(50) NOT NULL, -- 'engagement', 'moderation', 'achievement', 'digest'
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
    enabled BOOLEAN DEFAULT TRUE,
    throttle_minutes INTEGER DEFAULT 30, -- min time between same template for same user
    max_per_hour INTEGER DEFAULT 3, -- max notifications of this type per hour per user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_code ON notification_templates(code);
CREATE INDEX idx_templates_enabled ON notification_templates(enabled) WHERE enabled = TRUE;

-- RLS Policy: Public read, admin write
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates"
ON notification_templates FOR SELECT
USING (TRUE);

CREATE POLICY "Service role can manage templates"
ON notification_templates FOR ALL
USING (false); -- Admin via API only

-- ============================================================================
-- 3. NOTIFICATIONS TABLE
-- ============================================================================
-- Stores individual notifications sent to users

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_code VARCHAR(100) REFERENCES notification_templates(code),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    category VARCHAR(50) NOT NULL, -- 'engagement', 'moderation', 'achievement', 'digest'
    priority INTEGER DEFAULT 5,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMP WITH TIME ZONE,
    push_token TEXT, -- FCM/Web Push token used
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast notification querying
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE NOT is_read;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_push_pending ON notifications(user_id) WHERE NOT is_push_sent;
CREATE INDEX idx_notifications_template_user ON notifications(template_code, user_id, created_at DESC);
CREATE INDEX idx_notifications_category ON notifications(category, created_at DESC);

-- RLS Policy: Users can only see their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can insert (via background worker)
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 4. COMMENTS TABLE (THREADED)
-- ============================================================================
-- Supports 2-level threaded comments on reviews and college reviews

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(50) NOT NULL, -- 'review' or 'college_review'
    resource_id UUID NOT NULL, -- review_id or college_review_id
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- NULL for top-level
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    depth INTEGER DEFAULT 0, -- 0 = top-level, 1 = reply, 2 = max (auto-calculated)
    reply_count INTEGER DEFAULT 0, -- number of replies to this comment
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    flagged BOOLEAN DEFAULT FALSE,
    flag_count INTEGER DEFAULT 0,
    hidden BOOLEAN DEFAULT FALSE, -- moderator action
    deleted BOOLEAN DEFAULT FALSE, -- soft delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: max depth is 2
    CONSTRAINT chk_comment_depth CHECK (depth >= 0 AND depth <= 2)
);

-- Indexes
CREATE INDEX idx_comments_resource ON comments(resource_type, resource_id, created_at DESC) WHERE NOT deleted;
CREATE INDEX idx_comments_parent ON comments(parent_id, created_at ASC) WHERE parent_id IS NOT NULL AND NOT deleted;
CREATE INDEX idx_comments_author ON comments(author_id, created_at DESC);
CREATE INDEX idx_comments_flagged ON comments(flagged, created_at DESC) WHERE flagged = TRUE;

-- RLS Policy: Public read for non-deleted/non-hidden comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted comments"
ON comments FOR SELECT
USING (NOT deleted AND NOT hidden);

CREATE POLICY "Authenticated users can insert comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = author_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update own comments"
ON comments FOR UPDATE
USING (auth.uid() = author_id);

-- ============================================================================
-- 5. COMMENT VOTES TABLE
-- ============================================================================
-- Tracks upvotes/downvotes on comments

CREATE TABLE IF NOT EXISTS comment_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL, -- 'upvote' or 'downvote'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(comment_id, user_id),
    CONSTRAINT chk_vote_type CHECK (vote_type IN ('upvote', 'downvote'))
);

CREATE INDEX idx_comment_votes_comment ON comment_votes(comment_id);
CREATE INDEX idx_comment_votes_user ON comment_votes(user_id);

-- RLS Policy
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comment votes"
ON comment_votes FOR SELECT
USING (TRUE);

CREATE POLICY "Users can insert own votes"
ON comment_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
ON comment_votes FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================================
-- 6. USER POINTS TABLE (GAMIFICATION)
-- ============================================================================
-- Tracks user engagement points and statistics

CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    total_reviews INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_helpful_votes INTEGER DEFAULT 0,
    total_votes_given INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0, -- consecutive days active
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_user_points_leaderboard ON user_points(points DESC, level DESC);
CREATE INDEX idx_user_points_user ON user_points(user_id);

-- RLS Policy: Users can view leaderboard but only update their own
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user points"
ON user_points FOR SELECT
USING (TRUE);

CREATE POLICY "Users cannot directly modify points"
ON user_points FOR UPDATE
USING (false); -- Only via API/service role

-- Service role can manage points
CREATE POLICY "Service role can manage points"
ON user_points FOR ALL
USING (false); -- Admin via API only

-- ============================================================================
-- 7. BADGES TABLE
-- ============================================================================
-- Achievement badges for gamification

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'FIRST_REVIEW', 'HELPFUL_HERO'
    name VARCHAR(200) NOT NULL,
    description TEXT,
    icon_url TEXT,
    category VARCHAR(50), -- 'contributor', 'influencer', 'moderator'
    points_required INTEGER DEFAULT 0,
    condition_type VARCHAR(50), -- 'review_count', 'helpful_votes', 'streak_days'
    condition_value INTEGER,
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_badges_category ON badges(category, rarity);
CREATE INDEX idx_badges_code ON badges(code);

-- RLS Policy: Public read
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
ON badges FOR SELECT
USING (TRUE);

-- ============================================================================
-- 8. USER BADGES TABLE
-- ============================================================================
-- Tracks which badges users have earned

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX idx_user_badges_user ON user_badges(user_id, earned_at DESC);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

-- RLS Policy
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user badges"
ON user_badges FOR SELECT
USING (TRUE);

CREATE POLICY "Service role manages badges"
ON user_badges FOR INSERT
WITH CHECK (true); -- Via API only

-- ============================================================================
-- 9. WEEKLY DIGESTS TABLE
-- ============================================================================
-- Stores pre-computed weekly digest data for users

CREATE TABLE IF NOT EXISTS weekly_digests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    new_reviews_count INTEGER DEFAULT 0,
    new_qna_posts_count INTEGER DEFAULT 0, -- future
    views_of_followed_count INTEGER DEFAULT 0, -- future
    top_professors JSONB DEFAULT '[]', -- array of professor objects
    top_colleges JSONB DEFAULT '[]',
    trending_reviews JSONB DEFAULT '[]',
    points_earned INTEGER DEFAULT 0,
    rank_change INTEGER DEFAULT 0, -- +5 means moved up 5 positions
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, week_start_date)
);

-- Indexes
CREATE INDEX idx_digests_user_date ON weekly_digests(user_id, week_start_date DESC);
CREATE INDEX idx_digests_pending ON weekly_digests(user_id, week_start_date DESC) WHERE sent_at IS NULL;

-- RLS Policy
ALTER TABLE weekly_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digests"
ON weekly_digests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update digest status"
ON weekly_digests FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (opened_at IS NOT NULL); -- Can only mark as opened

-- ============================================================================
-- 10. PUSH SUBSCRIPTIONS TABLE
-- ============================================================================
-- Stores FCM and Web Push subscription tokens

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL, -- 'fcm' (mobile) or 'webpush' (browser)
    token TEXT NOT NULL, -- FCM token or Web Push subscription JSON
    device_type VARCHAR(50), -- 'android', 'ios', 'chrome', 'firefox', 'safari'
    device_name TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, platform, token)
);

-- Indexes
CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id, enabled);
CREATE INDEX idx_push_subs_token ON push_subscriptions(token) WHERE enabled = TRUE;

-- RLS Policy
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
ON push_subscriptions FOR ALL
USING (auth.uid() = user_id);

-- ============================================================================
-- 11. THREAD LOCKS TABLE
-- ============================================================================
-- Manages thread locking for comments exceeding limits

CREATE TABLE IF NOT EXISTS thread_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(50) NOT NULL, -- 'review' or 'college_review'
    resource_id UUID NOT NULL,
    locked BOOLEAN DEFAULT TRUE,
    reason VARCHAR(200), -- 'comment_limit', 'flag_limit', 'moderator_action'
    locked_by UUID REFERENCES users(id) ON DELETE SET NULL, -- moderator who locked it
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(resource_type, resource_id)
);

-- Indexes
CREATE INDEX idx_thread_locks_resource ON thread_locks(resource_type, resource_id);
CREATE INDEX idx_thread_locks_locked ON thread_locks(locked) WHERE locked = TRUE;

-- RLS Policy
ALTER TABLE thread_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view thread locks"
ON thread_locks FOR SELECT
USING (TRUE);

-- ============================================================================
-- 12. SEED DATA: NOTIFICATION TEMPLATES
-- ============================================================================
-- Insert default notification templates

INSERT INTO notification_templates (code, name, description, title_template, body_template, action_url_template, category, priority, throttle_minutes, max_per_hour) VALUES
-- Engagement templates
('REVIEW_HELPFUL_VOTE', 'Review Helpful Vote', 'Notify when review receives helpful votes', 'Your review received {{vote_count}} helpful votes! 👍', 'Your review of {{professor_name}} is helping other students. Keep contributing!', '/professors/{{professor_id}}', 'engagement', 5, 60, 2),
('REVIEW_COMMENT', 'Review Comment', 'Notify when someone comments on review', 'New comment on your review 💬', '{{commenter_name}} commented: "{{comment_preview}}..."', '/reviews/{{review_id}}', 'engagement', 4, 30, 3),
('COMMENT_REPLY', 'Comment Reply', 'Notify when someone replies to comment', '{{replier_name}} replied to your comment 💬', '"{{reply_preview}}..."', '/reviews/{{review_id}}#comment-{{comment_id}}', 'engagement', 4, 30, 3),
('COMMENT_UPVOTE', 'Comment Upvote', 'Notify when comment receives upvotes', 'Your comment received {{upvote_count}} upvotes! 👍', 'Your insights are valued by the community.', '/reviews/{{review_id}}#comment-{{comment_id}}', 'engagement', 6, 120, 1),

-- Achievement templates
('FIRST_REVIEW', 'First Review Badge', 'Earned first review badge', 'You earned the "First Review" badge! 🎖️', 'Thanks for contributing to RateMyProf India. Your voice matters!', '/profile', 'achievement', 3, 0, 1),
('HELPFUL_HERO', 'Helpful Hero Badge', 'Earned helpful hero badge (50+ helpful votes)', 'You earned the "Helpful Hero" badge! 🏆', 'Your reviews have received 50+ helpful votes. You are a star contributor!', '/profile', 'achievement', 2, 0, 1),
('STREAK_7', '7-Day Streak', 'Logged in for 7 consecutive days', '7-day streak! 🔥', 'You have been active for 7 days straight. Keep it up!', '/profile', 'achievement', 5, 0, 1),
('LEVEL_UP', 'Level Up', 'User leveled up', 'You reached Level {{level}}! 🎉', 'You earned {{points_gained}} points. Keep contributing!', '/profile', 'achievement', 3, 0, 3),

-- Moderation templates
('REVIEW_FLAGGED', 'Review Flagged', 'Review flagged for moderation', 'Your review is under review 🔍', 'A moderator will review your submission. You will be notified of the outcome.', '/my-reviews', 'moderation', 2, 0, 1),
('REVIEW_APPROVED', 'Review Approved', 'Flagged review approved', 'Your review was approved! ✅', 'Thanks for your patience. Your review is now live.', '/reviews/{{review_id}}', 'moderation', 2, 0, 1),
('REVIEW_REJECTED', 'Review Rejected', 'Review rejected by moderator', 'Your review was not approved ❌', 'Reason: {{rejection_reason}}. Please review our guidelines.', '/guidelines', 'moderation', 1, 0, 1),

-- Digest template
('WEEKLY_DIGEST', 'Weekly Digest', 'Weekly platform summary', 'Your weekly RateMyProf summary 📊', '{{new_reviews_count}} new reviews, {{points_earned}} points earned, and more!', '/digest', 'digest', 5, 10080, 1);

-- ============================================================================
-- 13. SEED DATA: BADGES
-- ============================================================================
-- Insert default badges

INSERT INTO badges (code, name, description, category, points_required, condition_type, condition_value, rarity) VALUES
-- Contributor badges
('FIRST_REVIEW', 'First Review', 'Submit your first review', 'contributor', 0, 'review_count', 1, 'common'),
('PROLIFIC_REVIEWER', 'Prolific Reviewer', 'Submit 10 reviews', 'contributor', 100, 'review_count', 10, 'common'),
('SUPER_REVIEWER', 'Super Reviewer', 'Submit 50 reviews', 'contributor', 500, 'review_count', 50, 'rare'),
('REVIEW_LEGEND', 'Review Legend', 'Submit 100 reviews', 'contributor', 1000, 'review_count', 100, 'epic'),

-- Influencer badges
('HELPFUL_HERO', 'Helpful Hero', 'Receive 50 helpful votes', 'influencer', 100, 'helpful_votes', 50, 'rare'),
('COMMUNITY_CHAMPION', 'Community Champion', 'Receive 200 helpful votes', 'influencer', 400, 'helpful_votes', 200, 'epic'),
('TRENDING_VOICE', 'Trending Voice', 'Have a review in top trending', 'influencer', 50, 'trending_count', 1, 'rare'),

-- Engagement badges
('CONSISTENT_CONTRIBUTOR', 'Consistent Contributor', 'Maintain 7-day streak', 'contributor', 50, 'streak_days', 7, 'common'),
('DEDICATED_USER', 'Dedicated User', 'Maintain 30-day streak', 'contributor', 200, 'streak_days', 30, 'rare'),
('LOYAL_MEMBER', 'Loyal Member', 'Maintain 90-day streak', 'contributor', 500, 'streak_days', 90, 'epic'),

-- Community badges
('CONVERSATION_STARTER', 'Conversation Starter', 'Post 50 comments', 'contributor', 150, 'comment_count', 50, 'common'),
('DISCUSSION_LEADER', 'Discussion Leader', 'Post 200 comments', 'contributor', 400, 'comment_count', 200, 'rare'),

-- Leaderboard badges
('TOP_10', 'Top 10', 'Reach top 10 on leaderboard', 'influencer', 0, 'rank', 10, 'epic'),
('TOP_3', 'Top 3', 'Reach top 3 on leaderboard', 'influencer', 0, 'rank', 3, 'legendary'),
('RANK_1', '#1 Contributor', 'Reach #1 on leaderboard', 'influencer', 0, 'rank', 1, 'legendary');

-- ============================================================================
-- 14. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically calculate comment depth and validate parent
CREATE OR REPLACE FUNCTION set_comment_depth()
RETURNS TRIGGER AS $$
DECLARE
    parent_depth INTEGER;
BEGIN
    IF NEW.parent_id IS NULL THEN
        -- Top-level comment
        NEW.depth := 0;
    ELSE
        -- Reply: get parent depth and validate parent exists
        SELECT depth INTO parent_depth 
        FROM comments 
        WHERE id = NEW.parent_id AND NOT deleted;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Parent comment % not found or deleted', NEW.parent_id;
        END IF;
        
        -- Calculate depth
        NEW.depth := parent_depth + 1;
        
        -- Enforce max depth = 2
        IF NEW.depth > 2 THEN
            RAISE EXCEPTION 'Maximum comment depth (2) exceeded. Cannot reply to a reply.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_comment_depth
BEFORE INSERT OR UPDATE OF parent_id ON comments
FOR EACH ROW
EXECUTE FUNCTION set_comment_depth();

-- Function to automatically update reply counts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NOT NEW.deleted THEN
        -- Increment parent comment reply_count if this is a reply
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE comments 
            SET reply_count = reply_count + 1 
            WHERE id = NEW.parent_id;
        END IF;
    END IF;
    
    -- Handle soft deletes: decrement reply_count
    IF TG_OP = 'UPDATE' AND NEW.deleted = TRUE AND OLD.deleted = FALSE THEN
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE comments 
            SET reply_count = GREATEST(0, reply_count - 1)
            WHERE id = NEW.parent_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_counts
AFTER INSERT OR UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comment_counts();

-- Function to enforce thread locking
CREATE OR REPLACE FUNCTION check_thread_lock()
RETURNS TRIGGER AS $$
DECLARE
    lock_exists BOOLEAN;
    comment_count INTEGER;
BEGIN
    -- Check if thread is locked
    SELECT locked INTO lock_exists
    FROM thread_locks
    WHERE resource_type = NEW.resource_type
    AND resource_id = NEW.resource_id
    AND locked = TRUE;
    
    IF lock_exists THEN
        RAISE EXCEPTION 'This thread is locked and not accepting new comments';
    END IF;
    
    -- Check if adding this comment would exceed limit (50)
    SELECT COUNT(*) INTO comment_count
    FROM comments
    WHERE resource_type = NEW.resource_type
    AND resource_id = NEW.resource_id
    AND NOT deleted;
    
    -- Prevent insert that would make count > 50
    IF comment_count + 1 > 50 THEN
        -- Auto-lock the thread
        INSERT INTO thread_locks (resource_type, resource_id, reason)
        VALUES (NEW.resource_type, NEW.resource_id, 'comment_limit')
        ON CONFLICT (resource_type, resource_id) DO UPDATE
        SET locked = TRUE, reason = 'comment_limit';
        
        RAISE EXCEPTION 'Thread has reached maximum comment limit (50) and has been locked';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_thread_lock
BEFORE INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION check_thread_lock();

-- Function to validate polymorphic resource exists
CREATE OR REPLACE FUNCTION validate_comment_resource()
RETURNS TRIGGER AS $$
DECLARE
    resource_exists BOOLEAN;
BEGIN
    IF NEW.resource_type = 'review' THEN
        SELECT EXISTS(SELECT 1 FROM reviews WHERE id = NEW.resource_id) INTO resource_exists;
        IF NOT resource_exists THEN
            RAISE EXCEPTION 'Review % does not exist', NEW.resource_id;
        END IF;
    ELSIF NEW.resource_type = 'college_review' THEN
        SELECT EXISTS(SELECT 1 FROM college_reviews WHERE id = NEW.resource_id) INTO resource_exists;
        IF NOT resource_exists THEN
            RAISE EXCEPTION 'College review % does not exist', NEW.resource_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid resource_type: %. Must be review or college_review', NEW.resource_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_comment_resource
BEFORE INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION validate_comment_resource();

-- ============================================================================
-- 15. MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Leaderboard view (refreshed hourly)
-- Leaderboard view (refreshed hourly) - NO PII (email/name)
-- Frontend should fetch display names separately via API if needed
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_cache AS
SELECT 
    up.user_id,
    up.points,
    up.level,
    up.total_reviews,
    up.total_helpful_votes,
    ROW_NUMBER() OVER (ORDER BY up.points DESC, up.level DESC) AS rank
FROM user_points up
WHERE up.points > 0
ORDER BY up.points DESC, up.level DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_leaderboard_cache_user ON leaderboard_cache(user_id);
CREATE INDEX idx_leaderboard_cache_rank ON leaderboard_cache(rank);

-- Refresh leaderboard function (to be called by cron)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add migration record to track version
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('20251125_001_engagement_system')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- 16. AUTO-UPDATE TRIGGERS FOR updated_at
-- ============================================================================

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER trigger_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_points_updated_at
BEFORE UPDATE ON user_points
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_templates_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 17. SECURITY & PRIVACY NOTES
-- ============================================================================
-- IMPORTANT: This migration respects privacy-first architecture:
--   1. review_author_mappings remains RLS-protected (NO changes)
--   2. reviews table still has NO user_id column (anonymous)
--   3. events.actor_id is service-role only (bypasses RLS)
--   4. Leaderboard shows NO email/name (privacy compliant)
--   5. Service role key MUST be kept secret (bypasses all RLS)
--
-- DEPLOYMENT NOTES:
--   1. Run this migration in staging first
--   2. Test all triggers (comment depth, thread lock, resource validation)
--   3. Verify RLS policies with test user accounts
--   4. Schedule cron job: REFRESH MATERIALIZED VIEW leaderboard_cache (hourly)
--   5. Schedule cron job: Generate weekly_digests (Monday 6 AM)
--   6. Configure notification worker (Celery/RQ) to process events table
--   7. Set up FCM server key and Web Push VAPID keys
--
-- ROLLBACK: If needed, run the DROP statements in reverse order (see docs)

-- End of migration
