-- Create users table for RateMyProf platform (SIMPLIFIED VERSION)
-- This table will store all user information including registration and verification status

-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    college_id TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin', 'moderator')),
    profile_picture_url TEXT,
    bio TEXT,
    graduation_year INTEGER,
    major VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    -- Additional metadata
    registration_ip INET,
    user_agent TEXT,
    referral_source VARCHAR(100),
    -- Account status tracking
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspended_by UUID,
    -- Privacy settings
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'college_only', 'private')),
    show_graduation_year BOOLEAN DEFAULT TRUE,
    show_major BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_college_id ON public.users(college_id);
CREATE INDEX idx_users_is_verified ON public.users(is_verified);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- Grant permissions without complex policies
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;