import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { Station, StationStatus, VehicleType, VEHICLE_LIMITS } from '@/types';

// Station Store
interface StationState {
  stations: Station[];
  selectedStationId: string | null;
  filterStatus: StationStatus | 'all' | 'ai';
  isLoading: boolean;
  error: string | null;
  realtimeChannel: ReturnType<ReturnType<typeof createClient>['channel']> | null;
  setStations: (stations: Station[]) => void;
  selectStation: (id: string | null) => void;
  setFilterStatus: (status: StationStatus | 'all' | 'ai') => void;
  updateStationStatus: (id: string, status: StationStatus, confidence: number) => void;
  updateStationFromRealtime: (payload: { stationId: string; status?: StationStatus; confidence?: number }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
}

export const useStationStore = create<StationState>((set, get) => ({
  stations: [],
  selectedStationId: null,
  filterStatus: 'all',
  isLoading: false,
  error: null,
  realtimeChannel: null,

  setStations: (stations) => set({ stations }),

  selectStation: (id) => set({ selectedStationId: id }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  updateStationStatus: (id, status, confidence) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === id ? { ...s, status, confidence, updated_at: new Date().toISOString() } : s
      ),
    })),

  updateStationFromRealtime: (payload) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === payload.stationId
          ? {
              ...s,
              status: payload.status ?? s.status,
              confidence: payload.confidence ?? s.confidence,
              updated_at: new Date().toISOString(),
            }
          : s
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  subscribeToRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) return; // Already subscribed

    const supabase = createClient();

    const channel = supabase
      .channel('stations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stations',
        },
        (payload) => {
          const updatedStation = payload.new as Station;
          get().updateStationFromRealtime({
            stationId: updatedStation.id,
            status: updatedStation.status as StationStatus,
            confidence: updatedStation.confidence,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
        },
        async (payload) => {
          // New report for a station - trigger UI update
          const newReport = payload.new as { station_id: string; status: string };
          // The station update will come via the stations channel
          console.log('[Stores] Station report received:', newReport.station_id, newReport.status);
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      set({ realtimeChannel: null });
    }
  },
}));

// Ration Store (Phase 4: Enhanced)
interface VisitedStation { id: string; name: string; address: string; lat: number; lng: number; amount_liters: number; visited_at: string; }

interface RationState {
  dailyLimit: number; usedToday: number; visitsToday: number; lastResetDate: string;
  vehicleType: VehicleType; vehicleId: string | null; litersRemaining: number;
  visitedStations: VisitedStation[]; visitedStationIds: Set<string>;
  routeOptimizing: boolean; currentRoute: unknown | null;
  lastServerSync: number; // timestamp of last server ration state sync
  logFuelUp: (amount: number, station?: VisitedStation) => void;
  resetIfNewDay: () => void;
  setVehicleType: (type: VehicleType) => void;
  setVehicleId: (id: string) => void;
  setRationData: (data: { usedToday: number; visitsToday: number; limit: number; litersRemaining: number }) => void;
  setVisitedStations: (stations: VisitedStation[]) => void;
  addVisitedStation: (station: VisitedStation) => void;
  setRouteOptimizing: (optimizing: boolean) => void;
  setCurrentRoute: (route: unknown) => void;
  canVisitStation: (stationId: string) => boolean;
  getPerStationLimit: () => number;
  syncWithServer: () => Promise<void>;
  setLastServerSync: (ts: number) => void;
  startPolling: () => void;
  stopPolling: () => void;
  pollIntervalId: ReturnType<typeof setInterval> | null;
}

