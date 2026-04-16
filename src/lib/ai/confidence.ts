/**
 * Confidence Decay Engine
 * Determines station status confidence based on:
 * - Number of users who confirmed the status
 * - Time elapsed since last report
 * - Recency of updates
 *
 * Status tiers:
 * 🟢 High:      3+ users confirmed         → 90-100%
 * 🟡 Medium:    1 user reported            → 50-70%
 * 🟠 Decaying:  30+ min, no reconfirm     → 30-50%
 * 🔴 Disputed:  Someone marked wrong      → 0-20%
 * ⚫ Expired:   2+ hrs, no update         → 0% (auto-remove)
 */

import { StationStatus } from '@/types';

export type ConfidenceTier = 'high' | 'medium' | 'decaying' | 'disputed' | 'expired' | 'unknown';

export interface ConfidenceInput {
  status: StationStatus;
  confirmations: number;       // Number of users who reported this status
  totalReports: number;        // Total reports on this station
  lastReportedAt: string | null;  // ISO timestamp
  contradictoryReports: number;   // Reports with different status
  userTrustScore: number;         // Reporting user's trust score (0-100)
}

export interface ConfidenceResult {
  tier: ConfidenceTier;
  confidence: number;          // 0-100
  action: string;
  shouldBroadcast: boolean;
  shouldPingNearby: boolean;
  shouldFlag: boolean;
  shouldRemove: boolean;
  decayMinutes: number | null;  // How many minutes until next decay tier
}

// TTL per status (minutes)
const STATUS_TTL: Record<Exclude<StationStatus, 'unknown'>, number> = {
  available: 2,   // 2 min for 🟢/🟡
  low: 2,
  queue: 5,       // 5 min for 🟠
  empty: 10,      // 10 min for 🔴
};

// Tier thresholds
const HIGH_CONFIRMATION_THRESHOLD = 3;
const DECAYING_MINUTES = 30;
const EXPIRED_MINUTES = 120;

/**
 * Compute confidence tier and recommended actions
 */
export function computeConfidence(input: ConfidenceInput): ConfidenceResult {
  const {
    status,
    confirmations,
    totalReports,
    lastReportedAt,
    contradictoryReports,
    userTrustScore,
  } = input;

  if (status === 'unknown' || !lastReportedAt) {
    return {
      tier: 'unknown',
      confidence: 0,
      action: 'No data available — show station as unknown',
      shouldBroadcast: false,
      shouldPingNearby: false,
      shouldFlag: false,
      shouldRemove: true,
      decayMinutes: null,
    };
  }

  const ageMs = Date.now() - new Date(lastReportedAt).getTime();
  const ageMinutes = ageMs / 60_000;

  // ── Tier determination ──────────────────────────────────────────

  // 🔴 Disputed: contradictory reports exist
  if (contradictoryReports > 0 && confirmations === 0) {
    const confidence = Math.max(0, 20 - contradictoryReports * 5);
    return {
      tier: 'disputed',
      confidence,
      action: 'Flag immediately — conflicting reports detected',
      shouldBroadcast: false,
      shouldPingNearby: false,
      shouldFlag: true,
      shouldRemove: false,
      decayMinutes: null,
    };
  }

  // ⚫ Expired: 2+ hours old, no update
  if (ageMinutes >= EXPIRED_MINUTES) {
    return {
      tier: 'expired',
      confidence: 0,
      action: 'Auto-remove from live map — data too stale',
      shouldBroadcast: false,
      shouldPingNearby: false,
      shouldFlag: false,
      shouldRemove: true,
      decayMinutes: null,
    };
  }

  // 🟠 Decaying: 30+ min without reconfirmation (single reporter)
  if (ageMinutes >= DECAYING_MINUTES && confirmations < HIGH_CONFIRMATION_THRESHOLD) {
    const baseConfidence = 50;
    const decayFactor = Math.min((ageMinutes - DECAYING_MINUTES) / 60, 1); // decay over 1hr
    const confidence = Math.round(baseConfidence * (1 - decayFactor));
    return {
      tier: 'decaying',
      confidence: Math.max(30, confidence),
      action: 'Ping nearby users for reconfirmation',
      shouldBroadcast: false,
      shouldPingNearby: true,
      shouldFlag: false,
      shouldRemove: false,
      decayMinutes: Math.round(EXPIRED_MINUTES - ageMinutes),
    };
  }

  // 🟢 High: 3+ users confirmed
  if (confirmations >= HIGH_CONFIRMATION_THRESHOLD) {
    const baseConfidence = 90;
    const trustBonus = Math.min(userTrustScore * 0.1, 10);
    const confidence = Math.min(100, baseConfidence + trustBonus);
    return {
      tier: 'high',
      confidence: Math.round(confidence),
      action: 'Broadcast widely to all users',
      shouldBroadcast: true,
      shouldPingNearby: false,
      shouldFlag: false,
      shouldRemove: false,
      decayMinutes: null,
    };
  }

  // 🟡 Medium: 1-2 users, recent report (<30 min)
  const baseConfidence = status === 'available' ? 70 : status === 'low' ? 60 : 50;
  const trustBonus = Math.min(userTrustScore * 0.2, 15);
  const ageDecay = ageMinutes > 10 ? Math.round(ageMinutes * 0.5) : 0;
  const confidence = Math.max(50, Math.min(70, baseConfidence + trustBonus - ageDecay));

  return {
    tier: 'medium',
    confidence,
    action: 'Show with caution — limited confirmations',
    shouldBroadcast: false,
    shouldPingNearby: false,
    shouldFlag: false,
    shouldRemove: false,
    decayMinutes: Math.round(DECAYING_MINUTES - ageMinutes),
  };
}

/**
 * Get cache TTL (in seconds) based on status
 * 🟢/🟡 → 2 min (120s), 🟠 → 5 min (300s), 🔴 → 10 min (600s)
 */
export function getStatusCacheTTL(status: StationStatus): number {
  if (status === 'unknown') return 60;
  if (status === 'available' || status === 'low') return 120;
  if (status === 'queue') return 300;
  if (status === 'empty') return 600;
  return 120;
}

/**
 * Get status label for display
 */
export function getConfidenceTierLabel(tier: ConfidenceTier): string {
  const labels: Record<ConfidenceTier, string> = {
    high: '🟢 High Confidence',
    medium: '🟡 Medium Confidence',
    decaying: '🟠 Decaying',
    disputed: '🔴 Disputed',
    expired: '⚫ Expired',
    unknown: '⚫ Unknown',
  };
  return labels[tier];
}
