-- Create users table for RateMyProf platform
-- This table will store all user information including registration and verification status

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    college_id TEXT REFERENCES public.colleges(id),
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
    suspended_by UUID REFERENCES public.users(id),
    -- Privacy settings
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'college_only', 'private')),
    show_graduation_year BOOLEAN DEFAULT TRUE,
    show_major BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_college_id ON public.users(college_id);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON public.users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON public.users(verification_token);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample users (including your existing ones)
INSERT INTO public.users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    is_verified, 
    role,
    graduation_year,
    major,
    bio
) VALUES 
    (
        'admin@gmail.com',
        '$2b$12$hashedpassword1', -- You should hash this properly
        'Admin',
        'User',
        TRUE,
        'admin',
        NULL,
        NULL,
        'Platform administrator'
    ),
    (
        'test@example.com',
        '$2b$12$hashedpassword2',
        'Test',
        'User',
        TRUE,
        'student',
        2024,
        'Computer Science',
        'Test student account'
    ),
    (
        'psycoticgamer12344@gmail.com',
        '$2b$12$hashedpassword3',
        'Gaming',
        'Student',
        TRUE,
        'student',
        2025,
        'Information Technology',
        'Gaming enthusiast student'
    ),
    (
        'student1@college.edu',
        '$2b$12$hashedpassword4',
        'John',
        'Doe',
        TRUE,
        'student',
        2024,
        'Engineering',
        'Engineering student'
    ),
    (
        'student2@college.edu',
        '$2b$12$hashedpassword5',
        'Jane',
        'Smith',
        FALSE,
        'student',
        2025,
        'Mathematics',
        'Math student - pending verification'
    ),
    (
        'moderator@ratemyprof.com',
        '$2b$12$hashedpassword6',
        'Mod',
        'User',
        TRUE,
        'moderator',
        NULL,
        NULL,
        'Platform moderator'
    ),
    (
        'newuser@example.com',
        '$2b$12$hashedpassword7',
        'New',
        'Student',
        FALSE,
        'student',
        2026,
        'Business',
        'Recently registered student'
    ),
    (
        'verified@student.edu',
        '$2b$12$hashedpassword8',
        'Verified',
        'Student',
        TRUE,
        'student',
        2023,
        'Physics',
        'Verified physics student'
    );

-- Add some recent activity timestamps
UPDATE public.users 
SET 
    last_login_at = NOW() - INTERVAL '2 hours',
    login_count = 15
WHERE email = 'admin@gmail.com';

UPDATE public.users 
SET 
    last_login_at = NOW() - INTERVAL '1 day',
    login_count = 8
WHERE email = 'test@example.com';

UPDATE public.users 
SET 
    last_login_at = NOW() - INTERVAL '3 days',
    login_count = 25
WHERE email = 'psycoticgamer12344@gmail.com';

UPDATE public.users 
SET 
    last_login_at = NOW() - INTERVAL '1 week',
    login_count = 3
WHERE email = 'student1@college.edu';

-- Set verification tokens for unverified users
UPDATE public.users 
SET 
    verification_token = gen_random_uuid()::text,
    verification_token_expires_at = NOW() + INTERVAL '24 hours'
WHERE is_verified = FALSE;

-- Grant necessary permissions
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for different user roles
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

-- Grant access to service role
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;