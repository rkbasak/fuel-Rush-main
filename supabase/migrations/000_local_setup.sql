-- Fuel Rush — Local PostgreSQL Setup
-- Migration: 000_local_setup
--
-- This file contains the complete schema for running Fuel Rush with a local
-- PostgreSQL database instead of Supabase Cloud.
--
-- ─── How to run locally ───────────────────────────────────────────────────────
--
-- Option A: Using Docker Compose (recommended)
--   docker compose -f docker-compose.yml -f docker-compose.local.yml up -d postgres
--   docker compose -f docker-compose.yml -f docker-compose.local.yml exec postgres \
--     psql -U fuelrush -d fuelrush -f /docker-entrypoint-initdb.d/000_local_setup.sql
--
-- Option B: Using psql directly
--   psql -U postgres -c "CREATE DATABASE fuelrush;"
--   psql -U postgres -d fuelrush -f supabase/migrations/000_local_setup.sql
--
-- Option C: Using Supabase CLI (if you have supabase installed)
--   supabase db reset
--   (then run this file against your local Postgres)
--
-- ─── Notes ────────────────────────────────────────────────────────────────────
--
-- 1. Auth is disabled in local mode — you need to implement your own auth
--    (e.g., NextAuth.js, Auth.js, or a custom JWT solution).
--    The `auth.users` table and `handle_new_user()` trigger are NOT created here.
--
-- 2. Row Level Security (RLS) policies reference `auth.uid()` which won't work
--    without Supabase Auth. Either:
--    - Disable RLS: ALTER TABLE public.users DISABLE ROW LEVEL SECURITY; (and same for other tables)
--    - Or implement a custom auth layer that sets current_setting('app.current_user_id')
--
-- 3. For development, you may want to add a test user manually:
--    INSERT INTO public.users (id, display_name, trust_score)
--    VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'Test User', 75);
--
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (extends auth.users in Supabase, standalone for local)
-- Note: In local mode without Supabase Auth, this is a standalone table.
-- If you add Supabase Auth later, you can add: REFERENCES auth.users(id) ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT,
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fuel stations table
CREATE TABLE IF NOT EXISTS public.stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat FLOAT8 NOT NULL,
  lng FLOAT8 NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('available', 'low', 'queue', 'empty', 'unknown')),
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  last_reported_at TIMESTAMPTZ,
  last_reporter_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('available', 'low', 'queue', 'empty')),
  photo_url TEXT,
  wait_minutes INTEGER CHECK (wait_minutes >= 0 AND wait_minutes <= 300),
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('motorcycle', 'sedan', 'suv', 'commercial')),
  plate_number TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ration logs table
CREATE TABLE IF NOT EXISTS public.ration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  amount_liters FLOAT NOT NULL CHECK (amount_liters > 0 AND amount_liters <= 100),
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Community Engine Tables ─────────────────────────────────────────────────
-- From: 002_community_engine.sql

-- Vote types for community moderation
CREATE TYPE vote_type AS ENUM ('upvote', 'downvote');

-- Community votes on reports
CREATE TABLE IF NOT EXISTS public.report_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote vote_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

-- Community badges/achievements
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badge assignments
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ─── AI Rationing Tables ──────────────────────────────────────────────────────
-- From: 002_phase34_ai_rationing.sql

-- Ration quotas per vehicle type
CREATE TABLE IF NOT EXISTS public.ration_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_type TEXT NOT NULL UNIQUE CHECK (vehicle_type IN ('motorcycle', 'sedan', 'suv', 'commercial')),
  daily_limit_liters FLOAT NOT NULL DEFAULT 10.0,
  weekly_limit_liters FLOAT,
  monthly_limit_liters FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI model config
CREATE TABLE IF NOT EXISTS public.ai_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  confidence_threshold INTEGER NOT NULL DEFAULT 70,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Notifications Tables ─────────────────────────────────────────────────────
-- From: 003_notifications.sql

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Motorcycle Limit Enforcement ────────────────────────────────────────────
-- From: 004_motorcycle_limit_enforcement.sql

