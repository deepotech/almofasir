-- ============================================================
-- 2. Revoke and Grant Permissions (Hardening)
-- File: supabase/migrations/2_revoke_and_grant.sql
-- ============================================================

-- Revoke all default access from anon and authenticated on all tables in public schema
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Selectively grant only SELECT (Read-only) privileges on public tables
GRANT SELECT ON public.dreams TO anon, authenticated;
GRANT SELECT ON public.symbols TO anon, authenticated;
GRANT SELECT ON public.interpreters TO anon, authenticated;
GRANT SELECT ON public.programmatic_pages TO anon, authenticated;
GRANT SELECT ON public.page_metrics TO anon, authenticated;

-- Grant select on tenant lookup tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'City') THEN
    EXECUTE 'GRANT SELECT ON public."City" TO anon, authenticated;';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Category') THEN
    EXECUTE 'GRANT SELECT ON public."Category" TO anon, authenticated;';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Business') THEN
    EXECUTE 'GRANT SELECT ON public."Business" TO anon, authenticated;';
  END IF;
END $$;
