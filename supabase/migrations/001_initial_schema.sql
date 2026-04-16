-- Fuel Rush Database Schema
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stations_status ON public.stations(status);
CREATE INDEX IF NOT EXISTS idx_stations_location ON public.stations(lat, lng);
CREATE INDEX IF NOT EXISTS idx_reports_station ON public.reports(station_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_user ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_ration_logs_user_date ON public.ration_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_ration_logs_vehicle ON public.ration_logs(vehicle_id);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ration_logs ENABLE ROW LEVEL SECURITY;

-- Users: users can read all, update only own
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Stations: anyone can read, authenticated users can insert
-- H2 Fix: Only last reporter or users with recent reports can update station status
CREATE POLICY "Stations are viewable by everyone" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create stations" ON public.stations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Restrict updates: only the last reporter can update (within 2 hours), or if no recent reporter
CREATE POLICY "Last reporter can update station status" ON public.stations FOR UPDATE USING (
  auth.uid() IS NOT NULL 
  AND (
    last_reporter_id = auth.uid()
    OR last_reporter_id IS NULL
    OR last_reported_at < NOW() - INTERVAL '2 hours'
  )
);

-- Reports: anyone can read, authenticated users can insert
CREATE POLICY "Reports are viewable by everyone" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vehicles: users can only see/modify own vehicles
CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- Ration logs: users can only see/modify own logs
CREATE POLICY "Users can view own ration logs" ON public.ration_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ration logs" ON public.ration_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
