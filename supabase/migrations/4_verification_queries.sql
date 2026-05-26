-- ============================================================
-- 4. Verification and Audit Queries
-- File: supabase/migrations/4_verification_queries.sql
-- ============================================================

-- Query 1: Verify RLS status for all tables in the 'public' schema
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename;

-- Query 2: List all Row Level Security policies defined in the public schema
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd AS operation,
    qual AS using_expression
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename, 
    policyname;

-- Query 3: Check grants for anon and authenticated on public tables
SELECT 
    grantee, 
    table_name, 
    privilege_type
FROM 
    information_schema.role_table_grants 
WHERE 
    table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated')
ORDER BY 
    table_name, 
    grantee;
