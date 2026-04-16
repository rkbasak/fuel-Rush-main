'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // ── Auth check ───────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── Get recently confirmed stations (high confidence) ─────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: stations, error } = await supabase
      .from('stations')
      .select('id, name, address, lat, lng, status, confidence, last_reported_at')
      .gte('confidence', 70)
      .gte('last_reported_at', oneHourAgo)
      .order('confidence', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Confirmed stations query error:', error);
      return NextResponse.json({ error: 'Failed to fetch confirmed stations' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        stations: stations ?? [],
        count: stations?.length ?? 0,
      },
    });
  } catch (error) {
    console.error('Confirmed stations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
