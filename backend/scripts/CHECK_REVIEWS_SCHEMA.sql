-- Check reviews table structure to see what columns exist
-- and which ones are required (NOT NULL without defaults)

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN is_nullable = 'NO' AND column_default IS NULL THEN '❌ REQUIRED - Must provide value!'
        WHEN is_nullable = 'NO' AND column_default IS NOT NULL THEN '✅ Has default'
        ELSE '✅ Optional (nullable)'
    END as requirement_status
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'reviews'
ORDER BY 
    CASE 
        WHEN is_nullable = 'NO' AND column_default IS NULL THEN 1  -- Required fields first
        WHEN is_nullable = 'NO' THEN 2  -- Has default
        ELSE 3  -- Optional
    END,
    ordinal_position;
