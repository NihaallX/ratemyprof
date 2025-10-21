-- QUICK FIX: Disable RLS for public read tables
-- Run this in Supabase SQL Editor

-- Disable RLS on public tables (everyone should see these)
ALTER TABLE colleges DISABLE ROW LEVEL SECURITY;
ALTER TABLE professors DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on sensitive tables
-- (uncomment if you want to keep RLS on these)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('colleges', 'professors', 'reviews')
ORDER BY tablename;
