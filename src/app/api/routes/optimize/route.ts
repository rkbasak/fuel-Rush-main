'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callWithFallback } from '@/lib/ai/router';
import { GEMINI_MODELS } from '@/lib/gemini/client';
import { Station, RouteOptimizationInput, RouteOptimizationResult } from '@/types';
import { calcDistance } from '@/utils';

export async function POST(req: NextRequest) {
  try {
    const body: RouteOptimizationInput = await req.json();
    const { start_lat, start_lng, dest_lat, dest_lng, fuel_needed_liters } = body;

    // ── Auth check ─────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── Rate limiting ──────────────────────────────────────────────────────────
    try {
      const { getReportRateLimiter } = await import('@/lib/redis/client');
      const ratelimit = await getReportRateLimiter();
      if (ratelimit) {
        const { success } = await ratelimit.limit(user.id);
        if (!success) {
          return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
        }
      }
    } catch { /* non-fatal */ }

    // ── Input validation ───────────────────────────────────────────────────────
    if (start_lat == null || start_lng == null) {
      return NextResponse.json({ error: 'start_lat and start_lng are required' }, { status: 400 });
    }
    if (typeof start_lat !== 'number' || typeof start_lng !== 'number') {
      return NextResponse.json({ error: 'start_lat and start_lng must be numbers' }, { status: 400 });
    }
    if (start_lat < -90 || start_lat > 90) {
      return NextResponse.json({ error: 'start_lat must be between -90 and 90' }, { status: 400 });
    }
    if (start_lng < -180 || start_lng > 180) {
      return NextResponse.json({ error: 'start_lng must be between -180 and 180' }, { status: 400 });
    }
    if (dest_lat != null && (typeof dest_lat !== 'number' || dest_lat < -90 || dest_lat > 90)) {
      return NextResponse.json({ error: 'dest_lat must be a number between -90 and 90' }, { status: 400 });
    }
    if (dest_lng != null && (typeof dest_lng !== 'number' || dest_lng < -180 || dest_lng > 180)) {
      return NextResponse.json({ error: 'dest_lng must be a number between -180 and 180' }, { status: 400 });
    }
    if (fuel_needed_liters != null && (typeof fuel_needed_liters !== 'number' || fuel_needed_liters <= 0)) {
      return NextResponse.json({ error: 'fuel_needed_liters must be a positive number' }, { status: 400 });
    }

    // Determine model to use — only via server-controlled header, NOT from request body
    const modelFromHeader = req.headers.get('x-gemini-model');
    const effectiveModel = modelFromHeader || process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';
    const isValidModel = GEMINI_MODELS.some(m => m.value === effectiveModel);
    if (!isValidModel) {
      return NextResponse.json({ error: `Unknown model: ${effectiveModel}` }, { status: 400 });
    }

    // Fetch stations from Supabase
    let stations: Station[] = [];
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('stations')
        .select('id, name, address, lat, lng, status, confidence, last_reported_at, created_at, updated_at, last_reporter_id')
        .limit(50);

      if (!error && data) {
        stations = data as unknown as Station[];
      }
    } catch {
      // return empty on error
    }

    const targetFuel = fuel_needed_liters || 5;

    // Sort stations by distance from current location
    const sortedStations = [...stations]
      .filter((s) => s.status !== 'empty' && s.status !== 'unknown')
      .sort((a, b) => {
        const distA = calcDistance(start_lat, start_lng, a.lat, a.lng);
        const distB = calcDistance(start_lat, start_lng, b.lat, b.lng);
        return distA - distB;
      })
      .slice(0, 5);

    let ai_reasoning = '';
    let estimated_duration_minutes = 20;
    let stop_order: number[] = sortedStations.map((_, i) => i);

    if (sortedStations.length > 0) {
      const stationContext = sortedStations
        .map((s, i) => {
          const dist = calcDistance(start_lat, start_lng, s.lat, s.lng);
          return `${i + 1}. ${s.name} (${s.address}) - ${s.status}, confidence ${s.confidence}%, ${dist.toFixed(1)}km away`;
        })
        .join('\n');

      const prompt = `You are a fuel route optimizer for Dhaka, Bangladesh. Given a driver's current location and need for ${targetFuel}L of fuel, select the optimal station(s) to visit.

Available stations:
${stationContext}

Requirements:
- Prioritize stations with higher confidence (more recent reports)
- Consider distance trade-offs
- Provide step-by-step route with ETA estimates
- Assume average speed of 25km/h in Dhaka traffic
- Each stop adds ~5 minutes for refueling

Respond ONLY in this JSON format (no markdown, no explanation outside JSON):
{
  "stop_order": [0, 2, 1],  // indices into the station list
  "ai_reasoning": "Explanation of why this route was chosen",
  "estimated_duration_minutes": 30
}`;

      try {
        const aiResult = await callWithFallback(prompt);
        ai_reasoning = `AI model: ${aiResult.modelUsed}. `;
        try {
          const parsed = JSON.parse(aiResult.text.trim());
          stop_order = parsed.stop_order;
          ai_reasoning += parsed.ai_reasoning;
          estimated_duration_minutes = parsed.estimated_duration_minutes;
        } catch {
          ai_reasoning += 'Fallback: sorted by distance due to AI parsing error.';
          stop_order = sortedStations.map((_, i) => i);
        }
      } catch (aiError) {
        console.error('Route AI failed:', aiError);
        ai_reasoning = 'Fallback route: sorted by proximity (AI unavailable).';
        stop_order = sortedStations.map((_, i) => i);
      }
    } else {
      ai_reasoning = 'No available stations found nearby.';
    }

    const stops = stop_order.map((idx, order) => {
      const station = sortedStations[idx];
      const prevLat = order === 0 ? start_lat : sortedStations[stop_order[order - 1]].lat;
      const prevLng = order === 0 ? start_lng : sortedStations[stop_order[order - 1]].lng;
      const dist = calcDistance(prevLat, prevLng, station.lat, station.lng);
      const eta = `${Math.round((dist / 25) * 60 + order * 5)}min`;
      return {
        station: {
          id: station.id,
          name: station.name,
          address: station.address,
          lat: station.lat,
          lng: station.lng,
          status: station.status,
          confidence: station.confidence,
        },
        order: order + 1,
        eta,
        travel_minutes: Math.round((dist / 25) * 60),
        distance_km: dist,
      };
    });

    const totalDist = stops.reduce((sum, s) => sum + s.distance_km, 0);

    const result: RouteOptimizationResult = {
      stops,
      total_distance_km: Math.round(totalDist * 10) / 10,
      total_duration_min: estimated_duration_minutes,
      ai_reasoning,
      liters_remaining: 0,
      vehicle_type: 'sedan',
      visited_stations_excluded: [],
      candidates_considered: stations.length,
    };

    return NextResponse.json({ data: result, model_used: 'multi-model-fallback' });
  } catch (error) {
    console.error('Route optimize API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
