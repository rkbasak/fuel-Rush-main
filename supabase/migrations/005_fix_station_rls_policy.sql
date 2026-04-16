-- Migration: 005_fix_station_rls_policy.sql
-- Fixes: Overly permissive station status update policy
-- Bug: The policy "Last reporter can update station status" used `auth.uid() IS NOT NULL OR last_reporter_id = auth.uid()`
--       which allowed ANY authenticated user to update ANY station's status.
-- Fix: Restrict to only the last reporter (or station owner).

-- Drop the broken policy
DROP POLICY IF EXISTS "Last reporter can update station status" ON public.stations;

-- Recreate with correct logic: only the last reporter can update station status
CREATE POLICY "Last reporter can update station status"
  ON public.stations
  FOR UPDATE
  USING (auth.uid() = last_reporter_id)
  WITH CHECK (auth.uid() = last_reporter_id);
