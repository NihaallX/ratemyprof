-- Fix college_review_votes foreign key to reference auth.users instead of public.users
-- This fixes the 500 error when voting on college reviews
-- 
-- ROOT CAUSE: The original table was created with REFERENCES users(id) 
-- but Supabase Auth users are in auth.users, not public.users
--
-- Run this script in Supabase SQL Editor to fix the issue

-- Step 1: Drop the existing foreign key constraint on user_id
ALTER TABLE college_review_votes 
DROP CONSTRAINT IF EXISTS college_review_votes_user_id_fkey;

-- Step 2: Add the correct foreign key constraint pointing to auth.users
ALTER TABLE college_review_votes
ADD CONSTRAINT college_review_votes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Verify the constraint was added correctly
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='college_review_votes'
  AND kcu.column_name='user_id';

-- Expected output should show:
-- foreign_table_schema: auth
-- foreign_table_name: users
-- foreign_column_name: id

