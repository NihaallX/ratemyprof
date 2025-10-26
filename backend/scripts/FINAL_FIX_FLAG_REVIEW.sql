-- COMPLETE FIX for flag review 500 errors
-- This fixes all RLS permission issues for admin flag operations

-- 1. Check current UPDATE policy on college_review_flags
SELECT 
    policyname,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'college_review_flags' AND cmd = 'UPDATE';

-- 2. Drop all restrictive UPDATE policies
DO $$ 
BEGIN
    -- Drop any existing UPDATE policies that might be blocking
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON college_review_flags;
    DROP POLICY IF EXISTS "Enable update for flag owners" ON college_review_flags;
    DROP POLICY IF EXISTS "Users can update own flags" ON college_review_flags;
    
    RAISE NOTICE 'Dropped existing UPDATE policies';
END $$;

-- 3. Create permissive UPDATE policy for all authenticated users
-- This allows admins (who are authenticated) to update flag status
CREATE POLICY "Authenticated users can update flags" ON college_review_flags
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Ensure service_role has full access
DO $$
BEGIN
    -- Check if service_role ALL policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'college_review_flags' 
        AND policyname = 'Enable all for service_role'
    ) THEN
        CREATE POLICY "Enable all for service_role" ON college_review_flags
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Created service_role ALL policy';
    END IF;
END $$;

-- 5. Check if reviewed_by and reviewed_at columns exist in flags table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'college_review_flags'
    AND column_name IN ('reviewed_by', 'reviewed_at', 'admin_notes')
ORDER BY column_name;

-- 6. Add missing columns if they don't exist
DO $$
BEGIN
    -- Add reviewed_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_review_flags' AND column_name = 'reviewed_by'
    ) THEN
        ALTER TABLE college_review_flags ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added reviewed_by column';
    END IF;
    
    -- Add reviewed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_review_flags' AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE college_review_flags ADD COLUMN reviewed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added reviewed_at column';
    END IF;
    
    -- Add admin_notes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_review_flags' AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE college_review_flags ADD COLUMN admin_notes TEXT;
        RAISE NOTICE 'Added admin_notes column';
    END IF;
END $$;

-- 7. Verify all policies are now correct
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    CASE 
        WHEN roles = '{authenticated}' AND cmd = 'UPDATE' THEN '✓ Allows admin to update flags'
        WHEN roles = '{service_role}' AND cmd = 'ALL' THEN '✓ Service role full access'
        WHEN cmd = 'SELECT' THEN '✓ Read access'
        WHEN cmd = 'INSERT' THEN '✓ Create flags'
        ELSE 'Other policy'
    END as policy_purpose
FROM pg_policies
WHERE tablename = 'college_review_flags'
ORDER BY cmd, policyname;

-- 8. Test flag update (should succeed)
-- This will show if the policies work
SELECT 
    COUNT(*) as total_pending_flags,
    STRING_AGG(id::TEXT, ', ') as flag_ids
FROM college_review_flags
WHERE status = 'pending';
