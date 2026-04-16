import { StationStatus, VehicleType, VEHICLE_LIMITS } from '@/types';

/**
 * Format fuel amount in liters
 */
export function formatFuel(liters: number): string {
  if (liters < 1) {
    return `${Math.round(liters * 1000)}ml`;
  }
  return `${liters.toFixed(1)}L`;
}

/**
 * Calculate confidence score from reports
 */
export function calcConfidence(
  baseScore: number,
  userTrustScore: number,
  corroborations: number,
  ageMs: number,
  heartbeatMs: number = 120_000
): number {
  const trustBonus = Math.min(userTrustScore * 0.3, 30);
  const corroborationBonus = corroborations * 10;
  const totalBeforeDecay = Math.min(baseScore + trustBonus + corroborationBonus, 100);
  
  // Linear decay over heartbeat period
  const decayRate = totalBeforeDecay / heartbeatMs;
  const decayed = Math.max(0, totalBeforeDecay - decayRate * ageMs);
  
  return Math.round(decayed);
}

/**
 * Get status color CSS class (Fuel Rush brand colors)
 */
export function getStatusColor(status: StationStatus): string {
  const colors: Record<StationStatus, string> = {
    available: 'bg-success',
    low: 'bg-warning',
    queue: 'bg-primary',
    empty: 'bg-danger',
    unknown: 'bg-neutral',
  };
  return colors[status];
}

/**
 * Get status emoji
 */
export function getStatusEmoji(status: StationStatus): string {
  const emojis: Record<StationStatus, string> = {
    available: '🟢',
    low: '🟡',
    queue: '🟠',
    empty: '🔴',
    unknown: '⚫',
  };
  return emojis[status];
}

/**
 * Get status label
 */
export function getStatusLabel(status: StationStatus): string {
  const labels: Record<StationStatus, string> = {
    available: 'Available',
    low: 'Low Stock',
    queue: 'Long Queue',
    empty: 'Empty',
    unknown: 'Unknown',
  };
  return labels[status];
}

/**
 * Get confidence color
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence > 70) return 'text-success';
  if (confidence > 40) return 'text-warning';
  return 'text-danger';
}

/**
 * Calculate distance between two lat/lng points (Haversine)
 */
export function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Check if midnight has passed since given date (BST: UTC+6)
 */
export function hasMidnightPassed(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  // BST is UTC+6
  const bstOffset = 6 * 60 * 60 * 1000;
  const bstNow = new Date(now.getTime() + bstOffset);
  const bstDate = new Date(date.getTime() + bstOffset);
  
  return bstNow.toDateString() !== bstDate.toDateString();
}

/**
 * Get remaining ration for a vehicle type
 */
export function getRemainingRation(
  vehicleType: VehicleType,
  usedToday: number
): { remaining: number; limit: number; percentUsed: number } {
  const limit = VEHICLE_LIMITS[vehicleType].dailyLimit;
  if (limit === Infinity) {
    return { remaining: Infinity, limit: Infinity, percentUsed: 0 };
  }
  const remaining = Math.max(0, limit - usedToday);
  const percentUsed = Math.min(100, (usedToday / limit) * 100);
  return { remaining, limit, percentUsed };
}

/**
 * Format time ago
 */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

/**
 * Generate UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
