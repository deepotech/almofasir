-- ============================================================
-- 1. Enable Row Level Security (RLS)
-- File: supabase/migrations/1_enable_rls.sql
-- ============================================================

-- Core system tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.page_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.programmatic_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interpreters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interpreter_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dream_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Additional tenant tables (if present in the DB)
ALTER TABLE IF EXISTS public."City" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Business" ENABLE ROW LEVEL SECURITY;
