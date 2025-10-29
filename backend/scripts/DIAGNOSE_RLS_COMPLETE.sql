-- ===================================================================
-- COMPREHENSIVE RLS DIAGNOSTIC FOR REVIEWS TABLE
-- ===================================================================

-- 1. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '⚠️ RLS is ENABLED'
        ELSE '✅ RLS is DISABLED'
    END as status
FROM pg_tables
WHERE tablename = 'reviews';

-- 2. Check ALL policies (PERMISSIVE vs RESTRICTIVE)
SELECT 
    pol.polname as policy_name,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command,
    CASE 
        WHEN pol.polpermissive THEN '✅ PERMISSIVE (OR logic)'
        ELSE '❌ RESTRICTIVE (AND logic - BLOCKING!)'
    END as policy_type,
    pol.polroles::regrole[] as roles,
    pg_get_expr(pol.polqual, pol.polrelid) as using_clause,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'reviews'
ORDER BY 
    CASE pol.polcmd
        WHEN 'a' THEN 1  -- INSERT first
        WHEN 'r' THEN 2  -- SELECT second
        WHEN 'w' THEN 3  -- UPDATE third
        WHEN 'd' THEN 4  -- DELETE fourth
        WHEN '*' THEN 5  -- ALL last
    END,
    pol.polpermissive DESC;  -- RESTRICTIVE policies at top

-- 3. Check for conflicting policies on INSERT
SELECT 
    COUNT(*) as total_insert_policies,
    SUM(CASE WHEN pol.polpermissive THEN 1 ELSE 0 END) as permissive_count,
    SUM(CASE WHEN NOT pol.polpermissive THEN 1 ELSE 0 END) as restrictive_count,
    CASE 
        WHEN SUM(CASE WHEN NOT pol.polpermissive THEN 1 ELSE 0 END) > 0 
        THEN '❌ BLOCKING: Has RESTRICTIVE policies!'
        WHEN SUM(CASE WHEN pol.polpermissive THEN 1 ELSE 0 END) = 0
        THEN '❌ BLOCKING: No INSERT policies at all!'
        ELSE '✅ OK: Only PERMISSIVE policies'
    END as diagnosis
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'reviews' 
    AND pol.polcmd = 'a';  -- 'a' = INSERT

-- 4. Check table ownership and current role
SELECT 
    current_user as current_role,
    pg_catalog.has_table_privilege(current_user, 'reviews', 'INSERT') as can_insert,
    tableowner
FROM pg_tables
WHERE tablename = 'reviews';
