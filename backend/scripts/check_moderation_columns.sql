-- Check if moderation columns exist on reviews table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews' 
    AND column_name IN ('moderated_at', 'moderated_by', 'status')
ORDER BY column_name;
