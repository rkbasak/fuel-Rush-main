'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCachedStationStatus } from '@/lib/redis/client';
import { getSiteSettings } from '@/lib/services/config';
import { generateAIContent } from '@/lib/ai/service';

const SYSTEM_PROMPT = `You are Fuel Rush AI assistant — helping drivers in Dhaka, Bangladesh find fuel stations.

You have access to the latest station data in Supabase. Be helpful, concise, and friendly.
Never make up station data. If you don't know something, say so.

Station statuses:
- 🟢 available = station has fuel
- 🟡 low = running low but available
- 🟠 queue = available but long wait
- 🔴 empty = no fuel
- ⚪ unknown = no recent data`;

interface Station {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  confidence: number;
  last_reported_at: string | null;
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  try {
    const { query, user_lat, user_lng } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (query.length > 1000) {
      return NextResponse.json({ error: 'Query exceeds maximum allowed length (1000 characters).' }, { status: 400 });
    }

    // ── Auth check ───────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── Rate limiting (Upstash only) ─────────────────────────────────────────
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

    // ── AI Provider Configuration ───────────────────────────────────────────
    const settings = await getSiteSettings();
    const effectiveModel = req.headers.get('x-gemini-model') || undefined;

    // Fetch user location — use client-provided lat/lng from body, or fallback to Dhaka center
    // ⚠️ WARNING: Hardcoded Dhaka center is used as fallback.
    // For production, implement proper geolocation via navigator.geolocation on the client.
    const clientLat = user_lat;
    const clientLng = user_lng;
    let userLat: number;
    let userLng: number;

    if (typeof clientLat === 'number' && typeof clientLng === 'number' &&
        clientLat >= -90 && clientLat <= 90 && clientLng >= -180 && clientLng <= 180) {
      userLat = clientLat;
      userLng = clientLng;
    } else {
      // ⚠️ Fallback: hardcoded Dhaka center — this is a known location approximation
      userLat = 23.8103;
      userLng = 90.4125;
      console.warn('[Chat] Using hardcoded Dhaka center — real geolocation recommended');
    }

    // Fetch nearby stations
    let stations: Station[] = [];
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('stations')
        .select('id, name, address, lat, lng, status, confidence, last_reported_at')
        .limit(50);

      if (!error && data) {
        // Enhance with Redis cache
        const enhanced = await Promise.all(
          (data as Station[]).map(async (s) => {
            try {
              const cached = await getCachedStationStatus(s.id);
              if (cached) {
                return { ...s, status: cached.status, confidence: cached.confidence };
              }
            } catch { /* ignore */ }
            return s;
          })
        );
        stations = enhanced;
      }
    } catch {
      // stations stays empty
    }

    // Calculate distances
    const withDistances = stations.map(s => ({
      ...s,
      distance_km: calcDistance(userLat, userLng, s.lat, s.lng),
    })).sort((a, b) => a.distance_km - b.distance_km);

    // Try AI for enriched response (with automatic fallback)
    let responseText = '';
    let modelUsed = effectiveModel || 'default';

    try {
      const nearbyContext = withDistances.slice(0, 10)
        .map((s, i) => `${i + 1}. ${s.name} (${s.address}) — ${s.status}, ${s.confidence}% confidence, ${s.distance_km?.toFixed(1)}km away`)
        .join('\n');

      const prompt = `${SYSTEM_PROMPT}

User query: "${query}"

Nearby stations (up to 10):
${nearbyContext || 'No stations found nearby.'}

Provide a helpful, concise response referencing actual station data where relevant. If showing station list, include distances.`;

      responseText = await generateAIContent(prompt, { model: effectiveModel });
      modelUsed = settings.ai_provider === 'openrouter' ? (settings.openrouter_model || 'openrouter-dynamic') : 'gemini-dynamic';
    } catch (aiError) {
      console.error('AI call failed:', aiError);
      // Fallback response
      if (withDistances.length === 0) {
        responseText = "I couldn't find any station data right now. Make sure you're connected to the internet and try again.";
      } else {
        responseText = `I found ${withDistances.length} stations near you. Check the map for details!`;
      }
    }

    return NextResponse.json({
      data: {
        response: responseText,
        intent: 'general_query',
        parsed_query: { query },
        stations: withDistances.slice(0, 5).map(s => ({
          id: s.id,
          name: s.name,
          address: s.address,
          status: s.status,
          confidence: s.confidence,
          distance_km: s.distance_km,
        })),
        count: withDistances.length,
        model_used: modelUsed,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