CREATE TABLE IF NOT EXISTS public.motorcycle_daily_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_liters FLOAT NOT NULL DEFAULT 0,
  refill_count INTEGER NOT NULL DEFAULT 0,
  last_refill_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, date)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_stations_status ON public.stations(status);
CREATE INDEX IF NOT EXISTS idx_stations_location ON public.stations(lat, lng);
CREATE INDEX IF NOT EXISTS idx_reports_station ON public.reports(station_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_user ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_ration_logs_user_date ON public.ration_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_ration_logs_vehicle ON public.ration_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_report_votes_report ON public.report_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- ─── Row Level Security (DISABLED for local dev by default) ─────────────────
-- Uncomment the following lines to enable RLS in local mode:

-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ration_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.report_votes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ration_quotas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.motorcycle_daily_limits ENABLE ROW LEVEL SECURITY;

-- ─── Default Policies (permissive for local dev) ─────────────────────────────
-- These policies allow all operations — tighten them for production

-- CREATE POLICY "Allow all users read" ON public.users FOR SELECT USING (true);
-- CREATE POLICY "Allow all users insert" ON public.users FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow all users update" ON public.users FOR UPDATE USING (true);

-- CREATE POLICY "Allow all stations read" ON public.stations FOR SELECT USING (true);
-- CREATE POLICY "Allow all stations insert" ON public.stations FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow all stations update" ON public.stations FOR UPDATE USING (true);

-- CREATE POLICY "Allow all reports read" ON public.reports FOR SELECT USING (true);
-- CREATE POLICY "Allow all reports insert" ON public.reports FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Allow all vehicles read" ON public.vehicles FOR SELECT USING (true);
-- CREATE POLICY "Allow all vehicles insert" ON public.vehicles FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow all vehicles update" ON public.vehicles FOR UPDATE USING (true);
-- CREATE POLICY "Allow all vehicles delete" ON public.vehicles FOR DELETE USING (true);

-- CREATE POLICY "Allow all ration_logs read" ON public.ration_logs FOR SELECT USING (true);
-- CREATE POLICY "Allow all ration_logs insert" ON public.ration_logs FOR INSERT WITH CHECK (true);

-- ─── Updated at trigger function ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ration_quotas_updated_at BEFORE UPDATE ON public.ration_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_motorcycle_daily_limits_updated_at BEFORE UPDATE ON public.motorcycle_daily_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Seed Data (optional — for testing) ─────────────────────────────────────

-- Default ration quotas
INSERT INTO public.ration_quotas (vehicle_type, daily_limit_liters, weekly_limit_liters, monthly_limit_liters) VALUES
  ('motorcycle', 3.0, 15.0, 50.0),
  ('sedan', 8.0, 40.0, 150.0),
  ('suv', 12.0, 60.0, 200.0),
  ('commercial', 25.0, 150.0, 500.0)
ON CONFLICT (vehicle_type) DO NOTHING;

-- Default AI config
INSERT INTO public.ai_config (model_name, confidence_threshold, enabled) VALUES
  ('gemini-2.0-flash', 70, true)
ON CONFLICT DO NOTHING;

-- Default badges
INSERT INTO public.badges (name, description, icon) VALUES
  ('First Report', 'Submitted your first fuel station report', '📍'),
  ('Helper', 'Submitted 10 reports', '🤝'),
  ('Trusted', 'Reached trust score of 80', '⭐'),
  ('Ration Master', 'Logged 50 refuels', '⛽')
ON CONFLICT (name) DO NOTHING;

-- ─── Done! ────────────────────────────────────────────────────────────────────
--
-- Your local PostgreSQL database is now set up with all Fuel Rush tables.
-- The database will persist in the `pgdata` Docker volume.
--
-- Next steps:
-- 1. Start the app: docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
-- 2. Visit http://localhost:8080
-- 3. Create a test user manually or via your auth implementation
