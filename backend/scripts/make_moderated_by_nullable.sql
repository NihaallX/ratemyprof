-- Make moderated_by column nullable to support admin users
-- Admin users have ID "admin-user-id" which is not a valid UUID
-- So we store NULL for admin moderations

-- First check if the column exists and its current state
DO $$ 
BEGIN
    -- Make moderated_by nullable if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reviews' 
        AND column_name = 'moderated_by'
    ) THEN
        -- Drop NOT NULL constraint if it exists
        ALTER TABLE reviews ALTER COLUMN moderated_by DROP NOT NULL;
        RAISE NOTICE 'moderated_by column is now nullable';
    ELSE
        RAISE NOTICE 'moderated_by column does not exist';
    END IF;
END $$;

-- Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'reviews'
AND column_name IN ('moderated_by', 'moderated_at', 'status');
