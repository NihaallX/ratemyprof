-- Check all columns in the reviews table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'reviews'
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- Also check a sample review to see actual data
SELECT * FROM reviews LIMIT 1;
