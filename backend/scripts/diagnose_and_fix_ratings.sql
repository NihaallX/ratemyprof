-- ============================================================================
-- DIAGNOSE AND FIX COLLEGE REVIEWS DATA ISSUE
-- ============================================================================
-- This script will:
-- 1. Check what columns exist in college_reviews table
-- 2. Check if data is NULL or missing
-- 3. Fix column names if they're wrong
-- 4. Show sample data
-- ============================================================================

-- STEP 1: Check table structure
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 1: Checking college_reviews table structure';
    RAISE NOTICE '============================================';
END $$;

SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'college_reviews'
ORDER BY ordinal_position;

-- STEP 2: Check for existing data
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 2: Checking for existing review data';
    RAISE NOTICE '============================================';
END $$;

SELECT 
    COUNT(*) as total_reviews,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reviews,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reviews
FROM college_reviews;

-- STEP 3: Check if rating columns exist and have data
DO $$
DECLARE
    has_food_rating BOOLEAN;
    has_internet_rating BOOLEAN;
    sample_review RECORD;
BEGIN
    -- Check if rating columns exist
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'college_reviews' 
        AND column_name = 'food_rating'
    ) INTO has_food_rating;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'college_reviews' 
        AND column_name = 'internet_rating'
    ) INTO has_internet_rating;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 3: Column existence check';
    RAISE NOTICE '============================================';
    
    IF has_food_rating THEN
        RAISE NOTICE '✅ food_rating column exists';
    ELSE
        RAISE NOTICE '❌ food_rating column MISSING!';
    END IF;
    
    IF has_internet_rating THEN
        RAISE NOTICE '✅ internet_rating column exists';
    ELSE
        RAISE NOTICE '❌ internet_rating column MISSING!';
    END IF;
    
    -- Show a sample review
    IF has_food_rating THEN
        EXECUTE 'SELECT * FROM college_reviews LIMIT 1' INTO sample_review;
        IF sample_review IS NOT NULL THEN
            RAISE NOTICE '';
            RAISE NOTICE 'Sample review data:';
            RAISE NOTICE '  ID: %', sample_review.id;
            RAISE NOTICE '  Status: %', sample_review.status;
        END IF;
    END IF;
END $$;

-- STEP 4: Add missing rating columns if they don't exist
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 4: Adding missing columns (if needed)';
    RAISE NOTICE '============================================';
    
    -- Check and add each rating column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'college_reviews' AND column_name = 'food_rating') THEN
        ALTER TABLE college_reviews ADD COLUMN food_rating INTEGER;
        RAISE NOTICE '✅ Added food_rating column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'college_reviews' AND column_name = 'internet_rating') THEN
        ALTER TABLE college_reviews ADD COLUMN internet_rating INTEGER;
        RAISE NOTICE '✅ Added internet_rating column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'college_reviews' AND column_name = 'clubs_rating') THEN
        ALTER TABLE college_reviews ADD COLUMN clubs_rating INTEGER;
        RAISE NOTICE '✅ Added clubs_rating column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'college_reviews' AND column_name = 'opportunities_rating') THEN
        ALTER TABLE college_reviews ADD COLUMN opportunities_rating INTEGER;
        RAISE NOTICE '✅ Added opportunities_rating column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'college_reviews' AND column_name = 'facilities_rating') THEN
        ALTER TABLE college_reviews ADD COLUMN facilities_rating INTEGER;
        RAISE NOTICE '✅ Added facilities_rating column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'college_reviews' AND column_name = 'teaching_rating') THEN
        ALTER TABLE college_reviews ADD COLUMN teaching_rating INTEGER;
        RAISE NOTICE '✅ Added teaching_rating column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'college_reviews' AND column_name = 'overall_rating') THEN
        ALTER TABLE college_reviews ADD COLUMN overall_rating INTEGER;
        RAISE NOTICE '✅ Added overall_rating column';
    END IF;
END $$;

-- STEP 5: Show actual data from a review
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 5: Sample review data (first review)';
    RAISE NOTICE '============================================';
END $$;

SELECT 
    id,
    college_id,
    food_rating,
    internet_rating,
    clubs_rating,
    opportunities_rating,
    facilities_rating,
    teaching_rating,
    overall_rating,
    course_name,
    year_of_study,
    status,
    created_at
FROM college_reviews
ORDER BY created_at DESC
LIMIT 3;

-- STEP 6: Check for NULL ratings
DO $$
DECLARE
    total_count INTEGER;
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM college_reviews;
    SELECT COUNT(*) INTO null_count FROM college_reviews WHERE food_rating IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 6: NULL value analysis';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total reviews: %', total_count;
    RAISE NOTICE 'Reviews with NULL food_rating: %', null_count;
    
    IF null_count > 0 AND total_count > 0 THEN
        RAISE NOTICE '⚠️  WARNING: % reviews have NULL ratings!', null_count;
        RAISE NOTICE '   This will cause N/A to display in frontend';
    ELSE
        RAISE NOTICE '✅ All reviews have rating data';
    END IF;
END $$;

-- STEP 7: Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ DIAGNOSIS COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Check the query results above';
    RAISE NOTICE '2. If ratings are NULL, you need to re-submit reviews';
    RAISE NOTICE '3. If columns were missing, they have been added';
    RAISE NOTICE '4. Check Railway logs for insert errors';
    RAISE NOTICE '============================================';
END $$;
