-- Migration: 006_station_votes
-- Adds station_votes table for vote tracking and duplicate prevention

-- Station votes table: one vote per user per station (upsert)
CREATE TABLE IF NOT EXISTS public.station_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (station_id, user_id)
);

-- Index for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_station_votes_station_user
  ON public.station_votes(station_id, user_id);

-- Index for per-user vote queries
CREATE INDEX IF NOT EXISTS idx_station_votes_user
  ON public.station_votes(user_id);

-- RLS: users can only manage their own votes
ALTER TABLE public.station_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own votes"
  ON public.station_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.station_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read station votes"
  ON public.station_votes FOR SELECT
  USING (true);
