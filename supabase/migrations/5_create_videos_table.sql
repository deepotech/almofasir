-- ============================================================
-- 5. Videos Table Migration
-- File: supabase/migrations/5_create_videos_table.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.videos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT UNIQUE NOT NULL,
  tiktok_url        TEXT NOT NULL,
  tiktok_video_id   TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  thumbnail_url     TEXT,
  author_name       TEXT,
  author_username   TEXT,
  embed_html        TEXT,
  duration          TEXT,
  published_at      TIMESTAMPTZ DEFAULT NOW(),
  is_published      BOOLEAN DEFAULT TRUE,
  category          TEXT NOT NULL DEFAULT 'تفسير الرموز',
  seo_title         TEXT,
  seo_description   TEXT,
  article_content   TEXT,
  takeaways         TEXT[] DEFAULT '{}',
  faq               JSONB DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_videos_slug ON public.videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_tiktok_id ON public.videos(tiktok_video_id);
CREATE INDEX IF NOT EXISTS idx_videos_published ON public.videos(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos(category);

-- Trigger for auto-updating updated_at if function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS trg_videos_updated_at ON public.videos;
    CREATE TRIGGER trg_videos_updated_at
      BEFORE UPDATE ON public.videos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public videos readable" ON public.videos;
DROP POLICY IF EXISTS "No public write videos" ON public.videos;

-- Public can read published videos
CREATE POLICY "Public videos readable" ON public.videos
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- Deny public writes (writes must go through service role supabaseAdmin)
CREATE POLICY "No public write videos" ON public.videos
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
