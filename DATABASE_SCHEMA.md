# Supabase Database Schema Reference

**Last Updated**: October 22, 2025  
**Purpose**: Quick reference for existing database tables to avoid "relation does not exist" errors

## Core Tables

### 1. `professors`
- Main table for professor data
- Fields: id, name, college_id, department, designation, subjects, average_rating, total_reviews, is_verified, created_at, updated_at, etc.

### 2. `colleges`
- College/University information
- Fields: id, name, city, state, college_type, established_year, website, total_professors, etc.

### 3. `college_reviews`
- Reviews for colleges (separate from professor reviews)
- Fields: id, college_id, student_id, overall_rating, facilities_rating, teaching_rating, opportunities_rating, status, created_at, etc.

### 4. `reviews_backup`
- **NOTE**: This appears to be the main reviews table (not just backup!)
- Professor reviews storage
- Fields: id, professor_id, student_id, overall_rating, difficulty_rating, clarity_rating, helpfulness_rating, course_name, semester, academic_year, status, helpful_count, not_helpful_count, etc.

## Moderation & Flags

### 5. `moderation_log`
- Audit trail for moderation actions
- Fields: id, content_id, action_taken, reason, moderator_id, created_at, etc.

### 6. `review_flags`
- Flagged professor reviews
- Fields: id, review_id, flagger_id, flag_type, reason, status, created_at, etc.

### 7. `college_review_flags`
- Flagged college reviews
- Fields: id, college_review_id, flagger_id, flag_type, reason, status, created_at, etc.

## User Management

### 8. `user_activities`
- User activity tracking
- Fields: id, user_id, action_type, created_at, etc.

### 9. `auth.users` (Supabase managed)
- Authentication table managed by Supabase Auth
- Fields: id, email, password_hash, email_verified, created_at, updated_at, etc.

## Tables That DO NOT Exist (Don't reference these!)

❌ `reviews` (use `reviews_backup` instead)  
❌ `review_mappings` (no anonymity mapping table)  
❌ `college_review_mappings` (no college review mapping table)  
❌ `review_votes` (voting is tracked in reviews table directly with helpful_count/not_helpful_count)  
❌ `professor_review_mappings` (not implemented)

## Important Notes

1. **Reviews Table**: The actual reviews are in `reviews_backup`, NOT `reviews`
2. **No Mapping Tables**: The system doesn't use separate mapping tables for anonymity
3. **Vote Counts**: Stored directly in review tables as `helpful_count` and `not_helpful_count`
4. **RLS Policies**: Only create policies for tables that actually exist (see enable_rls_policies_correct.sql)

## Schema Verification Query

Run this in Supabase SQL Editor to see all public tables:

```sql
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## When Adding New Features

**ALWAYS** check if the table exists first:
1. Check this document
2. Run the verification query above
3. Look at the Supabase dashboard Tables tab
4. Don't assume tables exist based on old code/docs
