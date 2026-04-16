// Station types
export type StationStatus = 'available' | 'low' | 'queue' | 'empty' | 'unknown';

export interface Station {
  id: string; name: string; address: string; lat: number; lng: number;
  status: StationStatus; confidence: number;
  last_reported_at: string | null; last_reporter_id: string | null;
  created_at: string; updated_at: string;
}

export interface StationReport {
  id: string; station_id: string; user_id: string;
  status: Exclude<StationStatus, 'unknown'>; photo_url: string | null;
  wait_minutes: number | null; confidence_score: number; created_at: string;
}

// Vehicle types
export type VehicleType = 'motorcycle' | 'sedan' | 'suv' | 'commercial';

export interface Vehicle { id: string; user_id: string; type: VehicleType; plate_number: string; nickname: string; created_at: string; }

export const VEHICLE_LIMITS: Record<VehicleType, { dailyLimit: number; perStation: number; visitsPerDay: number }> = {
  motorcycle: { dailyLimit: 2, perStation: 2, visitsPerDay: 1 },
  sedan: { dailyLimit: 10, perStation: 10, visitsPerDay: Infinity },
  suv: { dailyLimit: 20, perStation: 20, visitsPerDay: Infinity },
  commercial: { dailyLimit: Infinity, perStation: Infinity, visitsPerDay: Infinity },
};

// Ration types
export interface RationLog { id: string; user_id: string; vehicle_id: string; station_id: string; amount_liters: number; logged_at: string; }
export interface DailyRationSummary { vehicle_id: string; total_used: number; limit: number; remaining: number; visits: number; }

// User types
export interface UserProfile { id: string; display_name: string; trust_score: number; role: 'user' | 'admin'; created_at: string; }

// Route types
export interface RouteStop { station: Station; order: number; eta: string; distance_km: number; }
export interface PlannedRoute { stops: RouteStop[]; total_distance_km: number; total_duration_min: number; ai_reasoning: string; }

// Phase 3: AI / Fraud Detection types
export type FraudSignalType = 'contradiction' | 'remote' | 'rapid_succession' | 'impossible_frequency';
export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface FraudSignal { type: FraudSignalType; severity: FraudSeverity; reason: string; delta: number; }
export type ConfidenceTier = 'high' | 'medium' | 'decaying' | 'disputed' | 'expired' | 'unknown';

export interface ConfidenceResult {
  tier: ConfidenceTier; confidence: number; action: string;
  shouldBroadcast: boolean; shouldPingNearby: boolean; shouldFlag: boolean; shouldRemove: boolean; decayMinutes: number | null;
}

// Phase 4: Visited Station types
export interface VisitedStation { id: string; name: string; address: string; lat: number; lng: number; amount_liters: number; visited_at: string; }

export interface RouteOptimizationInput {
  user_id?: string; start_lat: number; start_lng: number;
  dest_lat?: number; dest_lng?: number;
  vehicle_type?: VehicleType; fuel_needed_liters?: number;
}

export interface RouteOptimizationResult {
  stops: Array<{
    station: Station | { id: string; name: string; address: string; lat: number; lng: number; status: StationStatus; confidence: number };
    order: number; eta: string; travel_minutes: number; distance_km: number;
  }>;
  total_distance_km: number; total_duration_min: number; ai_reasoning: string;
  liters_remaining: number; vehicle_type: VehicleType;
  visited_stations_excluded: string[]; candidates_considered: number;
}

// API Response types
export interface ApiResponse<T> { data?: T; error?: string; }
