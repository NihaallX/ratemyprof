-- Check and add DELETE RLS policy for college_review_votes

-- 1. Check current policies on college_review_votes
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
WHERE tablename = 'college_review_votes'
ORDER BY cmd, policyname;

-- 2. Add DELETE policy if it doesn't exist (users can delete their own votes)
-- This allows users to remove their votes (YouTube-style toggle)
DO $$ 
BEGIN
    -- Check if policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'college_review_votes' 
        AND policyname = 'Enable delete for vote owners'
    ) THEN
        -- Create DELETE policy
        EXECUTE 'CREATE POLICY "Enable delete for vote owners" ON college_review_votes
            FOR DELETE
            USING (auth.uid() = user_id)';
        
        RAISE NOTICE 'DELETE policy created successfully';
    ELSE
        RAISE NOTICE 'DELETE policy already exists';
    END IF;
END $$;

-- 3. Verify the policy was created
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'college_review_votes' AND cmd = 'DELETE';
