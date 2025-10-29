-- ===================================================================
-- CHECK EXACT INSERT POLICY DETAILS
-- ===================================================================

-- Show the exact INSERT policy with all details
SELECT 
    pol.polname as policy_name,
    pol.polroles::regrole[] as applies_to_roles,
    CASE 
        WHEN pol.polpermissive THEN 'PERMISSIVE (OR logic)'
        ELSE 'RESTRICTIVE (AND logic)'
    END as policy_type,
    COALESCE(pg_get_expr(pol.polqual, pol.polrelid), 'NONE') as using_expression,
    COALESCE(pg_get_expr(pol.polwithcheck, pol.polrelid), 'NONE') as with_check_expression
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'reviews' 
    AND pol.polcmd = 'a';  -- 'a' = INSERT

-- Check what the WITH CHECK is actually checking
-- If it's not 'true', it might be blocking
SELECT 
    pol.polname,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as check_clause,
    CASE 
        WHEN pg_get_expr(pol.polwithcheck, pol.polrelid) = 'true' 
        THEN '✅ Allows all inserts'
        ELSE '❌ Has conditions - might be blocking!'
    END as analysis
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
WHERE cls.relname = 'reviews' 
    AND pol.polcmd = 'a';

-- Check if there are ANY policies that could affect authenticated role
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN 'authenticated' = ANY(roles::text[]) THEN '✅ Applies to authenticated'
        WHEN 'public' = ANY(roles::text[]) THEN 'ℹ️ Applies to public'
        ELSE '⚠️ Other role: ' || roles::text
    END as role_check,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY cmd, policyname;
