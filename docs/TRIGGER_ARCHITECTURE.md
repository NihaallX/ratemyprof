# Event-Based Engagement & Retention Architecture

**Version:** 1.0  
**Date:** November 25, 2025  
**Status:** Design Document  

---

## 📋 Executive Summary

This document outlines the architecture for RateMyProf India's new engagement and retention system. The system is designed to increase student retention through:

1. **Event-based trigger system** - Real-time notification of relevant activities
2. **In-app nudges** - Contextual prompts to drive engagement
3. **Weekly digest** - Personalized summary of platform activity
4. **Threaded comments** - Deeper conversations on reviews (2-level max)
5. **Gamification** - Points, badges, and leaderboards
6. **Community features** - Lightweight social engagement

### Privacy-First Principles
- ✅ **Never expose user identity** for anonymous reviews
- ✅ **Maintain review_author_mappings** in separate RLS-protected table
- ✅ **No user_id in reviews table** - existing architecture preserved
- ✅ **DPDP Act 2023 compliant** - privacy by design

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Actions                             │
│  (Review, Vote, Comment, View, Follow, etc.)                │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                  Event Bus (EventEmitter)                   │
│  Emits: review.created, review.helpful_vote, etc.           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│              Background Worker (Celery/RQ)                  │
│  - Process events asynchronously                            │
│  - Apply throttling & deduplication                         │
│  - Render notification templates                            │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│              Notification Service                           │
│  - Store in notifications table                             │
│  - Send push notifications (FCM, Web Push)                  │
│  - Queue in-app notifications                               │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────┐
│                  User Devices                               │
│  - Mobile app (FCM)                                         │
│  - Web browser (Web Push API)                               │
│  - In-app notification center                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### 1. Events Table

Stores all platform events for auditing, analytics, and triggering notifications.

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- e.g., 'review.created', 'review.helpful_vote'
    resource_type VARCHAR(50) NOT NULL, -- e.g., 'review', 'professor', 'college'
    resource_id UUID NOT NULL,
    actor_id UUID REFERENCES users(id), -- user who triggered the event (nullable for system events)
    metadata JSONB DEFAULT '{}', -- flexible event data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_events_type_created ON events(event_type, created_at DESC);
