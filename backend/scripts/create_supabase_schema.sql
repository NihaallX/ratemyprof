-- RateMyProf Supabase Database Schema for Vishwakarma University
-- This script creates the tables needed for the VU pilot implementation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Colleges table (VU and other Indian colleges)
CREATE TABLE IF NOT EXISTS colleges (
    id TEXT PRIMARY KEY, -- Using PRN format like "312303501027" for VU
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    college_type TEXT NOT NULL CHECK (college_type IN ('Public University', 'Private University', 'Public Institute', 'Private Institute')),
    established_year INTEGER,
    website TEXT,
    total_professors INTEGER DEFAULT 0,
    email_domain TEXT, -- e.g., "vupune.ac.in" for VU students
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professors table (VU faculty)
CREATE TABLE IF NOT EXISTS professors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    designation TEXT DEFAULT 'Faculty', -- Professor, Associate Professor, Assistant Professor, Faculty
    subjects TEXT[], -- Array of subjects they teach
    average_rating DECIMAL(2,1) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    years_of_experience INTEGER,
    specializations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table (student reviews of professors)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
    student_email TEXT NOT NULL, -- VU student email like "31230730@vupune.ac.in"
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    course_name TEXT, -- Subject/course for which review is given
    comment TEXT,
    semester TEXT, -- "FE", "SE", "TE", "BE" or specific semester
    academic_year TEXT, -- "2023-24", "2024-25"
    would_recommend BOOLEAN DEFAULT true,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    attendance_mandatory BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate reviews from same student for same professor in same course
    UNIQUE(professor_id, student_email, course_name, academic_year)
);

-- Review flags table (for moderation)
CREATE TABLE IF NOT EXISTS review_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    flagger_email TEXT NOT NULL, -- Who reported the review
    flag_reason TEXT NOT NULL CHECK (flag_reason IN ('inappropriate', 'spam', 'fake', 'offensive', 'other')),
    additional_details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation log table
CREATE TABLE IF NOT EXISTS moderation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    flag_id UUID REFERENCES review_flags(id) ON DELETE SET NULL,
    moderator_email TEXT NOT NULL,
    action_taken TEXT NOT NULL CHECK (action_taken IN ('approved', 'rejected', 'edited', 'deleted', 'warning_sent')),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professors_college_id ON professors(college_id);
CREATE INDEX IF NOT EXISTS idx_professors_department ON professors(department);
CREATE INDEX IF NOT EXISTS idx_reviews_professor_id ON reviews(professor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student_email ON reviews(student_email);
CREATE INDEX IF NOT EXISTS idx_review_flags_review_id ON review_flags(review_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_status ON review_flags(status);

-- Insert Vishwakarma University data
INSERT INTO colleges (id, name, city, state, college_type, established_year, website, email_domain) VALUES
('VU-PUNE-001', 'Vishwakarma University', 'Pune', 'Maharashtra', 'Private University', 2017, 'https://vu.edu.in', 'vupune.ac.in')
ON CONFLICT (id) DO NOTHING;

-- Insert VU professors based on provided data
INSERT INTO professors (name, college_id, department, designation, subjects) VALUES
('Prof. Yogita Patil', 'VU-PUNE-001', 'Computer Science', 'Faculty', ARRAY['Fundamentals of Electronics']),
('Prof. Maya Kurulekar', 'VU-PUNE-001', 'Computer Science', 'Faculty', ARRAY['Introduction to Computer Programming']),
('Prof. Jameel Ansari', 'VU-PUNE-001', 'Computer Science', 'Faculty', ARRAY[]::TEXT[]),
('Prof. Sandhya T', 'VU-PUNE-001', 'Computer Science', 'Faculty', ARRAY[]::TEXT[]),
('Prof. Jagdish Tawde', 'VU-PUNE-001', 'Applied Mathematics', 'Faculty', ARRAY['Applied Mathematics'])
ON CONFLICT DO NOTHING;

-- Update total_professors count for VU
UPDATE colleges SET total_professors = (
    SELECT COUNT(*) FROM professors WHERE college_id = 'VU-PUNE-001'
) WHERE id = 'VU-PUNE-001';