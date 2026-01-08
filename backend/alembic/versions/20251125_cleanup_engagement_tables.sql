-- Cleanup Script: Drop All Engagement Tables
-- Run this BEFORE executing 20251125_create_engagement_tables.sql if you had previous failed attempts

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS schema_migrations CASCADE;
DROP TABLE IF EXISTS leaderboard_cache CASCADE;
DROP TABLE IF EXISTS thread_locks CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS weekly_digests CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
DROP TABLE IF EXISTS comment_votes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Drop functions/triggers
DROP FUNCTION IF EXISTS refresh_leaderboard() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS validate_comment_resource() CASCADE;
DROP FUNCTION IF EXISTS check_thread_lock() CASCADE;
DROP FUNCTION IF EXISTS update_comment_counts() CASCADE;
DROP FUNCTION IF EXISTS set_comment_depth() CASCADE;

-- Verify cleanup
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: All engagement tables dropped'
        ELSE 'WARNING: ' || COUNT(*) || ' tables still exist: ' || STRING_AGG(table_name, ', ')
    END AS cleanup_status
FROM information_schema.tables 
WHERE table_name IN (
    'events', 'notification_templates', 'notifications', 'comments', 
    'comment_votes', 'user_points', 'badges', 'user_badges', 
    'weekly_digests', 'push_subscriptions', 'thread_locks', 'schema_migrations'
);
