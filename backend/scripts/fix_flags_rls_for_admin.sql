-- Diagnose and fix college_review_flags RLS policies for admin operations

-- 1. Check current RLS policies on college_review_flags
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'college_review_flags'
ORDER BY cmd, policyname;

-- 2. Add UPDATE policy for authenticated users (so admins can review flags)
DO $$ 
BEGIN
    -- Drop existing restrictive UPDATE policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'college_review_flags' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        DROP POLICY "Enable update for authenticated users" ON college_review_flags;
        RAISE NOTICE 'Dropped existing UPDATE policy';
    END IF;
    
    -- Create new UPDATE policy that allows authenticated users to update
    -- (This is needed for admin to mark flags as reviewed)
    EXECUTE 'CREATE POLICY "Enable update for authenticated users" ON college_review_flags
        FOR UPDATE
        USING (true)
        WITH CHECK (true)';
    
    RAISE NOTICE 'UPDATE policy created successfully';
END $$;

-- 3. Check if moderation_logs table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'moderation_logs'
) as moderation_logs_exists;

-- 4. Verify all policies are correct
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Should allow authenticated to read'
        WHEN cmd = 'INSERT' THEN 'Should allow authenticated where reporter_id matches'
        WHEN cmd = 'UPDATE' THEN 'Should allow authenticated to update (for admin review)'
        WHEN cmd = 'DELETE' THEN 'Should allow service_role only'
        ELSE 'Unknown'
    END as expected_behavior,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'college_review_flags'
ORDER BY cmd, policyname;
