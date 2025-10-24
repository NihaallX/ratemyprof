-- ============================================================================
-- SUPABASE DATABASE SCHEMA REFERENCE
-- ============================================================================
-- This file documents the complete database schema as it exists in Supabase.
-- DO NOT run this file - it's for reference only.
-- Last updated: 2025-10-22
-- ============================================================================

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.college_review_author_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL UNIQUE,
  author_id uuid NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT college_review_author_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT college_review_author_mappings_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.college_reviews(id),
  CONSTRAINT college_review_author_mappings_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)
);

CREATE TABLE public.college_review_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  college_review_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  flag_type character varying NOT NULL,
  reason text,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  reviewed_by uuid,
  admin_notes text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT college_review_flags_pkey PRIMARY KEY (id),
  CONSTRAINT college_review_flags_college_review_id_fkey FOREIGN KEY (college_review_id) REFERENCES public.college_reviews(id),
  CONSTRAINT college_review_flags_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id),
  CONSTRAINT college_review_flags_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);

CREATE TABLE public.college_reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  college_id text NOT NULL,
  student_id uuid,
  food_rating integer NOT NULL CHECK (food_rating >= 1 AND food_rating <= 5),
  internet_rating integer NOT NULL CHECK (internet_rating >= 1 AND internet_rating <= 5),
  clubs_rating integer NOT NULL CHECK (clubs_rating >= 1 AND clubs_rating <= 5),
  opportunities_rating integer NOT NULL CHECK (opportunities_rating >= 1 AND opportunities_rating <= 5),
  facilities_rating integer NOT NULL CHECK (facilities_rating >= 1 AND facilities_rating <= 5),
  teaching_rating integer NOT NULL CHECK (teaching_rating >= 1 AND teaching_rating <= 5),
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  course_name text NOT NULL,
  year_of_study text NOT NULL,
  graduation_year integer,
  review_text text,
  anonymous boolean NOT NULL DEFAULT true,
  status text DEFAULT 'approved'::text,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  moderated_at timestamp with time zone,
  moderated_by uuid,
  moderation_reason text,
  is_flagged boolean NOT NULL DEFAULT false,
  CONSTRAINT college_reviews_pkey PRIMARY KEY (id)
);

CREATE TABLE public.colleges (
  id text NOT NULL,
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  college_type text NOT NULL CHECK (college_type = ANY (ARRAY['Public University'::text, 'Private University'::text, 'Public Institute'::text, 'Private Institute'::text])),
  established_year integer,
  website text,
  total_professors integer DEFAULT 0,
  email_domain text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT colleges_pkey PRIMARY KEY (id)
);

CREATE TABLE public.moderation_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY['view_author'::text, 'delete_review'::text, 'approve_review'::text, 'reject_review'::text, 'flag_review'::text, 'unflag_review'::text, 'ban_user'::text, 'unban_user'::text])),
  review_id uuid,
  author_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT moderation_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT fk_admin FOREIGN KEY (admin_id) REFERENCES public.users(id),
  CONSTRAINT fk_audit_review FOREIGN KEY (review_id) REFERENCES public.reviews(id),
  CONSTRAINT fk_audit_author FOREIGN KEY (author_id) REFERENCES public.users(id)
);

CREATE TABLE public.moderation_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  review_id uuid,
  flag_id uuid,
  moderator_id uuid,
  action_taken text NOT NULL CHECK (action_taken = ANY (ARRAY['approved'::text, 'rejected'::text, 'edited'::text, 'deleted'::text, 'warning_sent'::text])),
  reason text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT moderation_log_pkey PRIMARY KEY (id),
  CONSTRAINT moderation_log_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id),
  CONSTRAINT moderation_log_flag_id_fkey FOREIGN KEY (flag_id) REFERENCES public.review_flags(id),
  CONSTRAINT moderation_log_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES auth.users(id)
);

CREATE TABLE public.professors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  college_id text NOT NULL,
  department text NOT NULL,
  designation text DEFAULT 'Faculty'::text,
  subjects ARRAY,
  average_rating numeric DEFAULT 0.0 CHECK (average_rating >= 0::numeric AND average_rating <= 5::numeric),
  total_reviews integer DEFAULT 0,
  years_of_experience integer,
  specializations ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_verified boolean DEFAULT false,
  CONSTRAINT professors_pkey PRIMARY KEY (id),
  CONSTRAINT professors_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id)
);

CREATE TABLE public.review_author_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL UNIQUE,
  author_id uuid NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_author_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT fk_review FOREIGN KEY (review_id) REFERENCES public.reviews(id),
  CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES auth.users(id)
);

