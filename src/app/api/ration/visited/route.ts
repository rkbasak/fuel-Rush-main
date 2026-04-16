'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RationLogWithStation {
  id: string;
  amount_liters: number;
  logged_at: string;
  station_id: string;
  stations: {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null;
}

export async function GET() {
  try {
    // ── Auth check ───────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── Get today's visited stations ──────────────────────────────────────────
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const { data: rationLogs, error } = await supabase
      .from('ration_logs')
      .select('id, amount_liters, logged_at, station_id, stations:id, name, address, lat, lng')
      .eq('user_id', user.id)
      .gte('logged_at', startOfDay)
      .lte('logged_at', endOfDay)
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('Visited stations query error:', error);
      return NextResponse.json({ error: 'Failed to fetch visited stations' }, { status: 500 });
    }

    const visited_stations = (rationLogs as unknown as RationLogWithStation[] ?? []).map((log) => ({
      id: log.stations?.id ?? log.station_id,
      name: log.stations?.name ?? 'Unknown Station',
      address: log.stations?.address ?? '',
      lat: log.stations?.lat ?? 0,
      lng: log.stations?.lng ?? 0,
      amount_liters: log.amount_liters,
      visited_at: log.logged_at,
    }));

    return NextResponse.json({
      data: {
        visited_stations,
        count: visited_stations.length,
      },
    });
  } catch (error) {
    console.error('Visited stations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
