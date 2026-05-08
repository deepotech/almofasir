-- ============================================================
-- Almofasser — Full Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid    TEXT UNIQUE NOT NULL,
  email           TEXT NOT NULL,
  display_name    TEXT,
  credits         INTEGER NOT NULL DEFAULT 0,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','premium')),
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','interpreter')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active','inactive','canceled')),
  subscription_end_date TIMESTAMPTZ,
  last_free_dream_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- 2. dreams
-- ============================================================
CREATE TABLE IF NOT EXISTS dreams (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT,
  title                   TEXT,
  content                 TEXT NOT NULL,
  date                    TIMESTAMPTZ DEFAULT NOW(),
  mood                    TEXT DEFAULT 'neutral' CHECK (mood IN ('happy','sad','anxious','confused','neutral')),
  social_status           TEXT CHECK (social_status IN ('single','married','divorced','widowed')),
  dominant_feeling        TEXT,
  age_range               TEXT CHECK (age_range IN ('child','teen','adult','elderly')),
  gender                  TEXT CHECK (gender IN ('male','female')),
  emotions                TEXT[],
  keywords                TEXT[],
  sentiment               TEXT,
  is_recurring            BOOLEAN DEFAULT FALSE,
  interpreter             TEXT,
  tags                    TEXT[],
  interpretation          JSONB,
  user_feedback           JSONB,
  rating                  INTEGER CHECK (rating BETWEEN 1 AND 5),
  rating_feedback         TEXT,
  rated_at                TIMESTAMPTZ,
  is_public               BOOLEAN DEFAULT FALSE,
  visibility_status       TEXT NOT NULL DEFAULT 'private' CHECK (visibility_status IN ('private','pending_public','public')),
  public_version          JSONB,
  seo_slug                TEXT UNIQUE,
  previous_slugs          TEXT[],
  status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','reviewed')),
  request_human_review    BOOLEAN DEFAULT FALSE,
  human_review_status     TEXT NOT NULL DEFAULT 'none' CHECK (human_review_status IN ('none','pending','completed')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dreams_user_id         ON dreams(user_id);
CREATE INDEX IF NOT EXISTS idx_dreams_seo_slug        ON dreams(seo_slug);
CREATE INDEX IF NOT EXISTS idx_dreams_visibility      ON dreams(visibility_status);
CREATE INDEX IF NOT EXISTS idx_dreams_previous_slugs  ON dreams USING GIN(previous_slugs);
CREATE INDEX IF NOT EXISTS idx_dreams_is_public       ON dreams(is_public);

-- ============================================================
-- 3. symbols
-- ============================================================
CREATE TABLE IF NOT EXISTS symbols (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT UNIQUE NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  category        TEXT NOT NULL,
  icon            TEXT DEFAULT '💭',
  aliases         TEXT[],
  interpretations JSONB,
  variations      JSONB,
  related_symbols TEXT[],
  view_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_symbols_slug ON symbols(slug);

-- ============================================================
-- 4. page_metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS page_metrics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,
  views        INTEGER NOT NULL DEFAULT 0,
  likes        INTEGER NOT NULL DEFAULT 0,
  dislikes     INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_metrics_slug ON page_metrics(slug);

-- ============================================================
-- 5. programmatic_pages
-- ============================================================
CREATE TABLE IF NOT EXISTS programmatic_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_slug  TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  symbol_ref    TEXT,
  generated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_programmatic_pages_slug ON programmatic_pages(keyword_slug);

-- ============================================================
-- 6. interpreters
-- ============================================================
CREATE TABLE IF NOT EXISTS interpreters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT UNIQUE NOT NULL,
  email               TEXT NOT NULL,
  display_name        TEXT NOT NULL,
  avatar              TEXT,
  bio                 TEXT NOT NULL,
  interpretation_type TEXT NOT NULL DEFAULT 'religious' CHECK (interpretation_type IN ('religious','psychological','symbolic','mixed')),
  price               NUMERIC(10,2) NOT NULL DEFAULT 10,
  currency            TEXT DEFAULT 'USD',
  response_time       INTEGER NOT NULL DEFAULT 24,
  pricing_note        TEXT,
  last_price_update   TIMESTAMPTZ,
  rating              NUMERIC(3,2) DEFAULT 0,
  total_ratings       INTEGER DEFAULT 0,
  total_dreams        INTEGER DEFAULT 0,
  completed_dreams    INTEGER DEFAULT 0,
  earnings            NUMERIC(12,2) DEFAULT 0,
  pending_earnings    NUMERIC(12,2) DEFAULT 0,
  is_active           BOOLEAN DEFAULT TRUE,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','pending')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interpreters_user_id ON interpreters(user_id);
CREATE INDEX IF NOT EXISTS idx_interpreters_status  ON interpreters(status);

-- ============================================================
-- 7. interpreter_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS interpreter_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name               TEXT NOT NULL,
  email                   TEXT NOT NULL,
  phone                   TEXT DEFAULT '',
  country                 TEXT NOT NULL,
  experience_years        INTEGER NOT NULL,
  interpretation_type     TEXT NOT NULL CHECK (interpretation_type IN ('religious','psychological','symbolic','mixed')),
  bio                     TEXT NOT NULL,
  sample_interpretation   TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interpreter_requests_email  ON interpreter_requests(email);
CREATE INDEX IF NOT EXISTS idx_interpreter_requests_status ON interpreter_requests(status);

-- ============================================================
-- 8. dream_requests (orders)
-- ============================================================
CREATE TABLE IF NOT EXISTS dream_requests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                     TEXT NOT NULL DEFAULT 'HUMAN' CHECK (type IN ('HUMAN','AI')),
  user_id                  TEXT NOT NULL,
  user_email               TEXT,
  interpreter_id           TEXT,
  interpreter_user_id      TEXT,
  interpreter_name         TEXT,
  booking_id               TEXT,
  dream_text               TEXT NOT NULL,
  dream_hash               TEXT NOT NULL,
  context                  JSONB,
  interpretation_text      TEXT,
  price                    NUMERIC(10,2) DEFAULT 0,
  locked_price             NUMERIC(10,2) DEFAULT 0,
  currency                 TEXT DEFAULT 'USD',
  status                   TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','assigned','in_progress','completed','cancelled')),
  clarification_question   TEXT,
  clarification_answer     TEXT,
  clarification_requested_at TIMESTAMPTZ,
  clarification_answered_at  TIMESTAMPTZ,
  payment_status           TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','released','refunded')),
  payment_locked_amount    NUMERIC(10,2) DEFAULT 0,
  platform_commission      NUMERIC(10,2) DEFAULT 0,
  interpreter_earning      NUMERIC(10,2) DEFAULT 0,
  payment_id               TEXT,
  idempotency_key          TEXT UNIQUE,
  assigned_at              TIMESTAMPTZ,
  started_at               TIMESTAMPTZ,
  accepted_at              TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  cancelled_at             TIMESTAMPTZ,
  rating                   INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback                 TEXT,
  rated_at                 TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dream_requests_user_id          ON dream_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_requests_interpreter_id   ON dream_requests(interpreter_id);
CREATE INDEX IF NOT EXISTS idx_dream_requests_status           ON dream_requests(status);
CREATE INDEX IF NOT EXISTS idx_dream_requests_payment_status   ON dream_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_dream_requests_dream_hash       ON dream_requests(dream_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dream_requests_user_hash ON dream_requests(user_id, dream_hash);

-- ============================================================
-- 9. bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT,
  user_email       TEXT NOT NULL,
  interpreter_name TEXT NOT NULL,
  interpreter_id   TEXT,
  date             TEXT NOT NULL,
  time_slot        TEXT NOT NULL,
  client_name      TEXT NOT NULL,
  client_phone     TEXT NOT NULL,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  payment_status   TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid','unpaid','refunded')),
  amount           NUMERIC(10,2) NOT NULL,
  currency         TEXT DEFAULT 'USD',
  dream_id         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Prevent double booking: same interpreter + date + time_slot (for non-cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_slot
  ON bookings(interpreter_id, date, time_slot)
  WHERE status != 'cancelled';

-- ============================================================
-- 10. transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  currency     TEXT DEFAULT 'USD',
  type         TEXT NOT NULL CHECK (type IN ('earning','withdrawal','refund','commission')),
  status       TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed')),
  description  TEXT NOT NULL,
  reference_id TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id      ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type_status  ON transactions(user_id, type, status);

-- ============================================================
-- 11. notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'info',
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================================
-- 12. audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  TEXT NOT NULL,
  admin_email    TEXT NOT NULL,
  action         TEXT NOT NULL CHECK (action IN ('approve_interpreter','suspend_interpreter','reactivate_interpreter','refund_order','reassign_order','edit_price','update_settings','login')),
  target_type    TEXT NOT NULL CHECK (target_type IN ('interpreter','order','user','settings','system')),
  target_id      TEXT NOT NULL,
  details        JSONB,
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin    ON audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target   ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action   ON audit_logs(action);

-- ============================================================
-- 13. platform_settings (singleton row)
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_rate             NUMERIC(5,4) NOT NULL DEFAULT 0.30,
  ai_price_single             NUMERIC(10,2) NOT NULL DEFAULT 2.99,
  ai_price_monthly            NUMERIC(10,2) NOT NULL DEFAULT 9.99,
  human_min_price             NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  human_max_price             NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  max_response_time_hours     INTEGER NOT NULL DEFAULT 48,
  stuck_order_threshold_hours INTEGER NOT NULL DEFAULT 24,
  notification_templates      JSONB DEFAULT '{}',
  maintenance_mode            BOOLEAN DEFAULT FALSE,
  maintenance_message         TEXT,
  updated_by                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row if table is empty
INSERT INTO platform_settings (id)
  SELECT gen_random_uuid()
  WHERE NOT EXISTS (SELECT 1 FROM platform_settings)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Auto-update updated_at via trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','dreams','symbols','page_metrics','programmatic_pages',
    'interpreters','interpreter_requests','dream_requests','bookings',
    'transactions','notifications','platform_settings'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl
    );
  END LOOP;
END $$;
