-- Migration: 004_motorcycle_limit_enforcement.sql
-- Adds server-side enforcement for motorcycle 2L daily fuel limit via trigger
-- This complements the application-layer enforcement in ration/log/route.ts

-- Trigger function to enforce motorcycle 2L daily limit on ration_logs INSERT
CREATE OR REPLACE FUNCTION enforce_motorcycle_daily_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_type TEXT;
  v_daily_limit INTEGER;
  v_total_today FLOAT;
  v_bst_today DATE;
BEGIN
  -- Get the vehicle type for the inserting vehicle
  SELECT type INTO v_type
  FROM vehicles
  WHERE id = NEW.vehicle_id;

  -- Only enforce for motorcycles
  IF v_type = 'motorcycle' THEN
    v_daily_limit := 2;

    -- Calculate BST today
    v_bst_today := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::DATE;

    -- Sum today's ration_logs for this user+vehicle
    SELECT COALESCE(SUM(amount_liters), 0) INTO v_total_today
    FROM ration_logs
    WHERE user_id = NEW.user_id
      AND vehicle_id = NEW.vehicle_id
      AND (logged_at AT TIME ZONE 'Asia/Dhaka')::DATE = v_bst_today;

    -- Check if adding the new amount would exceed 2L
    IF v_total_today + NEW.amount_liters > v_daily_limit THEN
      RAISE EXCEPTION 'Daily ration limit exceeded.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to ration_logs (runs before INSERT)
DROP TRIGGER IF EXISTS trigger_enforce_motorcycle_daily_limit ON ration_logs;
CREATE TRIGGER trigger_enforce_motorcycle_daily_limit
  BEFORE INSERT ON ration_logs
  FOR EACH ROW
  EXECUTE FUNCTION enforce_motorcycle_daily_limit();

-- Also add a check constraint for amount_liters range (defense-in-depth)
-- The existing constraint already enforces 0 < amount_liters <= 100
-- We also want to ensure non-null
ALTER TABLE ration_logs
  ALTER COLUMN amount_liters SET NOT NULL;