CREATE TABLE public.review_flags (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  review_id uuid NOT NULL,
  flagger_id uuid,
  flag_reason text NOT NULL CHECK (flag_reason = ANY (ARRAY['inappropriate'::text, 'spam'::text, 'fake'::text, 'offensive'::text, 'other'::text])),
  additional_details text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'dismissed'::text, 'action_taken'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_flags_pkey PRIMARY KEY (id),
  CONSTRAINT review_flags_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id),
  CONSTRAINT review_flags_flagger_id_fkey FOREIGN KEY (flagger_id) REFERENCES auth.users(id)
);

CREATE TABLE public.review_votes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  review_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type = ANY (ARRAY['helpful'::text, 'not_helpful'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT review_votes_pkey PRIMARY KEY (id)
);

CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  professor_id uuid NOT NULL,
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  difficulty_rating integer NOT NULL CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  clarity_rating integer NOT NULL CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
  helpfulness_rating integer NOT NULL CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  course_name text NOT NULL,
  semester text,
  academic_year text DEFAULT '2024-25'::text,
  would_take_again boolean,
  attendance_mandatory boolean,
  assignment_load text CHECK (assignment_load = ANY (ARRAY['light'::text, 'moderate'::text, 'heavy'::text])),
  review_text text,
  tags ARRAY,
  status text DEFAULT 'approved'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'flagged'::text])),
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  not_helpful_count integer DEFAULT 0,
  verified_student boolean DEFAULT true,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.professors(id)
);

CREATE TABLE public.reviews_backup (
  id uuid,
  professor_id uuid,
  student_id uuid,
  overall_rating integer,
  difficulty_rating integer,
  clarity_rating integer,
  helpfulness_rating integer,
  course_name text,
  semester text,
  academic_year text,
  would_take_again boolean,
  attendance_mandatory boolean,
  assignment_load text,
  review_text text,
  tags ARRAY,
  anonymous boolean,
  anon_display_name text,
  status text,
  helpful_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  not_helpful_count integer
);

CREATE TABLE public.user_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type character varying NOT NULL,
  action_date date NOT NULL,
  action_count integer NOT NULL DEFAULT 1,
  last_action_at timestamp with time zone NOT NULL DEFAULT now(),
  target_id character varying,
  ip_address character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_activities_pkey PRIMARY KEY (id),
  CONSTRAINT user_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  first_name character varying,
  last_name character varying,
  college_id text,
  is_verified boolean DEFAULT false,
  verification_token character varying,
  verification_token_expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  role character varying DEFAULT 'student'::character varying CHECK (role::text = ANY (ARRAY['student'::character varying, 'admin'::character varying, 'moderator'::character varying]::text[])),
  profile_picture_url text,
  bio text,
  graduation_year integer,
  major character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login_at timestamp with time zone,
  login_count integer DEFAULT 0,
  registration_ip inet,
  user_agent text,
  referral_source character varying,
  is_suspended boolean DEFAULT false,
  suspension_reason text,
  suspended_at timestamp with time zone,
  suspended_by uuid,
  profile_visibility character varying DEFAULT 'public'::character varying CHECK (profile_visibility::text = ANY (ARRAY['public'::character varying, 'college_only'::character varying, 'private'::character varying]::text[])),
  show_graduation_year boolean DEFAULT true,
  show_major boolean DEFAULT true,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE public.users_backup (
  id uuid,
  email character varying,
  password_hash character varying,
  first_name character varying,
  last_name character varying,
  college_id text,
  is_verified boolean,
  verification_token character varying,
  verification_token_expires_at timestamp with time zone,
  is_active boolean,
  role character varying,
  profile_picture_url text,
  bio text,
  graduation_year integer,
  major character varying,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  last_login_at timestamp with time zone,
  login_count integer,
  registration_ip inet,
  user_agent text,
  referral_source character varying,
  is_suspended boolean,
  suspension_reason text,
  suspended_at timestamp with time zone,
  suspended_by uuid,
  profile_visibility character varying,
  show_graduation_year boolean,
  show_major boolean
);

-- ============================================================================
-- KEY TABLES SUMMARY
-- ============================================================================
--
-- CORE TABLES:
-- - professors: Professor profiles with ratings
-- - reviews: Professor reviews with detailed ratings
-- - colleges: College/university information
-- - college_reviews: College reviews with facility ratings
--
-- ANONYMITY SYSTEM:
-- - review_author_mappings: Links reviews to actual authors (protected)
-- - college_review_author_mappings: Links college reviews to authors (protected)
--
-- VOTING & MODERATION:
-- - review_votes: Helpful/not helpful votes on reviews
-- - review_flags: User-reported issues with reviews
-- - college_review_flags: User-reported issues with college reviews
-- - moderation_log: Admin moderation actions log
-- - moderation_audit_logs: Detailed audit trail
--
-- USER MANAGEMENT:
-- - users: Custom user profiles (public schema)
-- - auth.users: Supabase authentication (auth schema)
-- - user_activities: Track user actions for rate limiting
--
-- BACKUP TABLES:
-- - reviews_backup: Backup of reviews table
-- - users_backup: Backup of users table
--
-- ============================================================================
