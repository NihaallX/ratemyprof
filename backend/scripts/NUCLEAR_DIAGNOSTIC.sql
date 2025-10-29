-- ===================================================================
-- NUCLEAR DIAGNOSTIC: Check EVERYTHING that could block INSERT
-- ===================================================================

-- 1. Is RLS actually enabled?
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '⚠️ RLS IS ENABLED'
        ELSE 'ℹ️ RLS is disabled'
    END as status
FROM pg_tables
WHERE tablename = 'reviews';

-- 2. Check ALL policies (look for restrictive ones)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles::text,
    cmd,
    qual as using_expr,
    with_check,
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✅ PERMISSIVE (OR logic)'
        ELSE '❌ RESTRICTIVE (AND logic - BLOCKS!)'
    END as policy_mode
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY 
    CASE WHEN permissive = 'RESTRICTIVE' THEN 1 ELSE 2 END,  -- Restrictive first
    cmd;

-- 3. Check for triggers that might interfere
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'reviews';

-- 4. Check table ownership and grants
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'reviews'
    AND privilege_type = 'INSERT';

-- 5. Test: Can we insert as postgres role? (This bypasses RLS)
-- If this works, RLS is definitely the problem
-- SELECT current_user, current_role;
