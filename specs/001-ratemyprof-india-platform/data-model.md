# Data Model: RateMyProf India Platform

**Date**: September 10, 2025  
**Feature**: RateMyProf India Platform  
**Status**: Complete

## Core Entities

### User
**Purpose**: Represents students and administrators using the platform

**Fields**:
- `id`: UUID primary key
- `email`: String, unique, not null (authentication identifier)
- `password_hash`: String, not null (bcrypt hashed password)
- `name`: String, nullable (display name, optional for privacy)
- `college_id`: UUID, foreign key to College, nullable (user's institution)
- `is_verified`: Boolean, default false (email verification status)
- `is_moderator`: Boolean, default false (moderation privileges)
- `created_at`: Timestamp, not null
- `last_login`: Timestamp, nullable

**Relationships**:
- Has many Reviews (user_id foreign key)
- Belongs to College (optional)
- Has many ModerationLogs as moderator

**Validation Rules**:
- Email must be valid format
- Password minimum 8 characters
- Name max 100 characters if provided

### College  
**Purpose**: Represents educational institutions across India

**Fields**:
- `id`: UUID primary key
- `name`: String, not null (institution name)
- `city`: String, not null (location city)
- `state`: String, not null (Indian state)
- `college_type`: Enum ['university', 'college', 'institute'], not null
- `website_url`: String, nullable (official website)
- `established_year`: Integer, nullable
- `created_at`: Timestamp, not null

**Relationships**:
- Has many Professors
- Has many Users (as college_id)

**Validation Rules**:
- Name must be unique within city
- State must be valid Indian state code
- Established year between 1800-2025 if provided

### Professor
**Purpose**: Represents faculty members who can be reviewed

**Fields**:
- `id`: UUID primary key  
- `first_name`: String, not null
- `last_name`: String, not null
- `known_as`: String, nullable (nickname/preferred name)
- `college_id`: UUID, foreign key to College, not null
- `department`: String, not null (academic department)
- `profile_photo_url`: String, nullable (S3/CDN URL)
- `subjects_taught`: JSON array, nullable (list of courses/subjects)
- `created_at`: Timestamp, not null

**Relationships**:
- Belongs to College
- Has many Reviews

**Validation Rules**:
- Names max 50 characters each
- Department max 100 characters
- Must be unique combination of (first_name, last_name, college_id, department)

### Review
**Purpose**: Student ratings and feedback for professors

**Fields**:
- `id`: UUID primary key
- `professor_id`: UUID, foreign key to Professor, not null
- `user_id`: UUID, foreign key to User, nullable (null for anonymous reviews)
- `anon_display_name`: String, nullable (e.g., "Anonymous Student", "CS Senior")
- `rating_clarity`: Integer 1-5, not null (how well professor explains)
- `rating_helpfulness`: Integer 1-5, not null (availability and support)
- `rating_workload`: Integer 1-5, not null (assignment difficulty)
- `rating_engagement`: Integer 1-5, not null (teaching style interaction)
- `review_text`: Text, nullable (written feedback, max 2000 chars)
- `semester_taken`: String, nullable (e.g., "Fall 2024", "Spring 2025")
- `course_taken`: String, nullable (specific course/subject)
- `is_flagged`: Boolean, default false (community flagged)
- `is_removed`: Boolean, default false (moderator removed)
- `flags_count`: Integer, default 0 (number of user flags)
- `created_at`: Timestamp, not null
- `updated_at`: Timestamp, not null

**Relationships**:
- Belongs to Professor
- Belongs to User (optional, for anonymous reviews)
- Has many ReviewFlags

**Validation Rules**:
- All ratings must be 1-5 range
- Review text max 2000 characters
- User can only have one review per professor (enforced by unique constraint)
- Anonymous display name max 50 characters

### ReviewFlag
**Purpose**: Community flagging system for inappropriate content

**Fields**:
- `id`: UUID primary key
- `review_id`: UUID, foreign key to Review, not null
- `flagger_user_id`: UUID, foreign key to User, not null
- `reason`: Enum ['inappropriate', 'spam', 'offensive', 'irrelevant', 'personal_attack'], not null
- `description`: Text, nullable (additional context)
- `created_at`: Timestamp, not null

**Relationships**:
- Belongs to Review
- Belongs to User (as flagger)

**Validation Rules**:
- User can only flag same review once (unique constraint)
- Description max 500 characters if provided

### ModerationLog
**Purpose**: Audit trail for all moderation actions

**Fields**:
- `id`: UUID primary key
- `review_id`: UUID, foreign key to Review, not null
- `moderator_id`: UUID, foreign key to User, not null  
- `action`: Enum ['approved', 'removed', 'warned', 'appealed', 'reinstated'], not null
- `reason`: String, not null (justification for action)
- `notes`: Text, nullable (additional moderator notes)
- `created_at`: Timestamp, not null

**Relationships**:
- Belongs to Review
- Belongs to User (as moderator)

**Validation Rules**:
- Reason max 200 characters
- Notes max 1000 characters if provided
- Moderator must have is_moderator=true

## Derived/Computed Data

### Professor Aggregate Ratings
**Computed from Review table**:
- `avg_clarity`: Average of all rating_clarity for active reviews
- `avg_helpfulness`: Average of all rating_helpfulness for active reviews  
- `avg_workload`: Average of all rating_workload for active reviews
- `avg_engagement`: Average of all rating_engagement for active reviews
- `total_reviews`: Count of active (not removed) reviews
- `overall_rating`: Weighted average of all four categories

**Update Triggers**: Recalculate when reviews are added, removed, or updated

### Search Index Data
**Full-text search fields**:
- Professor search: `first_name || ' ' || last_name || ' ' || known_as || ' ' || college.name || ' ' || department`
- College search: `name || ' ' || city || ' ' || state`
- Review search: `review_text` (for future semantic search)

## State Transitions

### Review Lifecycle
1. **Draft** → **Published** (user submits review)
2. **Published** → **Flagged** (community flags content)
3. **Flagged** → **Under Review** (moderator begins review)
4. **Under Review** → **Approved** (moderator approves)
5. **Under Review** → **Removed** (moderator removes)
6. **Removed** → **Appealed** (user appeals decision)
7. **Appealed** → **Reinstated** (moderator approves appeal)

### User Verification States
1. **Unverified** → **Verified** (email verification complete)
2. **Verified** → **Moderator** (admin grants moderation privileges)

## Indexing Strategy

### Performance Indexes
- `colleges (state, city)` - Geographic filtering
- `professors (college_id, department)` - College browsing  
- `reviews (professor_id, is_removed)` - Professor profile loading
- `reviews (user_id, professor_id)` - Duplicate review prevention
- `review_flags (review_id)` - Moderation dashboard

### Search Indexes  
- `professors` GIN index on search vector - Full-text professor search
- `colleges` GIN index on search vector - College search
- `reviews (created_at DESC)` - Recent reviews first

## Data Migration Considerations

### MVP Launch
- Seed database with major Indian colleges/universities
- Import faculty directories where publicly available  
- Normalize department names across institutions

### Future Enhancements
- Add Course entity for course-specific reviews
- Add Professor verification system
- Add seasonal/temporal review filtering
- Add pgvector columns for semantic search
