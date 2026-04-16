import { NextRequest, NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/services/config';
import { generateAIContent } from '@/lib/ai/service';

export async function POST(req: NextRequest) {
  try {
    const { location } = await req.json();
    if (!location) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    const settings = await getSiteSettings();
    const gmapsKey = settings.google_maps_api_key || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Provider-aware key check
    const isOpenRouter = settings.ai_provider === 'openrouter';
    const aiKey = isOpenRouter 
      ? (settings.openrouter_api_key || process.env.OPENROUTER_API_KEY)
      : (settings.gemini_api_key || process.env.GEMINI_API_KEY);

    if (!aiKey) {
      return NextResponse.json({ 
        error: `AI provider not configured. Please set the ${isOpenRouter ? 'OpenRouter' : 'Gemini'} key in the Admin Panel.` 
      }, { status: 400 });
    }

    let allRawStations: any[] = [];

    // --- SOURCE 1: Google Places (New API) ---
    if (gmapsKey && !gmapsKey.includes('your-project')) {
      try {
        const placesUrl = 'https://places.googleapis.com/v1/places:searchText';
        const placesRes = await fetch(placesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': gmapsKey,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types'
          },
          body: JSON.stringify({ textQuery: `fuel station in ${location}` })
        });

        if (placesRes.ok) {
          const placesData = await placesRes.json();
          if (placesData.places) {
            allRawStations.push(...placesData.places.map((p: any) => ({
              name: p.displayName?.text || 'Unknown Google Station',
              address: p.formattedAddress || 'Unknown Address',
              lat: p.location?.latitude,
              lng: p.location?.longitude,
              source: 'google'
            })));
            console.log(`[Discovery] Found ${placesData.places.length} stations from Google.`);
          }
        } else {
          console.warn(`[Discovery] Google Places failed with status ${placesRes.status}. Falling back to OSM.`);
        }
      } catch (err) {
        console.error('[Discovery] Google Places Fetch Error:', err);
      }
    }

    // --- SOURCE 2: OpenStreetMap (OSM via Overpass) ---
    try {
      // Look for the area by name then download amenity=fuel
      const osmQuery = `[out:json];area["name"="${location}"];nwr["amenity"="fuel"](area);out center;`;
      const osmRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: osmQuery
      });

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (osmData.elements) {
          const osmStations = osmData.elements.map((e: any) => ({
            name: e.tags?.name || e.tags?.brand || 'Fuel Station (OSM)',
            address: e.tags?.['addr:street'] || e.tags?.['addr:full'] || `Near ${location}`,
            lat: e.lat || e.center?.lat,
            lng: e.lon || e.center?.lon,
            source: 'osm'
          })).filter((s: any) => s.lat && s.lng);
          
          allRawStations.push(...osmStations);
          console.log(`[Discovery] Found ${osmStations.length} stations from OpenStreetMap.`);
        }
      }
    } catch (err) {
      console.error('[Discovery] OSM Fetch Error:', err);
    }

    if (allRawStations.length === 0) {
      return NextResponse.json({ 
        stations: [], 
        message: `No stations found in "${location}". Please try a larger area or enable Google Places API.` 
      });
    }

    // --- AI Refinement & Deduplication ---
    const prompt = `You are a data cleaning expert for a fuel tracking app. 
    Below is raw JSON gathered from multiple sources (Google & OpenStreetMap) for fuel stations in "${location}".
    
    Raw Data: ${JSON.stringify(allRawStations)}
    
    Clean, merge, and de-duplicate this data into a standardized JSON array of fuel stations. 
    - Ensure names are professional (e.g., "Jamuna Fuel" instead of "Jamuna Gas Pump & Service").
    - If two stations have the same name and location, MERGE them.
    - Include lat/lng as numbers.
    - Set status to "unknown" for all.
    - Set confidence to 100 for verified data.
    - Return ONLY a JSON array.

    Format:
    [
      { "name": "...", "address": "...", "lat": 23.1, "lng": 90.1, "status": "unknown", "confidence": 100, "source": "..." }
    ]`;

    const text = await generateAIContent(prompt);
    
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const cleanedStations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ 
      stations: cleanedStations,
      raw_count: allRawStations.length
    });

  } catch (error: any) {
    console.error('Discovery Error:', error);
    return NextResponse.json({ error: error.message || 'Discovery failed' }, { status: 500 });
  }
}