CREATE INDEX idx_events_resource ON events(resource_type, resource_id);
CREATE INDEX idx_events_actor ON events(actor_id, created_at DESC);
CREATE INDEX idx_events_processed ON events(processed) WHERE NOT processed;
```

**Event Types:**
- `review.created` - New review submitted
- `review.updated` - Review edited
- `review.helpful_vote` - Someone found review helpful
- `review.not_helpful_vote` - Someone found review not helpful
- `review.comment_added` - Comment added to review
- `qna.answer_added` - Answer added to Q&A (future)
- `professor.rating_changed` - Professor rating updated
- `college.rank_change` - College ranking changed
- `user.view` - User viewed a resource
- `user.follow` - User followed professor/college (future)

### 2. Notification Templates

Stores reusable notification templates with placeholders.

```sql
CREATE TABLE notification_templates (
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

CREATE INDEX idx_templates_code ON notification_templates(code);
CREATE INDEX idx_templates_enabled ON notification_templates(enabled) WHERE enabled = TRUE;
```

**Template Variables:**
- `{{user_name}}` - Recipient's name
- `{{review_id}}` - Review ID
- `{{professor_name}}` - Professor name
- `{{college_name}}` - College name
- `{{vote_count}}` - Number of votes
- `{{comment_count}}` - Number of comments
- `{{points_earned}}` - Points earned
- `{{badge_name}}` - Badge name
- `{{rank}}` - Leaderboard rank

### 3. Notifications

Stores individual notifications sent to users.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_code VARCHAR(100) REFERENCES notification_templates(code),
    event_id UUID REFERENCES events(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    category VARCHAR(50) NOT NULL, -- 'engagement', 'moderation', 'achievement', 'digest'
    priority INTEGER DEFAULT 5,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMP WITH TIME ZONE,
    push_token TEXT, -- FCM/Web Push token used
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE NOT read;
CREATE INDEX idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_push_pending ON notifications(user_id) WHERE NOT push_sent;
CREATE INDEX idx_notifications_template_user ON notifications(template_code, user_id, created_at DESC);
```

**RLS Policy (Row Level Security):**
```sql
-- Users can only see their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);
```

### 4. Comments (Threaded)

Supports 2-level threaded comments on reviews.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(50) NOT NULL, -- 'review', 'college_review'
    resource_id UUID NOT NULL, -- review ID or college_review ID
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- NULL for top-level
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    depth INTEGER DEFAULT 0, -- 0 = top-level, 1 = reply, 2 = max (enforced at API)
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    flagged BOOLEAN DEFAULT FALSE,
    flag_count INTEGER DEFAULT 0,
    hidden BOOLEAN DEFAULT FALSE, -- moderator action
    deleted BOOLEAN DEFAULT FALSE, -- soft delete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_resource ON comments(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_author ON comments(author_id, created_at DESC);
CREATE INDEX idx_comments_flagged ON comments(flagged) WHERE flagged = TRUE;
```

**Constraints:**
- Max depth = 2 (enforced at API level)
- Thread locked if comment_count > 50 OR flag_count > 20
- Soft delete preserves conversation structure

**RLS Policy:**
```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-deleted comments"
ON comments FOR SELECT
USING (NOT deleted AND NOT hidden);

CREATE POLICY "Authenticated users can insert comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own comments"
ON comments FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments"
ON comments FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (deleted = TRUE);
```

### 5. User Points (Gamification)

Tracks user engagement points for gamification.

```sql
CREATE TABLE user_points (
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

CREATE INDEX idx_user_points_leaderboard ON user_points(points DESC, level DESC);
CREATE INDEX idx_user_points_user ON user_points(user_id);
```

**Point Rules:**
- Submit review: +10 points
- Review receives helpful vote: +2 points
- Add comment: +3 points
- Comment receives upvote: +1 point
- Daily login: +1 point
- 7-day streak: +20 bonus points

### 6. Badges

Achievement badges for user gamification.

```sql
CREATE TABLE badges (
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

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id, earned_at DESC);
CREATE INDEX idx_badges_category ON badges(category, rarity);
```

**Badge Examples:**
- **First Review** - Submit your first review
- **Helpful Hero** - Receive 50 helpful votes
- **Consistent Contributor** - 30-day login streak
- **Top Reviewer** - Top 10 on monthly leaderboard
- **Community Champion** - 100+ helpful comments

### 7. Weekly Digests

Stores pre-computed weekly digest data for users.

```sql
CREATE TABLE weekly_digests (
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

CREATE INDEX idx_digests_user_date ON weekly_digests(user_id, week_start_date DESC);
CREATE INDEX idx_digests_pending ON weekly_digests(user_id) WHERE sent_at IS NULL;
```

### 8. Push Subscriptions

Stores FCM and Web Push subscription tokens.

```sql
CREATE TABLE push_subscriptions (
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

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id, enabled);
CREATE INDEX idx_push_subs_token ON push_subscriptions(token) WHERE enabled = TRUE;
```

**RLS Policy:**
```sql
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
ON push_subscriptions FOR ALL
USING (auth.uid() = user_id);
```

### 9. Thread Locks

Manages thread locking for comments exceeding limits.

```sql
CREATE TABLE thread_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    locked BOOLEAN DEFAULT TRUE,
    reason VARCHAR(200), -- 'comment_limit', 'flag_limit', 'moderator_action'
    locked_by UUID REFERENCES users(id), -- moderator who locked it
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_type, resource_id)
);

CREATE INDEX idx_thread_locks_resource ON thread_locks(resource_type, resource_id);
```

---

## 🔄 Event Flow

### Example: User Receives Helpful Vote

```
1. User A votes "helpful" on User B's review
   ↓
2. API handler (`POST /v1/reviews/{id}/vote`)
   - Updates review.helpful_votes
   - Emits event: review.helpful_vote
   ↓
3. Event Bus captures event
   - Stores in events table
   - Enqueues notification job
   ↓
4. Background Worker processes event
   - Checks throttling rules (max 3/h)
   - Checks deduplication (30 min window)
   - Loads template: 'REVIEW_HELPFUL_VOTE'
   - Renders: "Your review received 5 helpful votes!"
   ↓
5. Notification Service
   - Stores notification in DB
   - Sends push notification (FCM/Web Push)
   - Updates user_points (+2 points)
   ↓
6. User B receives notification
   - Mobile app shows push notification
   - In-app notification center updates
   - Points badge animates +2
```

### Example: Weekly Digest Generation

```
1. Cron job runs every Monday 6:00 AM
   ↓
2. Digest Generator Service
   - Queries last week's activity per user
   - Computes: new_reviews, views, rank_change
   - Fetches: top_professors, trending_reviews
   ↓
3. For each active user:
   - Creates weekly_digests record
   - Enqueues notification job
   ↓
4. Background Worker
   - Loads template: 'WEEKLY_DIGEST'
   - Renders personalized digest
   - Sends push: "Your weekly RateMyProf summary 📊"
   ↓
5. User opens app
   - DigestCard component fetches digest
   - Shows highlights, charts, CTAs
```

---

## 🚦 Throttling & Deduplication

### Throttling Rules

**Per-User Limits:**
- Max 3 push notifications per hour (any type)
- Max 10 in-app notifications per hour
- Max 1 digest per week

**Per-Template Limits:**
- Configurable in `notification_templates.max_per_hour`
- Default: 3 per hour
- Overridable for critical notifications (moderation, security)

**Implementation:**
```python
def check_throttle(user_id: UUID, template_code: str) -> bool:
    """Check if user has exceeded notification limits."""
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    
    # Check global user limit (3/hour)
    user_count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.created_at >= one_hour_ago,
        Notification.push_sent == True
    ).count()
    
    if user_count >= 3:
        return False  # Throttled
    
    # Check template-specific limit
    template = get_template(template_code)
    template_count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.template_code == template_code,
        Notification.created_at >= one_hour_ago
    ).count()
    
    if template_count >= template.max_per_hour:
        return False  # Throttled
    
    return True  # OK to send
