-- Migration: 003_notifications
-- Fuel Rush Phase 5: Notifications System

-- ── 1. Notifications table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fuel_nearby', 'confirm_request', 'ration_low', 'ration_reset', 'report_accepted')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Indexes for notifications ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_station_id ON public.notifications (station_id) WHERE station_id IS NOT NULL;

-- ── 3. FCM token column in users table ──────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- ── 4. User notification preferences ─────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"fuel_nearby": true, "confirm_request": true, "ration_low": true, "ration_reset": true, "report_accepted": true}';

-- ── 5. Notification RPC helpers ──────────────────────────────────────────────

-- Get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN COALESCE((SELECT COUNT(*) FROM public.notifications WHERE user_id = p_user_id AND read = FALSE), 0)::INTEGER;
END;
$$;

-- Mark all notifications as read for user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE updated_count INTEGER;
BEGIN
  UPDATE public.notifications SET read = TRUE WHERE user_id = p_user_id AND read = FALSE;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Create fuel_nearby notification (used by proximity alert system)
CREATE OR REPLACE FUNCTION public.create_fuel_nearby_notification(
  p_user_id UUID,
  p_station_id UUID,
  p_station_name TEXT,
  p_status TEXT,
  p_confidence NUMERIC,
  p_distance_km NUMERIC
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE notif_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, station_id, data, read)
  VALUES (
    p_user_id,
    'fuel_nearby',
    format('⛽ %s has fuel!', p_station_name),
    'A station near you just got fuel. Tap to confirm availability.',
    p_station_id,
    jsonb_build_object('status', p_status, 'confidence', p_confidence, 'distance_km', p_distance_km),
    FALSE
  )
  RETURNING id INTO notif_id;

  RETURN notif_id;
END;
$$;

-- Ration notification helpers
CREATE OR REPLACE FUNCTION public.create_ration_low_notification(p_user_id UUID, p_vehicle_type TEXT, p_percent_used INTEGER)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE notif_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  VALUES (
    p_user_id,
    'ration_low',
    '⚠️ Ration Running Low',
    format('You''ve used %s%% of your daily ration.', p_percent_used),
    jsonb_build_object('vehicle_type', p_vehicle_type, 'percent_used', p_percent_used),
    FALSE
  )
  RETURNING id INTO notif_id;

  RETURN notif_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_ration_reset_notification(p_user_id UUID, p_vehicle_type TEXT, p_daily_limit NUMERIC)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE notif_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  VALUES (
    p_user_id,
    'ration_reset',
    '⛽ Midnight Reset!',
    format('Your %s ration has been refilled. You have %s liters available today.', initcap(p_vehicle_type), p_daily_limit),
    jsonb_build_object('vehicle_type', p_vehicle_type, 'daily_limit', p_daily_limit),
    FALSE
  )
  RETURNING id INTO notif_id;

  RETURN notif_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_report_accepted_notification(
  p_user_id UUID,
  p_station_id UUID,
  p_station_name TEXT,
  p_trust_delta INTEGER
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE notif_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, station_id, data, read)
  VALUES (
    p_user_id,
    'report_accepted',
    format('✅ Report Accepted'),
    format('Your report at %s was verified. %s', p_station_name, CASE WHEN p_trust_delta > 0 THEN format('+%s trust', p_trust_delta) ELSE '' END),
    p_station_id,
    jsonb_build_object('trust_delta', p_trust_delta),
    FALSE
  )
  RETURNING id INTO notif_id;

  RETURN notif_id;
END;
$$;

-- ── 6. Grants ─────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT ON public.notifications TO service_role;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_fuel_nearby_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ration_low_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ration_reset_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_report_accepted_notification TO authenticated;
