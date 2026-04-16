'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    // ── Auth check ───────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── Log heartbeat (for presence tracking) ─────────────────────────────────
    // This endpoint is called every 2 minutes to keep the user "active"
    // Could be used for: online status, activity tracking, etc.

    return NextResponse.json({
      data: {
        heartbeat: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Heartbeat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
