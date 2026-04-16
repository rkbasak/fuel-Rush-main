'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StationStatus } from '@/types';
import { detectFraud, shouldRejectReport } from '@/lib/ai/fraud-detection';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stationId } = await params;
    const body = await req.json();
    const { status, wait_minutes, photo_url, reporter_lat, reporter_lng } = body;

    // ── Auth check ───────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── Input validation ─────────────────────────────────────────────────────
    const validStatuses: StationStatus[] = ['available', 'low', 'queue', 'empty'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    if (wait_minutes !== undefined && (typeof wait_minutes !== 'number' || wait_minutes < 0 || wait_minutes > 300)) {
      return NextResponse.json({ error: 'wait_minutes must be between 0 and 300' }, { status: 400 });
    }

    // ── Rate limiting ─────────────────────────────────────────────────────────
    try {
      const { getReportRateLimiter } = await import('@/lib/redis/client');
      const ratelimit = await getReportRateLimiter();
      if (ratelimit) {
        const { success } = await ratelimit.limit(user.id);
        if (!success) {
          return NextResponse.json({ error: 'Too many reports. Please wait a moment.' }, { status: 429 });
        }
      }
    } catch { /* non-fatal */ }

    // ── Duplicate check: same status within last 5 minutes ─────────────────────
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentReport } = await supabase
      .from('reports')
      .select('id, status')
      .eq('station_id', stationId)
      .eq('user_id', user.id)
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentReport && recentReport.length > 0 && recentReport[0].status === status) {
      return NextResponse.json({ error: 'Duplicate report: you submitted the same status recently. Please wait before reporting again.' }, { status: 409 });
    }

    // ── Fraud detection ───────────────────────────────────────────────────────
    const { data: station } = await supabase
      .from('stations')
      .select('lat, lng, status')
      .eq('id', stationId)
      .single();

    const { data: userReportsToday } = await supabase
      .from('reports')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const { data: latestUserReport } = await supabase
      .from('reports')
      .select('status, created_at')
      .eq('station_id', stationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: recentOtherStatuses } = await supabase
      .from('reports')
      .select('status')
      .eq('station_id', stationId)
      .neq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .limit(5);

    // Default reporter location to station location if not provided
    const rLat = reporter_lat ?? station?.lat ?? 23.8103;
    const rLng = reporter_lng ?? station?.lng ?? 90.4125;

    const fraudInput = {
      userId: user.id,
      stationId,
      stationLat: station?.lat ?? 23.8103,
      stationLng: station?.lng ?? 90.4125,
      reporterLat: rLat,
      reporterLng: rLng,
      newStatus: status,
      previousStatus: latestUserReport?.[0]?.status ?? null,
      previousReportAt: latestUserReport?.[0]?.created_at ?? null,
      otherRecentStatuses: (recentOtherStatuses ?? []).map((r: { status: string }) => r.status),
      reportsByUserToday: (userReportsToday ?? []).length,
    };

    const fraudSignals = detectFraud(fraudInput);

    if (shouldRejectReport(fraudSignals)) {
      return NextResponse.json(
        { error: 'Report rejected due to suspicious activity detected.' },
        { status: 403 }
      );
    }

    // ── Get user's trust score ────────────────────────────────────────────
    const { data: userProfile } = await supabase
      .from('users')
      .select('trust_score')
      .eq('id', user.id)
      .single();

    const trustScore = userProfile?.trust_score ?? 50;

    // ── Calculate confidence based on trust score ────────────────────────────
    const confidence = Math.min(100, trustScore + 10);

    // ── Insert report ─────────────────────────────────────────────────────────
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        station_id: stationId,
        user_id: user.id,
        status,
        wait_minutes: wait_minutes ?? null,
        photo_url: photo_url ?? null,
        confidence_score: confidence,
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report insert error:', reportError);
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }

    // ── Update station status ─────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('stations')
      .update({
        status,
        confidence,
        last_reported_at: new Date().toISOString(),
        last_reporter_id: user.id,
      })
      .eq('id', stationId);

    if (updateError) {
      console.error('Station update error:', updateError);
      // Report was inserted, but station update failed - not critical
    }

    return NextResponse.json({
      data: {
        report_id: report.id,
        confidence,
        message: 'Report submitted successfully',
        fraud_signals: fraudSignals.length > 0 ? fraudSignals.map(s => s.reason) : undefined,
      },
    });
  } catch (error) {
    console.error('Station report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
