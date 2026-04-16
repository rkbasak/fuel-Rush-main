'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callWithFallback } from '@/lib/ai/router';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stationId } = await params;

    // ── Auth check ───────────────────────────────────────────────────────────
    // Authorization: any authenticated user can predict for any station.
    // Non-public stations should be filtered here in the future (RLS on stations table).
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── Get station data ─────────────────────────────────────────────────────
    const { data: station, error: stationError } = await supabase
      .from('stations')
      .select('id, name, status, confidence, last_reported_at')
      .eq('id', stationId)
      .single();

    if (stationError || !station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    // ── Check if we have enough data for prediction ───────────────────────────
    // For now, if status is unknown or very low confidence, generate prediction
    if (station.status !== 'unknown' && station.confidence > 70) {
      return NextResponse.json({
        data: {
          predicted_status: station.status,
          ai_confidence: station.confidence,
          reasoning: 'High confidence based on recent reports',
          cached_at: new Date().toISOString(),
        },
      });
    }

    // ── Get recent reports for this station ─────────────────────────────────
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: reports } = await supabase
      .from('reports')
      .select('status, confidence_score, photo_url, created_at')
      .eq('station_id', stationId)
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(5);

    // ── Use AI to summarize and predict ─────────────────────────────────────
    const hasPhoto = reports?.some(r => r.photo_url) ?? false;
    const latestStatus = reports?.[0]?.status ?? station.status;

    let predicted_status = station.status;
    let ai_confidence = station.confidence;
    let reasoning = 'Insufficient data for AI prediction';

    try {
      const prompt = `A user just reported for station "${station.name}": status="${latestStatus}", hasPhoto=${hasPhoto}.
  
Is this report suspicious? Consider:
- Does the status match the presence/absence of a photo?
- Is the status plausible for a fuel station in Dhaka?
- Reports without photos should be treated with slightly more scrutiny

Respond ONLY with JSON:
{ "suspicious": true/false, "reason": "brief explanation if suspicious" }`;

      const aiResult = await callWithFallback(prompt);

      let parsed: { suspicious: boolean; reason?: string };
      try {
        parsed = JSON.parse(aiResult.text.trim());
      } catch {
        parsed = { suspicious: false };
      }

      if (!parsed.suspicious) {
        predicted_status = latestStatus as 'available' | 'low' | 'queue' | 'empty';
        ai_confidence = Math.min(100, station.confidence + 15);
        reasoning = parsed.reason ?? 'AI analysis complete';
      } else {
        predicted_status = 'unknown';
        ai_confidence = Math.max(0, station.confidence - 20);
        reasoning = parsed.reason ?? 'Report flagged as suspicious';
      }
    } catch (aiError) {
      console.error('AI prediction failed:', aiError);
      // Fallback to status quo
      predicted_status = station.status as 'available' | 'low' | 'queue' | 'empty' | 'unknown';
      reasoning = 'AI unavailable - using latest reported status';
    }

    return NextResponse.json({
      data: {
        predicted_status,
        ai_confidence,
        reasoning,
        cached_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Station predict API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
