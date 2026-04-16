/**
 * Google Maps dark theme style (matching Fuel Rush dark UI)
 */
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0D0D0D' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D0D0D' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A0A0A0' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#A0A0A0' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#666677' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1E1E2E' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#666677' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E1E2E' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2A2A3E' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#A0A0A0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2A2A3E' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1E1E2E' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1E1E2E' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#666677' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D0D0D' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2A2A3E' }] },
];

/**
 * Get marker icon SVG for station status (Fuel Rush brand colors)
 * If isVisited is true, shows a dimmed marker with ⚫ overlay
 */
export function getMarkerIcon(
  status: 'available' | 'low' | 'queue' | 'empty' | 'unknown',
  isVisited = false
): string {
  // Fuel Rush status colors from UX spec
  const colors: Record<string, string> = {
    available: '#00E676', // Bright Green
    low: '#FFB300',       // Amber
    queue: '#FF6B35',     // Primary Orange
    empty: '#FF1744',     // Red
    unknown: '#A0A0A0',   // Grey
  };
  
  const color = isVisited ? '#4A4A5A' : (colors[status] || colors.unknown);
  const innerColor = isVisited ? '#8A8A9A' : '#FFFFFF';
  const pulseAnimation = status === 'available' && !isVisited 
    ? `<circle cx="16" cy="14" r="10" fill="none" stroke="${color}" stroke-width="2" opacity="0.5">
         <animate attributeName="r" from="8" to="14" dur="1.5s" repeatCount="indefinite"/>
         <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite"/>
       </circle>` 
    : '';

  const svg = `<svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26s18-12.5 18-26c0-9.941-8.059-18-18-18z" fill="${color}"/>
    <circle cx="18" cy="16" r="7" fill="${innerColor}" fill-opacity="0.9"/>
    ${pulseAnimation}
    ${isVisited ? '<circle cx="28" cy="8" r="6" fill="#1A1A2E" stroke="#666677" stroke-width="2"/><text x="28" y="11" font-size="8" text-anchor="middle" fill="#A0A0A0">⚫</text>' : ''}
  </svg>`;
  
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

/**
 * Default map center (Dhaka, Bangladesh)
 */
export const DEFAULT_MAP_CENTER = { lat: 23.8103, lng: 90.4125 };

/**
 * Default zoom level
 */
export const DEFAULT_ZOOM = 13;

/**
 * Station marker clustering options
 */
export const CLUSTERER_OPTIONS = { maxZoom: 14, minPoints: 2 };
