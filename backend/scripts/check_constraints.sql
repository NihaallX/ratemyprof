-- Check for table-level CHECK constraints (not RLS)
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.reviews'::regclass
    AND contype = 'c';  -- 'c' = CHECK constraint

-- Also check if there's a default RLS policy we're missing
SELECT 
    *
FROM pg_policy 
WHERE polrelid = 'public.reviews'::regclass;
