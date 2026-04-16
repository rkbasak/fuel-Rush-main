'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: { ration: null }, error: 'Not authenticated' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get user's vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, type')
      .eq('user_id', user.id)
      .limit(1);

    const vehicle = vehicles?.[0];
    const vehicleType = vehicle?.type || 'sedan';

    const limits: Record<string, number> = {
      motorcycle: 2,
      sedan: 10,
      suv: 20,
      commercial: 999999,
    };
    const limit = limits[vehicleType] || 10;

    // Get today's ration logs
    const { data: logs } = await supabase
      .from('ration_logs')
      .select('id, amount_liters, station_id, logged_at')
      .eq('user_id', user.id)
      .eq('vehicle_id', vehicle?.id || 'pending')
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`);

    const usedToday = (logs || []).reduce((sum: number, l: { amount_liters: number }) => sum + l.amount_liters, 0);
    const visitsToday = (logs || []).length;
    const remaining = Math.max(0, limit - usedToday);

    return NextResponse.json({
      data: {
        ration: {
          used_today: usedToday,
          visits_today: visitsToday,
          limit,
          remaining,
          vehicle_type: vehicleType,
        },
      },
    });
  } catch (error) {
    console.error('Ration API error:', error);
    return NextResponse.json({ data: { ration: null }, error: 'Internal server error' }, { status: 500 });
  }
}
