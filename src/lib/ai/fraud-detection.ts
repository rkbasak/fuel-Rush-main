/**
 * Fraud Detection Engine
 *
 * Flags suspicious user behavior:
 * 1. Contradictory statuses: station has fuel → immediately reports no fuel (or vice versa)
 * 2. Remote reporting: user reports from >10km away
 * 3. Rapid succession: multiple reports on same station <2 min apart
 * 4. Impossible patterns: report frequency exceeds humanly possible
 */

import { calcDistance } from '@/utils';

export interface FraudSignal {
  type: 'contradiction' | 'remote' | 'rapid_succession' | 'impossible_frequency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  delta: number; // trust score adjustment
}

export interface FraudCheckInput {
  userId: string;
  stationId: string;
  stationLat: number;
  stationLng: number;
  reporterLat: number;
  reporterLng: number;
  newStatus: string;
  previousStatus: string | null;     // Most recent report status by this user
  previousReportAt: string | null;   // Most recent report time by this user
  otherRecentStatuses: string[];     // Other users' recent statuses
  reportsByUserToday: number;        // Total reports by this user today
}

// Maximum allowed distance from station to report (km)
const MAX_REPORT_DISTANCE_KM = 10;
// Minimum interval between reports on same station (seconds)
const MIN_REPORT_INTERVAL_SEC = 120;
// Maximum plausible reports per day per user
const MAX_REPORTS_PER_DAY = 20;
// Trust score penalty per fraud signal
const FRAUD_PENALTIES: Record<FraudSignal['type'], number> = {
  contradiction: -15,
  remote: -10,
  rapid_succession: -8,
  impossible_frequency: -20,
};

/**
 * Check a new report for fraud signals
 */
export function detectFraud(input: FraudCheckInput): FraudSignal[] {
  const signals: FraudSignal[] = [];

  // ── 1. Remote Reporting (>10km away) ──────────────────────────
  const distanceKm = calcDistance(
    input.reporterLat,
    input.reporterLng,
    input.stationLat,
    input.stationLng
  );

  if (distanceKm > MAX_REPORT_DISTANCE_KM) {
    signals.push({
      type: 'remote',
      severity: distanceKm > 50 ? 'critical' : 'high',
      reason: `User reported from ${distanceKm.toFixed(1)}km away (max ${MAX_REPORT_DISTANCE_KM}km allowed)`,
      delta: FRAUD_PENALTIES.remote,
    });
  }

  // ── 2. Contradictory Status (within 30 min) ───────────────────
  if (
    input.previousStatus &&
    input.previousReportAt &&
    input.newStatus !== input.previousStatus
  ) {
    const prevTime = new Date(input.previousReportAt).getTime();
    const now = Date.now();
    const gapMinutes = (now - prevTime) / 60_000;

    if (gapMinutes < 30) {
      signals.push({
        type: 'contradiction',
        severity: 'critical',
        reason: `User reported "${input.newStatus}" only ${Math.round(gapMinutes)}min after reporting "${input.previousStatus}" — contradictory`,
        delta: FRAUD_PENALTIES.contradiction,
      });
    }
  }

  // ── 3. Rapid Succession (<2 min apart on same station) ────────
  if (input.previousReportAt) {
    const prevTime = new Date(input.previousReportAt).getTime();
    const now = Date.now();
    const gapSec = (now - prevTime) / 1000;

    if (gapSec < MIN_REPORT_INTERVAL_SEC) {
      signals.push({
        type: 'rapid_succession',
        severity: gapSec < 30 ? 'critical' : 'high',
        reason: `User reported same station ${Math.round(gapSec)}s apart (min ${MIN_REPORT_INTERVAL_SEC}s allowed)`,
        delta: FRAUD_PENALTIES.rapid_succession,
      });
    }
  }

  // ── 4. Impossible Frequency (>20 reports/day) ─────────────────
  if (input.reportsByUserToday > MAX_REPORTS_PER_DAY) {
    signals.push({
      type: 'impossible_frequency',
      severity: 'critical',
      reason: `User has ${input.reportsByUserToday} reports today (max ${MAX_REPORTS_PER_DAY} plausible)`,
      delta: FRAUD_PENALTIES.impossible_frequency,
    });
  }

  return signals;
}

/**
 * Compute overall trust score adjustment from fraud signals
 */
export function computeTrustAdjustment(signals: FraudSignal[]): number {
  if (signals.length === 0) return 0;
  const totalPenalty = signals.reduce((sum, s) => sum + s.delta, 0);
  return Math.max(-40, totalPenalty);
}

/**
 * Determine if fraud signals are severe enough to auto-reject report
 */
export function shouldRejectReport(signals: FraudSignal[]): boolean {
  return signals.some(
    (s) =>
      (s.type === 'contradiction' && s.severity === 'critical') ||
      (s.type === 'rapid_succession' && s.severity === 'critical') ||
      s.type === 'impossible_frequency'
  );
}

/**
 * Get a human-readable fraud summary
 */
export function summarizeFraud(signals: FraudSignal[]): string {
  if (signals.length === 0) return 'No fraud signals detected';
  return signals
    .map((s) => `[${s.severity.toUpperCase()}] ${s.reason}`)
    .join(' | ');
}
