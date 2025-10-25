-- Fix RLS policies for professors table to allow authenticated users to insert
-- This fixes the 500 error when adding new professors

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "professors_authenticated_insert" ON professors;
DROP POLICY IF EXISTS "professors_insert_authenticated" ON professors;

-- Allow authenticated users to insert new professors
CREATE POLICY "professors_authenticated_insert"
ON professors FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure authenticated users can still read all professors
DROP POLICY IF EXISTS "professors_public_read" ON professors;
CREATE POLICY "professors_public_read"
ON professors FOR SELECT
TO PUBLIC
USING (true);

-- Allow service role full access
DROP POLICY IF EXISTS "professors_service_role_all" ON professors;
CREATE POLICY "professors_service_role_all"
ON professors FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
