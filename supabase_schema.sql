-- RateMyProf India - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- Create ENUM types
CREATE TYPE college_type_enum AS ENUM ('university', 'college', 'institute');
CREATE TYPE flag_reason_enum AS ENUM ('inappropriate', 'spam', 'offensive', 'irrelevant', 'personal_attack');
CREATE TYPE moderation_action_enum AS ENUM ('approved', 'removed', 'warned', 'appealed', 'reinstated');

-- Create colleges table
CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    college_type college_type_enum NOT NULL,
    website_url VARCHAR(255),
    established_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    name VARCHAR(100),
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    is_moderator BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create professors table
CREATE TABLE IF NOT EXISTS professors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    known_as VARCHAR(50),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    profile_photo_url VARCHAR(255),
    subjects_taught JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    anon_display_name VARCHAR(50),
    rating_clarity INTEGER NOT NULL CHECK (rating_clarity >= 1 AND rating_clarity <= 5),
    rating_helpfulness INTEGER NOT NULL CHECK (rating_helpfulness >= 1 AND rating_helpfulness <= 5),
    rating_workload INTEGER NOT NULL CHECK (rating_workload >= 1 AND rating_workload <= 5),
    rating_engagement INTEGER NOT NULL CHECK (rating_engagement >= 1 AND rating_engagement <= 5),
    review_text TEXT,
    semester_taken VARCHAR(50),
    course_taken VARCHAR(100),
    is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
    is_removed BOOLEAN DEFAULT FALSE NOT NULL,
    flags_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create review_flags table
CREATE TABLE IF NOT EXISTS review_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    flagger_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason flag_reason_enum NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(review_id, flagger_user_id)
);

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action moderation_action_enum NOT NULL,
    reason VARCHAR(200) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create review_votes table (for upvote/downvote functionality)
CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(review_id, user_id)
);

-- Create college_reviews table (for college reviews)
CREATE TABLE IF NOT EXISTS college_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating_academics INTEGER NOT NULL CHECK (rating_academics >= 1 AND rating_academics <= 5),
    rating_infrastructure INTEGER NOT NULL CHECK (rating_infrastructure >= 1 AND rating_infrastructure <= 5),
    rating_placements INTEGER NOT NULL CHECK (rating_placements >= 1 AND rating_placements <= 5),
    rating_campus_life INTEGER NOT NULL CHECK (rating_campus_life >= 1 AND rating_campus_life <= 5),
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    is_flagged BOOLEAN DEFAULT FALSE NOT NULL,
    is_removed BOOLEAN DEFAULT FALSE NOT NULL,
    flags_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create college_review_flags table
CREATE TABLE IF NOT EXISTS college_review_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_review_id UUID NOT NULL REFERENCES college_reviews(id) ON DELETE CASCADE,
    flagger_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason flag_reason_enum NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(college_review_id, flagger_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_colleges_state_city ON colleges(state, city);
CREATE INDEX IF NOT EXISTS idx_professors_college_dept ON professors(college_id, department);
CREATE INDEX IF NOT EXISTS idx_professors_name ON professors(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_reviews_professor_active ON reviews(professor_id, is_removed);
CREATE INDEX IF NOT EXISTS idx_reviews_user_professor ON reviews(user_id, professor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_review_flags_review ON review_flags(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_college_reviews_college ON college_reviews(college_id);
CREATE INDEX IF NOT EXISTS idx_college_review_flags_review ON college_review_flags(college_review_id);
CREATE INDEX IF NOT EXISTS idx_college_review_flags_status ON college_review_flags(status);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_professors_search ON professors 
USING GIN(to_tsvector('english', 
    first_name || ' ' || last_name || ' ' || 
    COALESCE(known_as, '') || ' ' || department
));

CREATE INDEX IF NOT EXISTS idx_colleges_search ON colleges 
USING GIN(to_tsvector('english', name || ' ' || city || ' ' || state));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_college_reviews_updated_at BEFORE UPDATE ON college_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (Optional - uncomment to add sample colleges and professors)
/*
-- Sample Colleges
INSERT INTO colleges (name, city, state, college_type, established_year) VALUES
('Indian Institute of Technology Delhi', 'Delhi', 'Delhi', 'institute', 1961),
('Delhi University', 'Delhi', 'Delhi', 'university', 1922),
('Jawaharlal Nehru University', 'Delhi', 'Delhi', 'university', 1969);

-- Note: Add professors after creating colleges, using the college IDs
*/

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_review_flags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow read access to all, restrict writes)
CREATE POLICY "Allow public read access on colleges" ON colleges FOR SELECT USING (true);
CREATE POLICY "Allow public read access on professors" ON professors FOR SELECT USING (true);
CREATE POLICY "Allow public read access on reviews" ON reviews FOR SELECT USING (NOT is_removed);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON reviews TO authenticated;
GRANT INSERT ON review_flags TO authenticated;
GRANT INSERT ON review_votes TO authenticated;
GRANT INSERT ON college_reviews TO authenticated;
GRANT INSERT ON college_review_flags TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Add sample data or use the frontend to add professors';
    RAISE NOTICE '2. Configure Railway environment variables with Supabase credentials';
    RAISE NOTICE '3. Test the API endpoints';
END $$;
