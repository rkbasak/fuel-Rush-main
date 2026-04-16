-- Phase 2: Community Engine Database Schema
-- Migration: 002_community_engine

-- Report votes table (upvote/downvote on community reports)
CREATE TABLE IF NOT EXISTS public.report_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id) -- One vote per user per report
);

-- Station confirmations table ("Confirm Fuel" button)
CREATE TABLE IF NOT EXISTS public.station_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  confirmed_status TEXT NOT NULL CHECK (confirmed_status IN ('available', 'low', 'queue', 'empty')),
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(station_id, user_id) -- One confirmation per user per station per day
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_report_votes_report ON public.report_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_votes_user ON public.report_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_station ON public.station_confirmations(station_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_user ON public.station_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_date ON public.station_confirmations(confirmed_at DESC);

-- RLS for new tables
ALTER TABLE public.report_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_confirmations ENABLE ROW LEVEL SECURITY;

-- Report votes: anyone can read, authenticated users can vote on others' reports
CREATE POLICY "Votes are viewable by everyone" ON public.report_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.report_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.report_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.report_votes FOR DELETE USING (auth.uid() = user_id);

-- Station confirmations: anyone can read, authenticated users can confirm
CREATE POLICY "Confirmations are viewable by everyone" ON public.station_confirmations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can confirm" ON public.station_confirmations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own confirmations" ON public.station_confirmations FOR DELETE USING (auth.uid() = user_id);

-- RPC function to adjust trust score (prevents negative values)
CREATE OR REPLACE FUNCTION public.adjust_trust_score(user_id UUID, delta INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_score INTEGER;
BEGIN
  UPDATE public.users
  SET trust_score = GREATEST(0, LEAST(100, trust_score + delta))
  WHERE id = user_id
  RETURNING trust_score INTO new_score;

  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to clean up old confirmations (keep only last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_confirmations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.station_confirmations
  WHERE confirmed_at < NOW() - INTERVAL '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER cleanup_confirmations_trigger
AFTER INSERT ON public.station_confirmations
FOR EACH STATEMENT EXECUTE FUNCTION cleanup_old_confirmations();

-- Add confidence_boost column to station_confirmations for tracking
ALTER TABLE public.station_confirmations ADD COLUMN IF NOT EXISTS confidence_boost INTEGER DEFAULT 5;
