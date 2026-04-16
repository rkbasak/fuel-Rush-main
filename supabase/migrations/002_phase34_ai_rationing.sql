-- Migration: 002_phase34_ai_rationing
-- Fuel Rush Phase 3 (AI Layer) + Phase 4 (Rationing System) Schema Changes

-- ── 1. Adjust trust score RPC (for fraud detection) ─────────────────────────
CREATE OR REPLACE FUNCTION public.adjust_trust_score(p_user_id UUID, p_delta INTEGER)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_score INTEGER;
BEGIN
  UPDATE public.users SET trust_score = GREATEST(0, LEAST(100, trust_score + p_delta)) WHERE id = p_user_id RETURNING trust_score INTO new_score;
  RETURN COALESCE(new_score, 50);
END;
$$;

-- ── 2. Get station confidence info (for AI layer) ────────────────────────────
CREATE OR REPLACE FUNCTION public.get_station_confidence(p_station_id UUID)
RETURNS TABLE (status TEXT, confirmations INTEGER, total_reports INTEGER, contradictory_reports INTEGER, last_reported_at TIMESTAMPTZ, avg_trust_score NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY WITH recent_reports AS (
    SELECT r.status, r.user_id, r.created_at, u.trust_score FROM public.reports r LEFT JOIN public.users u ON u.id = r.user_id WHERE r.station_id = p_station_id AND r.created_at > NOW() - INTERVAL '2 hours'
  ), status_counts AS (SELECT status, COUNT(*) as cnt FROM recent_reports GROUP BY status),
  dominant_status AS (SELECT status FROM status_counts ORDER BY cnt DESC LIMIT 1),
  total AS (SELECT COUNT(*) as total_cnt FROM recent_reports),
  contradictions AS (
    SELECT COUNT(*) as contrad FROM recent_reports r1 JOIN recent_reports r2 ON r1.user_id != r2.user_id
      AND ABS(EXTRACT(EPOCH FROM (r1.created_at - r2.created_at))) < 1800 AND r1.status != r2.status WHERE r1.station_id = p_station_id
  )
  SELECT ds.status::TEXT, COALESCE((SELECT cnt FROM status_counts WHERE status = ds.status), 0)::INTEGER, COALESCE(t.total_cnt, 0)::INTEGER, COALESCE(c.contrad, 0)::INTEGER, (SELECT MAX(created_at) FROM recent_reports)::TIMESTAMPTZ, COALESCE((SELECT AVG(trust_score) FROM recent_reports), 50)::NUMERIC FROM dominant_status ds, total t, contrad c;
END;
$$;

-- ── 3. Ration summary RPC ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_ration_summary(p_user_id UUID, p_vehicle_id UUID)
RETURNS TABLE (total_used NUMERIC, visits_today INTEGER, limit_liters NUMERIC, remaining_liters NUMERIC, bst_date DATE)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY WITH today_logs AS (
    SELECT amount_liters FROM public.ration_logs WHERE user_id = p_user_id AND vehicle_id = p_vehicle_id
      AND logged_at >= (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE AND logged_at < (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE + INTERVAL '1 day'
  ), vehicle_info AS (SELECT type FROM public.vehicles WHERE id = p_vehicle_id),
  vehicle_limits AS (SELECT CASE v.type WHEN 'motorcycle' THEN 2 WHEN 'sedan' THEN 10 WHEN 'suv' THEN 20 WHEN 'commercial' THEN 999999 ELSE 10 END as daily_limit FROM vehicle_info v)
  SELECT COALESCE(SUM(t.amount_liters), 0)::NUMERIC, COUNT(t.*)::INTEGER, vl.daily_limit::NUMERIC, GREATEST(0, vl.daily_limit - COALESCE(SUM(t.amount_liters), 0))::NUMERIC, (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE FROM today_logs t, vehicle_limits vl;
END;
$$;

-- ── 4. Get user trust score RPC ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_trust_score(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN COALESCE((SELECT trust_score FROM public.users WHERE id = p_user_id), 50); END;
$$;

-- ── 5. Reports cleanup retention policy ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_old_reports(p_retention_days INTEGER DEFAULT 7)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE deleted_count INTEGER;
BEGIN DELETE FROM public.reports WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL; GET DIAGNOSTICS deleted_count = ROW_COUNT; RETURN deleted_count; END;
$$;

-- ── 6. Indexes for efficient queries ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ration_logs_bst_date ON public.ration_logs (user_id, logged_at DESC) WHERE logged_at >= (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE;
CREATE INDEX IF NOT EXISTS idx_reports_user_station_recent ON public.reports (user_id, station_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '24 hours';

-- ── 7. pg_cron extension & midnight reset job (UTC 18:00 = 00:00 BST) ────────
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'pg_cron extension not available';
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.delete_job('fuel-rush-midnight-reset');
    PERFORM cron.schedule('fuel-rush-midnight-reset', '0 18 * * *', $$ SELECT public.cleanup_old_reports(7); $$);
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Could not schedule pg_cron job: %', SQLERRM;
END;
$$;

-- ── Grants ───────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.adjust_trust_score TO service_role;
GRANT EXECUTE ON FUNCTION public.get_station_confidence TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ration_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_trust_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_reports TO service_role;
