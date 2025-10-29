-- Add missing foreign key constraint to college_reviews table
-- This allows Supabase PostgREST to automatically join with colleges table

-- First, let's verify the constraint doesn't already exist
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'college_reviews'
  AND kcu.column_name = 'college_id';

-- If the above query returns no rows, run this to add the foreign key:
ALTER TABLE college_reviews
ADD CONSTRAINT fk_college_reviews_college
FOREIGN KEY (college_id)
REFERENCES colleges(id)
ON DELETE CASCADE;

-- Verify the constraint was added
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'college_reviews';

-- After adding the foreign key, you need to reload the schema in Supabase
-- The PostgREST schema cache will automatically refresh, but you can force it by:
-- 1. Going to Supabase Dashboard → Settings → API
-- 2. Click "Reload schema cache" button
-- OR just wait 10-30 seconds for auto-refresh