```

### Deduplication Rules

**Same Template + Resource:**
- Don't send same template for same resource within 30 minutes
- Example: Don't notify "Your review received 2 helpful votes" then "3 helpful votes" 10 minutes later
- Batch updates: "Your review received 5 helpful votes" after 30 min

**Implementation:**
```python
def check_duplicate(user_id: UUID, template_code: str, resource_id: UUID) -> bool:
    """Check if similar notification sent recently."""
    template = get_template(template_code)
    lookback = datetime.now(timezone.utc) - timedelta(minutes=template.throttle_minutes)
    
    duplicate = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.template_code == template_code,
        Notification.metadata['resource_id'].astext == str(resource_id),
        Notification.created_at >= lookback
    ).first()
    
    return duplicate is not None  # True = duplicate found
```

---

## 🔐 Privacy & Security

### Anonymous Review Protection

**Existing Architecture (Preserved):**
```sql
-- reviews table has NO user_id column
-- Authorship tracked separately in review_author_mappings (RLS protected)
CREATE TABLE review_author_mappings (
    review_id UUID PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only service role can query this table
-- Users access via API endpoints with JWT auth
```

**New Event System Respects Privacy:**
```python
# When emitting review.created event
def emit_review_created(review_id: UUID, author_id: UUID):
    """Emit review.created event without exposing author in review table."""
    event = Event(
        event_type='review.created',
        resource_type='review',
        resource_id=review_id,
        actor_id=author_id,  # stored in events table (RLS protected)
        metadata={'anonymous': True}
    )
    event_bus.emit(event)
```

**Notification Delivery:**
- Notifications sent to `author_id` (from mapping table)
- Review remains anonymous to public
- Only author sees "Your review received X votes"
- No user identity exposed in review table or public APIs

### RLS Policies Summary

**Protected Tables:**
1. `review_author_mappings` - Service role only
2. `college_review_author_mappings` - Service role only
3. `notifications` - Users see only their own
4. `push_subscriptions` - Users manage only their own
5. `user_points` - Users see only their own
6. `events` (optional) - Restrict actor_id visibility

**Public Tables:**
1. `reviews` - Public (NO user_id)
2. `college_reviews` - Public (NO user_id)
3. `comments` - Public (shows author_id for accountability)
4. `notification_templates` - Public read, admin write
5. `badges` - Public read

---

## 📊 Performance Considerations

### Caching Strategy

**Redis Cache:**
- Leaderboard top-50: 1 hour TTL
- User points: 5 minutes TTL
- Weekly digest: 1 week TTL (until next generation)
- Notification counts: 1 minute TTL

**Database Indexes:**
- All foreign keys indexed
- Composite indexes for common queries (user_id + created_at)
- Partial indexes for boolean filters (WHERE enabled = TRUE)

### Background Processing

**Queue Priorities:**
1. Critical (P1): Security alerts, moderation flags
2. High (P2): Engagement notifications, helpful votes
3. Medium (P3): Digest generation, leaderboard updates
4. Low (P4): Analytics, cleanup tasks

**Concurrency:**
- 4 worker processes
- 10 threads per worker
- Max 40 concurrent jobs

### Query Optimization

**Digest Generation (<500ms target):**
```sql
-- Use materialized views for common aggregations
CREATE MATERIALIZED VIEW user_weekly_stats AS
SELECT 
    user_id,
    DATE_TRUNC('week', created_at) AS week_start,
    COUNT(*) AS review_count,
    SUM(helpful_votes) AS total_helpful_votes
FROM reviews
JOIN review_author_mappings USING (review_id)
GROUP BY user_id, week_start;

-- Refresh hourly via cron
REFRESH MATERIALIZED VIEW CONCURRENTLY user_weekly_stats;
```

---

## 🧪 Testing Strategy

### Unit Tests
- Event emitter logic
- Template rendering
- Throttling/dedup algorithms
- Comment depth enforcement
- Points calculation

### Integration Tests
- End-to-end notification flow
- Push notification delivery
- Digest generation and retrieval
- Thread locking rules
- RLS policy enforcement

### Load Tests
- 1000 events/second ingestion
- 500 notifications/second processing
- 100 concurrent digest requests
- Leaderboard query <200ms at 10k users

### Coverage Target
- >80% code coverage for new modules
- 100% coverage for privacy-critical code (RLS, author mappings)

---

## 📈 Monitoring & Metrics

### Key Metrics

**Engagement:**
- Daily active users (DAU)
- Weekly active users (WAU)
- Notification open rate
- Digest open rate
- Comment thread participation
- Points earned per user

**Performance:**
- Event processing latency (P95 < 100ms)
- Notification delivery latency (P95 < 5s)
- Digest generation time (P95 < 500ms)
- Leaderboard query time (P95 < 200ms)

**Quality:**
- Notification throttle rate
- Deduplication rate
- Thread lock rate
- Moderation flag rate

**Dashboards:**
- Grafana: Real-time metrics
- Supabase Dashboard: Database stats
- Sentry: Error tracking
- Mixpanel: User engagement analytics

---

## 🚀 Rollout Plan

### Phase 1: Infrastructure (Week 1)
- ✅ Database migrations
- ✅ Event bus implementation
- ✅ Background worker setup
- ✅ Testing framework

### Phase 2: Core Features (Week 2-3)
- ✅ Notification system
- ✅ Push integration (FCM, Web Push)
- ✅ Threaded comments
- ✅ In-app nudges

### Phase 3: Gamification (Week 4)
- ✅ Points & badges
- ✅ Leaderboard
- ✅ Weekly digest

### Phase 4: Testing & Optimization (Week 5)
- ✅ A/B testing framework
- ✅ Performance optimization
- ✅ Load testing
- ✅ Bug fixes

### Phase 5: Gradual Rollout (Week 6+)
- 10% of users (beta group)
- Monitor metrics for 1 week
- 50% of users
- Monitor metrics for 1 week
- 100% rollout

**Feature Flags:**
- `enable_notifications` - Master switch
- `enable_push` - Push notifications
- `enable_comments` - Threaded comments
- `enable_gamification` - Points/badges/leaderboard
- `enable_digest` - Weekly digest

---

## 📝 Success Criteria

### Task 1 Completion Criteria
- ✅ SQL migration file created
- ✅ All 9 tables defined with proper indexes
- ✅ RLS policies documented
- ✅ Architecture document complete (this file)
- ✅ Privacy guarantees maintained
- ✅ Performance considerations addressed

### Migration File Location
`backend/alembic/versions/20251125_create_engagement_tables.sql`

### Next Steps
- Review and approve architecture
- Execute SQL migration on staging database
- Proceed to Task 2: Event Bus Implementation

---

**Document Status:** ✅ Complete  
**Next Task:** Task 2 - Event Bus & Backend Implementation  
**Estimated Time:** 2-3 days per task (9 tasks total)

