-- Update Reviews Schema for Advanced Review System
-- This script updates the reviews table to support the full-featured review system

-- First, let's see what we have and then modify it
-- Drop the old simple reviews table (be careful - this will delete existing data)
DROP TABLE IF EXISTS review_flags CASCADE;
DROP TABLE IF EXISTS moderation_log CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

-- Create the new advanced reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core relationships
    professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Link to Supabase auth users
    
    -- Multiple rating dimensions (1-5 scale each)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    clarity_rating INTEGER NOT NULL CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
    helpfulness_rating INTEGER NOT NULL CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    
    -- Course information
    course_name TEXT NOT NULL,
    semester TEXT, -- FY, SY, TY, LY
    academic_year TEXT DEFAULT '2024-25',
    
    -- Additional course details
    would_take_again BOOLEAN,
    attendance_mandatory BOOLEAN,
    assignment_load TEXT CHECK (assignment_load IN ('light', 'moderate', 'heavy')),
    
    -- Review content
    review_text TEXT,
    tags TEXT[], -- Array of tags like ['helpful', 'tough grader', etc.]
    
    -- Privacy and anonymous posting
    anonymous BOOLEAN DEFAULT FALSE,
    anon_display_name TEXT, -- Optional display name for anonymous reviews
    
    -- Moderation and status
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    
    -- Engagement metrics
    helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(professor_id, student_id) -- One review per student per professor
);

-- Recreate the review flags table
CREATE TABLE review_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    flagger_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    flag_reason TEXT NOT NULL CHECK (flag_reason IN ('inappropriate', 'spam', 'fake', 'offensive', 'other')),
    additional_details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate moderation log table
CREATE TABLE moderation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    flag_id UUID REFERENCES review_flags(id) ON DELETE SET NULL,
    moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_taken TEXT NOT NULL CHECK (action_taken IN ('approved', 'rejected', 'edited', 'deleted', 'warning_sent')),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_reviews_professor_id ON reviews(professor_id);
CREATE INDEX idx_reviews_student_id ON reviews(student_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_review_flags_review_id ON review_flags(review_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_flags_updated_at
    BEFORE UPDATE ON review_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust as needed for your setup)
-- These might need to be adjusted based on your Supabase RLS policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (you may need to customize these)
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = student_id OR anonymous = true);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Flags are viewable by moderators" ON review_flags FOR SELECT USING (true); -- Adjust as needed
CREATE POLICY "Users can flag reviews" ON review_flags FOR INSERT WITH CHECK (true);

CREATE POLICY "Moderation log viewable by moderators" ON moderation_log FOR SELECT USING (true); -- Adjust as needed