-- Check what columns actually exist in college_reviews table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'college_reviews'
ORDER BY ordinal_position;

-- Check if there's any data in college_reviews
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
    status
FROM college_reviews
LIMIT 5;

-- Check what columns are NULL
SELECT 
    COUNT(*) as total_reviews,
    COUNT(food_rating) as has_food_rating,
    COUNT(internet_rating) as has_internet_rating,
    COUNT(clubs_rating) as has_clubs_rating,
    COUNT(opportunities_rating) as has_opportunities_rating,
    COUNT(facilities_rating) as has_facilities_rating,
    COUNT(teaching_rating) as has_teaching_rating,
    COUNT(overall_rating) as has_overall_rating
FROM college_reviews;