export const useRationStore = create<RationState>((set, get) => ({
  dailyLimit: 10, usedToday: 0, visitsToday: 0, lastResetDate: new Date().toDateString(),
  vehicleType: 'sedan' as VehicleType, vehicleId: null, litersRemaining: 10,
  visitedStations: [], visitedStationIds: new Set<string>(), routeOptimizing: false, currentRoute: null,
  lastServerSync: 0, pollIntervalId: null,

  logFuelUp: (amount, station) => set((state) => {
    const newVisitedStations = station ? [...state.visitedStations, station] : state.visitedStations;
    const newVisitedIds = station ? new Set([...state.visitedStationIds, station.id]) : state.visitedStationIds;
    return { usedToday: state.usedToday + amount, visitsToday: state.visitsToday + 1, litersRemaining: Math.max(0, state.litersRemaining - amount), visitedStations: newVisitedStations, visitedStationIds: newVisitedIds, lastServerSync: Date.now() };
  }),
  resetIfNewDay: () => {
    const today = new Date().toDateString();
    if (get().lastResetDate !== today) set({ usedToday: 0, visitsToday: 0, lastResetDate: today, visitedStations: [], visitedStationIds: new Set<string>(), litersRemaining: get().dailyLimit, currentRoute: null });
  },
  setVehicleType: (type) => {
    const limits = VEHICLE_LIMITS[type];
    const newLimit = limits.dailyLimit === Infinity ? 999999 : limits.dailyLimit;
    set({ vehicleType: type, dailyLimit: newLimit, litersRemaining: Math.max(0, newLimit - get().usedToday) });
  },
  setVehicleId: (id) => set({ vehicleId: id }),
  setRationData: (data) => set({ usedToday: data.usedToday, visitsToday: data.visitsToday, dailyLimit: data.limit, litersRemaining: data.litersRemaining, lastServerSync: Date.now() }),
  setVisitedStations: (stations) => set({ visitedStations: stations, visitedStationIds: new Set(stations.map((s) => s.id)) }),
  addVisitedStation: (station) => set((state) => ({ visitedStations: [...state.visitedStations, station], visitedStationIds: new Set([...state.visitedStationIds, station.id]) })),
  setRouteOptimizing: (optimizing) => set({ routeOptimizing: optimizing }),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  canVisitStation: (stationId) => {
    const { visitedStationIds, vehicleType } = get();
    const limits = VEHICLE_LIMITS[vehicleType];
    if (limits.visitsPerDay === 1 && visitedStationIds.size >= 1) return false;
    return !visitedStationIds.has(stationId);
  },
  getPerStationLimit: () => VEHICLE_LIMITS[get().vehicleType].perStation,
  syncWithServer: async () => {
    try {
      const res = await fetch('/api/ration');
      if (!res.ok) return;
      const { data } = await res.json();
      if (data?.ration) {
        get().setRationData({
          usedToday: data.ration.used_today,
          visitsToday: data.ration.visits_today,
          limit: data.ration.limit,
          litersRemaining: data.ration.remaining,
        });
        get().setLastServerSync(Date.now());
      }
    } catch { /* silent fail - client state persists */ }
  },
  setLastServerSync: (ts: number) => set({ lastServerSync: ts }),
  startPolling: () => {
    const { pollIntervalId } = get();
    if (pollIntervalId) return; // Already polling

    // Poll every 60 seconds while app is active
    const id = setInterval(() => {
      get().syncWithServer();
      get().resetIfNewDay(); // Also check for midnight reset
    }, 60_000);

    set({ pollIntervalId: id });
  },
  stopPolling: () => {
    const { pollIntervalId } = get();
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      set({ pollIntervalId: null });
    }
  },
}));

// Auth Store
interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
  trustScore: number;
  setUser: (id: string, trustScore?: number) => void;
  logout: () => void;
  updateTrustScore: (delta: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isAuthenticated: false,
  trustScore: 50,
  setUser: (id, trustScore = 50) =>
    set({ userId: id, isAuthenticated: true, trustScore }),
  logout: () => set({ userId: null, isAuthenticated: false, trustScore: 50 }),
  updateTrustScore: (delta) =>
    set((state) => ({
      trustScore: Math.max(0, Math.min(100, state.trustScore + delta)),
    })),
}));

// Heartbeat Store - manages 2-minute heartbeat interval
interface HeartbeatState {
  lastHeartbeat: number | null;
  isRunning: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  triggerHeartbeat: () => Promise<void>;
}

export const useHeartbeatStore = create<HeartbeatState>((set, get) => ({
  lastHeartbeat: null,
  isRunning: false,
  intervalId: null,

  startHeartbeat: () => {
    const { isRunning, intervalId } = get();
    if (isRunning || intervalId) return; // Already running

    // Initial heartbeat
    get().triggerHeartbeat();

    // Set up 2-minute interval
    const id = setInterval(() => {
      get().triggerHeartbeat();
    }, 2 * 60 * 1000);

    set({ isRunning: true, intervalId: id });
  },

  stopHeartbeat: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    set({ isRunning: false, intervalId: null });
  },

  triggerHeartbeat: async () => {
    try {
      const response = await fetch('/api/heartbeat', { method: 'POST' });
      if (response.ok) {
        const { data } = await response.json();
        set({ lastHeartbeat: Date.now() });
        console.log('Heartbeat triggered');
      }
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  },
}));

// AI Prediction Cache Store
interface PredictionCacheState {
  predictions: Record<string, {
    predicted_status: StationStatus;
    ai_confidence: number;
    reasoning: string;
    cached_at: string;
  }>;
  setPrediction: (stationId: string, prediction: {
    predicted_status: StationStatus;
    ai_confidence: number;
    reasoning: string;
    cached_at: string;
  }) => void;
  getPrediction: (stationId: string) => {
    predicted_status: StationStatus;
    ai_confidence: number;
    reasoning: string;
    cached_at: string;
  } | null;
  isPredictionStale: (stationId: string, maxAgeMs?: number) => boolean;
}

export const usePredictionCache = create<PredictionCacheState>((set, get) => ({
  predictions: {},

  setPrediction: (stationId, prediction) =>
    set((state) => ({
      predictions: {
        ...state.predictions,
        [stationId]: prediction,
      },
    })),

  getPrediction: (stationId) => get().predictions[stationId] || null,

  isPredictionStale: (stationId, maxAgeMs = 15 * 60 * 1000) => {
    const prediction = get().predictions[stationId];
    if (!prediction) return true;
    const age = Date.now() - new Date(prediction.cached_at).getTime();
    return age > maxAgeMs;
  },
}));

// Chat Store (Phase 3: Natural Language Query)
interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string;
  stations?: { id: string; name: string; address: string; status: 'available' | 'low' | 'queue' | 'empty' | 'unknown'; confidence: number; distance_km: number | null; }[];
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[]; isLoading: boolean;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [], isLoading: false,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, { ...msg, id: crypto.randomUUID(), timestamp: new Date().toISOString() }] })),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),
}));
