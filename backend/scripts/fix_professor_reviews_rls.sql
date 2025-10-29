-- ===================================================================
-- FIX PROFESSOR REVIEWS RLS + RE-REVIEW FUNCTIONALITY
-- ===================================================================
-- Run this script in Supabase SQL Editor
-- ===================================================================

-- PART 1: FIX REVIEWS TABLE RLS INSERT POLICY
-- ===================================================================

-- Drop all restrictive INSERT policies
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users create reviews" ON reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON reviews;
DROP POLICY IF EXISTS "Users create own reviews" ON reviews;

-- Create permissive INSERT policy
CREATE POLICY "Authenticated users can insert reviews" ON reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Ensure service role has full access
DROP POLICY IF EXISTS "Service role has full access" ON reviews;
CREATE POLICY "Service role has full access" ON reviews
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- PART 2: ADD SOFT DELETE FUNCTIONALITY
-- ===================================================================

-- Add soft delete columns
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_deleted_at ON reviews(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN reviews.deleted_at IS 'Soft delete timestamp - allows users to re-review after admin deletion';


-- PART 3: UPDATE SELECT POLICY TO EXCLUDE DELETED REVIEWS
-- ===================================================================

-- Drop old SELECT policies
DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Anonymous can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Public views approved reviews" ON reviews;
DROP POLICY IF EXISTS "Public views approved non-deleted reviews" ON reviews;

-- Create new SELECT policy (excludes deleted)
CREATE POLICY "Public views approved non-deleted reviews" ON reviews
    FOR SELECT
    USING (status = 'approved' AND deleted_at IS NULL);

-- Service role sees everything
DROP POLICY IF EXISTS "Service role sees all reviews" ON reviews;
CREATE POLICY "Service role sees all reviews" ON reviews
    FOR SELECT
    TO service_role
    USING (true);


-- PART 4: VERIFY POLICIES
-- ===================================================================

SELECT 
    'REVIEWS POLICIES' as table_name,
    policyname,
    cmd,
    roles,
    CASE 
        WHEN cmd = 'INSERT' AND roles = '{authenticated}' THEN '✅ INSERT fixed'
        WHEN cmd = 'SELECT' AND qual LIKE '%deleted_at IS NULL%' THEN '✅ Excludes deleted'
        WHEN roles = '{service_role}' THEN '✅ Service role access'
        ELSE 'ℹ️ Other policy'
    END as status
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY cmd, policyname;
