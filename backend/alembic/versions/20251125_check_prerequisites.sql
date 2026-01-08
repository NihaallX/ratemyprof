-- Pre-flight check before running engagement system migration
-- Run this FIRST to verify all prerequisites are met

-- Check 1: Verify users table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'users table does not exist. Please create it first using scripts/create_users_table.sql';
    END IF;
    RAISE NOTICE '✓ users table exists';
END $$;

-- Check 2: Verify reviews table exists  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        RAISE EXCEPTION 'reviews table does not exist. Please create it first.';
    END IF;
    RAISE NOTICE '✓ reviews table exists';
END $$;

-- Check 3: Verify college_reviews table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_reviews') THEN
        RAISE EXCEPTION 'college_reviews table does not exist. Please create it first using scripts/add_college_reviews_table.sql';
    END IF;
    RAISE NOTICE '✓ college_reviews table exists';
END $$;

-- Check 4: Verify users.id column type
DO $$ 
DECLARE
    id_type TEXT;
BEGIN
    SELECT data_type INTO id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    IF id_type IS NULL THEN
        RAISE EXCEPTION 'users table does not have an id column';
    END IF;
    
    IF id_type != 'uuid' THEN
        RAISE EXCEPTION 'users.id is type % but should be uuid', id_type;
    END IF;
    
    RAISE NOTICE '✓ users.id is type uuid';
END $$;

-- Check 5: Verify uuid extension
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        RAISE NOTICE '! uuid-ossp extension not found, attempting to create...';
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    END IF;
    RAISE NOTICE '✓ uuid-ossp extension is available';
END $$;

-- All checks passed!
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ ALL PREREQUISITES MET';
    RAISE NOTICE 'You can now run 20251125_create_engagement_tables.sql';
    RAISE NOTICE '========================================';
END $$;
