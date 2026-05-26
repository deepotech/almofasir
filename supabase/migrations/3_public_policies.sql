-- ============================================================
-- 3. Public Read RLS Policies
-- File: supabase/migrations/3_public_policies.sql
-- ============================================================

-- Drop policies if they already exist
DROP POLICY IF EXISTS "Public dreams readable" ON public.dreams;
DROP POLICY IF EXISTS "No public insert dreams" ON public.dreams;
DROP POLICY IF EXISTS "No public update dreams" ON public.dreams;
DROP POLICY IF EXISTS "No public delete dreams" ON public.dreams;

DROP POLICY IF EXISTS "Public symbols readable" ON public.symbols;
DROP POLICY IF EXISTS "No public write symbols" ON public.symbols;

DROP POLICY IF EXISTS "Public interpreters readable" ON public.interpreters;
DROP POLICY IF EXISTS "No public write interpreters" ON public.interpreters;

DROP POLICY IF EXISTS "Public programmatic_pages readable" ON public.programmatic_pages;
DROP POLICY IF EXISTS "No public write programmatic_pages" ON public.programmatic_pages;

DROP POLICY IF EXISTS "Public page_metrics readable" ON public.page_metrics;
DROP POLICY IF EXISTS "No public write page_metrics" ON public.page_metrics;

-- ============================================================
-- 1. dreams (Conditional SELECT access: public SEO dreams only)
-- ============================================================
CREATE POLICY "Public dreams readable" ON public.dreams
  FOR SELECT TO anon, authenticated
  USING (is_public = true AND visibility_status = 'public');

-- Explicit Write Denials for dreams
CREATE POLICY "No public insert dreams" ON public.dreams 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (false);

CREATE POLICY "No public update dreams" ON public.dreams 
  FOR UPDATE TO anon, authenticated 
  USING (false);

CREATE POLICY "No public delete dreams" ON public.dreams 
  FOR DELETE TO anon, authenticated 
  USING (false);

-- ============================================================
-- 2. symbols
-- ============================================================
CREATE POLICY "Public symbols readable" ON public.symbols
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "No public write symbols" ON public.symbols 
  FOR ALL TO anon, authenticated 
  USING (false) 
  WITH CHECK (false);

-- ============================================================
-- 3. interpreters
-- ============================================================
CREATE POLICY "Public interpreters readable" ON public.interpreters
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "No public write interpreters" ON public.interpreters 
  FOR ALL TO anon, authenticated 
  USING (false) 
  WITH CHECK (false);

-- ============================================================
-- 4. programmatic_pages
-- ============================================================
CREATE POLICY "Public programmatic_pages readable" ON public.programmatic_pages
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "No public write programmatic_pages" ON public.programmatic_pages 
  FOR ALL TO anon, authenticated 
  USING (false) 
  WITH CHECK (false);

-- ============================================================
-- 5. page_metrics
-- ============================================================
CREATE POLICY "Public page_metrics readable" ON public.page_metrics
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "No public write page_metrics" ON public.page_metrics 
  FOR ALL TO anon, authenticated 
  USING (false) 
  WITH CHECK (false);

-- ============================================================
-- Additional lookup tables (City, Category, Business) if they exist
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'City') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public City readable" ON public."City";';
    EXECUTE 'DROP POLICY IF EXISTS "No public write City" ON public."City";';
    EXECUTE 'CREATE POLICY "Public City readable" ON public."City" FOR SELECT TO anon, authenticated USING (true);';
    EXECUTE 'CREATE POLICY "No public write City" ON public."City" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Category') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public Category readable" ON public."Category";';
    EXECUTE 'DROP POLICY IF EXISTS "No public write Category" ON public."Category";';
    EXECUTE 'CREATE POLICY "Public Category readable" ON public."Category" FOR SELECT TO anon, authenticated USING (true);';
    EXECUTE 'CREATE POLICY "No public write Category" ON public."Category" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Business') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public Business readable" ON public."Business";';
    EXECUTE 'DROP POLICY IF EXISTS "No public write Business" ON public."Business";';
    EXECUTE 'CREATE POLICY "Public Business readable" ON public."Business" FOR SELECT TO anon, authenticated USING (true);';
    EXECUTE 'CREATE POLICY "No public write Business" ON public."Business" FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);';
  END IF;
END $$;
