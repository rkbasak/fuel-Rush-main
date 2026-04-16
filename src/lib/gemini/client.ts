import { Station, PlannedRoute, RouteStop } from '@/types';
import { calcDistance } from '@/utils';
import { generateAIContent } from '@/lib/ai/service';

export const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (default, fastest)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (balanced)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (most capable)' },
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]['value'];

/**
 * Generate route optimization using Gemini AI
 */
export async function optimizeRoute(
  currentLat: number,
  currentLng: number,
  targetFuelLiters: number,
  stations: Station[],
  modelOverride?: string
): Promise<PlannedRoute> {
  // Sort stations by distance from current location
  const sortedStations = [...stations]
    .filter((s) => s.status !== 'empty' && s.status !== 'unknown')
    .sort((a, b) => {
      const distA = calcDistance(currentLat, currentLng, a.lat, a.lng);
      const distB = calcDistance(currentLat, currentLng, b.lat, b.lng);
      return distA - distB;
    })
    .slice(0, 5); // Take top 5 nearest

  if (sortedStations.length === 0) {
    return {
      stops: [],
      total_distance_km: 0,
      total_duration_min: 0,
      ai_reasoning: 'No available stations found nearby.',
    };
  }

  const stationContext = sortedStations
    .map((s, i) => {
      const dist = calcDistance(currentLat, currentLng, s.lat, s.lng);
      return `${i + 1}. ${s.name} (${s.address}) - ${s.status}, confidence ${s.confidence}%, ${dist.toFixed(1)}km away`;
    })
    .join('\n');

  const prompt = `You are a fuel route optimizer for Dhaka, Bangladesh. Given a driver's current location and need for ${targetFuelLiters}L of fuel, select the optimal station(s) to visit.

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
    const text = await generateAIContent(prompt, { model: modelOverride });
    const responseText = text.trim();
    
    // Try to parse JSON from response
    let parsed: { stop_order: number[]; ai_reasoning: string; estimated_duration_minutes: number };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Fallback: use distance-sorted order
      parsed = {
        stop_order: sortedStations.map((_, i) => i),
        ai_reasoning: 'Fallback: sorted by distance due to AI parsing error.',
        estimated_duration_minutes: 20,
      };
    }

    const stops: RouteStop[] = parsed.stop_order.map((idx, order) => {
      const station = sortedStations[idx];
      const prevLat = order === 0 ? currentLat : sortedStations[parsed.stop_order[order - 1]].lat;
      const prevLng = order === 0 ? currentLng : sortedStations[parsed.stop_order[order - 1]].lng;
      const dist = calcDistance(prevLat, prevLng, station.lat, station.lng);
      const eta = `${Math.round((dist / 25) * 60 + order * 5)}min`;
      return { station, order: order + 1, eta, distance_km: dist };
    });

    const totalDist = stops.reduce((sum, s) => sum + s.distance_km, 0);

    return {
      stops,
      total_distance_km: Math.round(totalDist * 10) / 10,
      total_duration_min: parsed.estimated_duration_minutes,
      ai_reasoning: parsed.ai_reasoning,
    };
  } catch (error) {
    // Fallback route: nearest available stations
    const stops: RouteStop[] = sortedStations.map((station, order) => {
      const dist = calcDistance(currentLat, currentLng, station.lat, station.lng);
      return { station, order: order + 1, eta: `${Math.round((dist / 25) * 60)}min`, distance_km: Math.round(dist * 10) / 10 };
    });
    return {
      stops,
      total_distance_km: Math.round(stops.reduce((s, x) => s + x.distance_km, 0) * 10) / 10,
      total_duration_min: 20,
      ai_reasoning: 'Fallback route: sorted by proximity (Gemini unavailable).',
    };
  }
}

/**
 * Summarize report for fraud detection
 */
export async function summarizeReport(
  stationName: string,
  status: string,
  hasPhoto: boolean,
  modelOverride?: string
): Promise<{ suspicious: boolean; reason?: string }> {
  const prompt = `A user just reported for station "${stationName}": status="${status}", hasPhoto=${hasPhoto}.
  
Is this report suspicious? Consider:
- Does the status match the presence/absence of a photo?
- Is the status plausible for a fuel station in Dhaka?
- Reports without photos should be treated with slightly more scrutiny

Respond ONLY with JSON:
{ "suspicious": true/false, "reason": "brief explanation if suspicious" }`;

  try {
    const text = await generateAIContent(prompt, { model: modelOverride });
    return JSON.parse(text.trim());
  } catch {
    return { suspicious: false };
  }
}
