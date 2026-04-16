'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VEHICLE_LIMITS: Record<string, number> = {
  motorcycle: 2,
  sedan: 10,
  suv: 20,
  commercial: Infinity, // BPC rules: no limit
};

const VALID_VEHICLE_TYPES = ['motorcycle', 'sedan', 'suv', 'commercial'] as const;
type VehicleType = (typeof VALID_VEHICLE_TYPES)[number];

function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth check ───────────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── Parse & validate body ─────────────────────────────────────────────────
    const body = await request.json();
    const { station_id, liters_collected, vehicle_type } = body;

    // station_id must be a valid UUID
    if (!station_id || typeof station_id !== 'string' || !isValidUUID(station_id)) {
      return NextResponse.json(
        { error: 'Invalid or missing station_id (must be a valid UUID)' },
        { status: 400 }
      );
    }

    // liters_collected: number between 0.1 and 100
    const liters = parseFloat(liters_collected);
    if (isNaN(liters) || liters < 0.1 || liters > 100) {
      return NextResponse.json(
        { error: 'liters_collected must be a number between 0.1 and 100' },
        { status: 400 }
      );
    }

    // vehicle_type: must be one of the valid types
    if (!vehicle_type || !VALID_VEHICLE_TYPES.includes(vehicle_type as VehicleType)) {
      return NextResponse.json(
        { error: `vehicle_type must be one of: ${VALID_VEHICLE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const vType = vehicle_type as VehicleType;

    // ── Verify station exists ────────────────────────────────────────────────
    const { data: station, error: stationError } = await supabase
      .from('stations')
      .select('id')
      .eq('id', station_id)
      .single();

    if (stationError || !station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    // ── Daily limit check ────────────────────────────────────────────────────
    // Get all of the user's vehicles of this type
    const { data: vehiclesOfType, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', vType);

    if (vehiclesError) {
      console.error('Vehicle lookup error:', vehiclesError);
      return NextResponse.json({ error: 'Failed to look up vehicle' }, { status: 500 });
    }

    const vehicleIds = (vehiclesOfType ?? []).map((v: { id: string }) => v.id);

    // CRITICAL-02: Reject if user has no vehicle of this type (null vehicle_id bypasses enforcement trigger)
    if (vehicleIds.length === 0) {
      return NextResponse.json(
        { error: `You have no registered ${vType} vehicle. Please add one first.` },
        { status: 400 }
      );
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    // Fetch today's logs for this vehicle type (all vehicles of that type combined)
    let todayLogsQuery = supabase
      .from('ration_logs')
      .select('id, amount_liters, station_id')
      .eq('user_id', user.id)
      .gte('logged_at', startOfDay)
      .lte('logged_at', endOfDay);

    if (vehicleIds.length > 0) {
      todayLogsQuery = todayLogsQuery.in('vehicle_id', vehicleIds);
    } else {
      // No vehicle of this type — add a filter that will never match
      todayLogsQuery = todayLogsQuery.eq('vehicle_id', '00000000-0000-0000-0000-000000000000');
    }

    const { data: todayLogs, error: logsError } = await todayLogsQuery;

    if (logsError) {
      console.error('Error fetching today\'s logs:', logsError);
      return NextResponse.json({ error: 'Failed to check daily ration limit' }, { status: 500 });
    }

    const usedToday = (todayLogs ?? []).reduce(
      (sum: number, l: { amount_liters: number }) => sum + l.amount_liters,
      0
    );
    const limit = VEHICLE_LIMITS[vType] ?? 10;

    if (limit !== Infinity && usedToday + liters > limit) {
      return NextResponse.json(
        {
          error: 'Daily ration limit exceeded.',
        },
        { status: 403 }
      );
    }

    // ── Duplicate check: already logged at this station today? ───────────────
    const alreadyLogged = (todayLogs ?? []).some(
      (log: { station_id: string }) => log.station_id === station_id
    );
    if (alreadyLogged) {
      return NextResponse.json(
        { error: 'You have already logged a fuel-up at this station today.' },
        { status: 409 }
      );
    }

    // ── Insert the ration log ─────────────────────────────────────────────────
    // Use the first matching vehicle id (or null if none — will be handled by RLS)
    const vehicleId = vehicleIds[0] ?? null;

    const { data: inserted, error: insertError } = await supabase
      .from('ration_logs')
      .insert({
        user_id: user.id,
        station_id,
        vehicle_id: vehicleId,
        amount_liters: liters,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Handle race condition: duplicate key from concurrent requests
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already logged a fuel-up at this station today.' },
          { status: 409 }
        );
      }
      console.error('Insert ration log error:', insertError);
      return NextResponse.json({ error: 'Failed to log ration' }, { status: 500 });
    }

    // ── Return updated ration summary ────────────────────────────────────────
    const newUsedToday = usedToday + liters;
    const remaining = limit === Infinity ? null : Math.max(0, limit - newUsedToday);

    return NextResponse.json({
      data: {
        ration_log: {
          id: inserted.id,
          station_id,
          amount_liters: liters,
          vehicle_id: vehicleId,
          logged_at: inserted.logged_at,
        },
        summary: {
          used_today: newUsedToday,
          limit: limit === Infinity ? 'unlimited' : limit,
          remaining,
          vehicle_type: vType,
        },
      },
    });
  } catch (error) {
    console.error('Ration log POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
