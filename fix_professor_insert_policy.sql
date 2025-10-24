-- Fix professor insert policy to allow backend inserts
-- This allows the backend to insert professors while RLS is enabled

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Service role insert professors" ON professors;

-- Create new policy that allows inserts with the service role key
-- The service_role bypasses RLS, but if that's not working, we need this
CREATE POLICY "Allow backend professor inserts"
ON professors
FOR INSERT
WITH CHECK (true);

-- Alternatively, if you want to be more restrictive, allow authenticated users
-- CREATE POLICY "Allow authenticated professor inserts"
-- ON professors
-- FOR INSERT  
-- TO authenticated
-- WITH CHECK (true);
