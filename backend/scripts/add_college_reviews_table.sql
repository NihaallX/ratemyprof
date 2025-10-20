-- Add College Reviews Schema
-- This script creates the college_reviews table for college-specific reviews

-- Create college_reviews table
CREATE TABLE IF NOT EXISTS college_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core relationships
    college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Link to Supabase auth users
    
    -- Multiple rating dimensions (1-5 scale each)
    food_rating INTEGER NOT NULL CHECK (food_rating >= 1 AND food_rating <= 5),
    internet_rating INTEGER NOT NULL CHECK (internet_rating >= 1 AND internet_rating <= 5),
    clubs_rating INTEGER NOT NULL CHECK (clubs_rating >= 1 AND clubs_rating <= 5),
    opportunities_rating INTEGER NOT NULL CHECK (opportunities_rating >= 1 AND opportunities_rating <= 5),
    facilities_rating INTEGER NOT NULL CHECK (facilities_rating >= 1 AND facilities_rating <= 5),
    teaching_rating INTEGER NOT NULL CHECK (teaching_rating >= 1 AND teaching_rating <= 5),
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Student information
    course_name TEXT NOT NULL,
    year_of_study TEXT NOT NULL CHECK (year_of_study IN ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate', 'Postgraduate')),
    graduation_year INTEGER,
    
    -- Review content
    review_text TEXT,
    
    -- Privacy (always anonymous for college reviews)
    anonymous BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Moderation and status
    status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    
    -- Engagement metrics
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    -- Moderation details
    moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    moderation_reason TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_college_reviews_college_id ON college_reviews(college_id);
CREATE INDEX IF NOT EXISTS idx_college_reviews_student_id ON college_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_college_reviews_status ON college_reviews(status);
CREATE INDEX IF NOT EXISTS idx_college_reviews_created_at ON college_reviews(created_at DESC);

-- Add Row Level Security (RLS)
ALTER TABLE college_reviews ENABLE ROW LEVEL SECURITY;

-- Policy for reading approved reviews (public can read approved reviews)
CREATE POLICY "Allow public to read approved college reviews" ON college_reviews
    FOR SELECT USING (status = 'approved');

-- Policy for authenticated users to create reviews
CREATE POLICY "Allow authenticated users to create college reviews" ON college_reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for users to update their own reviews
CREATE POLICY "Allow users to update their own college reviews" ON college_reviews
    FOR UPDATE USING (auth.uid() = student_id);

-- Policy for users to delete their own reviews
CREATE POLICY "Allow users to delete their own college reviews" ON college_reviews
    FOR DELETE USING (auth.uid() = student_id);

-- Update trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_college_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_college_reviews_updated_at
    BEFORE UPDATE ON college_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_college_reviews_updated_at();

-- Add college review statistics to colleges table if not exists
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS college_reviews_count INTEGER DEFAULT 0;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS college_average_rating DECIMAL(2,1) DEFAULT 0.0;

-- Function to update college statistics when reviews are added/updated/deleted
CREATE OR REPLACE FUNCTION update_college_review_stats()
RETURNS TRIGGER AS $$
DECLARE
    college_id_to_update TEXT;
    review_count INTEGER;
    avg_rating DECIMAL(2,1);
BEGIN
    -- Determine which college to update
    IF TG_OP = 'DELETE' THEN
        college_id_to_update = OLD.college_id;
    ELSE
        college_id_to_update = NEW.college_id;
    END IF;
    
    -- Calculate new statistics
    SELECT 
        COUNT(*), 
        COALESCE(AVG(overall_rating), 0)
    INTO review_count, avg_rating
    FROM college_reviews 
    WHERE college_id = college_id_to_update AND status = 'approved';
    
    -- Update college record
    UPDATE colleges 
    SET 
        college_reviews_count = review_count,
        college_average_rating = avg_rating
    WHERE id = college_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers to update college stats
CREATE TRIGGER update_college_stats_on_review_insert
    AFTER INSERT ON college_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_college_review_stats();

CREATE TRIGGER update_college_stats_on_review_update
    AFTER UPDATE ON college_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_college_review_stats();

CREATE TRIGGER update_college_stats_on_review_delete
    AFTER DELETE ON college_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_college_review_stats();

-- Add some example review guidelines as a table (optional)
CREATE TABLE IF NOT EXISTS review_guidelines (
    id SERIAL PRIMARY KEY,
    guideline_text TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default guidelines
INSERT INTO review_guidelines (guideline_text, category) VALUES
('Be respectful and constructive in your feedback', 'behavior'),
('No vulgar language, personal attacks, or offensive content', 'content'),
('Focus on factual experiences with specific aspects (food, facilities, etc.)', 'content'),
('Do not reveal personal information about yourself or others', 'privacy'),
('Reviews containing hate speech, discrimination, or harassment will be removed', 'moderation'),
('Fake reviews or spam will result in account suspension', 'moderation'),
('Use appropriate language and maintain academic discourse', 'behavior'),
('Provide honest feedback that would help other students', 'content'),
('Reviews are anonymous - your identity will not be revealed', 'privacy'),
('All reviews go through moderation before being published', 'process')
ON CONFLICT DO NOTHING;