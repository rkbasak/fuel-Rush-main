'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Station, StationStatus } from '@/types';
import { useStationStore, useHeartbeatStore, usePredictionCache, useRationStore } from '@/stores';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { StatusBadge, ConfidenceBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StationList } from '@/components/stations/StationList';
import { ReportForm } from '@/components/stations/ReportForm';
import { ChatAssistant } from '@/components/chat/ChatAssistant';
import { MOCK_STATIONS, MOCK_USER_LAT, MOCK_USER_LNG } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';
import { Navigation, Plus, Locate, RefreshCw, MessageSquare, X, Users, Activity } from 'lucide-react';

// Dynamic import for MapView (no SSR - requires Google Maps)
const MapView = dynamic(() => import('@/components/map/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-text-muted">Loading map...</p>
      </div>
    </div>
  ),
});

type FilterValue = StationStatus | 'all' | 'ai';

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Low Stock', value: 'low' },
  { label: 'Queue', value: 'queue' },
  { label: 'Empty', value: 'empty' },
  { label: '🔮 AI', value: 'ai' },
];

// Mock community stats
const MOCK_COMMUNITY_STATS = {
  reportsToday: 247,
  activeUsers: 89,
  stationsWithFuel: 12,
};

export default function MapPage() {
  const {
    stations,
    setStations,
    filterStatus,
    setFilterStatus,
    selectedStationId,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  } = useStationStore();
  const { startHeartbeat, stopHeartbeat, lastHeartbeat, isRunning: heartbeatRunning } = useHeartbeatStore();
  const { setPrediction, getPrediction, isPredictionStale } = usePredictionCache();
  const { visitedStationIds } = useRationStore();

  const [showStationSheet, setShowStationSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<{
    predicted_status: StationStatus;
    ai_confidence: number;
    reasoning: string;
  } | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState<Record<string, boolean>>({});
  const [communityStats] = useState(MOCK_COMMUNITY_STATS);
  // Real user location via geolocation
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Get real user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLat(pos.coords.latitude);
        setGeoLng(pos.coords.longitude);
        setGeoError(null);
      },
      (err) => {
        setGeoError(err.message);
        console.warn('[Map] Geolocation error:', err.message, '— using fallback');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }, []);

  // Initialize with mock data and subscribe to realtime
  useEffect(() => {
    if (stations.length === 0) {
      setStations(MOCK_STATIONS);
    }

    subscribeToRealtime();
    startHeartbeat();

    const fetchVisited = async () => {
      try {
        const res = await fetch('/api/ration/visited');
        const data = await res.json();
        if (data.data?.visited_stations) useRationStore.getState().setVisitedStations(data.data.visited_stations);
      } catch { /* not authenticated */ }
    };
    fetchVisited();

    return () => {
      unsubscribeFromRealtime();
      stopHeartbeat();
    };
  }, []);

  const filteredStations = (() => {
    if (filterStatus === 'all') return stations;
    if (filterStatus === 'ai') {
      return stations.filter((s) => {
        const pred = getPrediction(s.id);
        return s.status === 'unknown' || (pred && !isPredictionStale(s.id));
      });
    }
    return stations.filter((s) => s.status === filterStatus);
  })();

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setShowStationSheet(true);
    setAiPrediction(null);

    const cached = getPrediction(station.id);
    if (cached && !isPredictionStale(station.id)) {
      setAiPrediction({
        predicted_status: cached.predicted_status,
        ai_confidence: cached.ai_confidence,
        reasoning: cached.reasoning,
      });
    }
  };

  const handleReport = (station: Station) => {
    setSelectedStation(station);
    setShowStationSheet(false);
    setShowReportSheet(true);
  };

  const handleReportSubmit = async (data: {
    status: Exclude<StationStatus, 'unknown'>;
    waitMinutes?: number;
    photoUrl?: string;
  }) => {
    if (!selectedStation) return;

    try {
      const supabase = createClient();
      const response = await fetch(`/api/stations/${selectedStation.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: data.status,
          wait_minutes: data.waitMinutes,
          photo_url: data.photoUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit report');
      }

      const result = await response.json();

      setStations(
        stations.map((s) =>
          s.id === selectedStation.id
            ? {
                ...s,
                status: data.status as StationStatus,
                confidence: result.data.confidence,
                last_reported_at: new Date().toISOString(),
              }
            : s
        )
      );

      setShowReportSheet(false);
    } catch (error) {
      console.error('Report failed:', error);
      throw error;
    }
  };

  const handleConfirmFuel = async (station: Station) => {
    try {
      const response = await fetch(`/api/stations/${station.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: 'upvote' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm');
      }

      const result = await response.json();
      setUserConfirmed((prev) => ({ ...prev, [station.id]: result.data.confirmed }));

      if (result.data.new_confidence) {
        setStations(
          stations.map((s) =>
            s.id === station.id ? { ...s, confidence: result.data.new_confidence } : s
          )
        );
      }
    } catch (error) {
      console.error('Confirm failed:', error);
    }
  };

  const handleGetAIPrediction = async (station: Station) => {
    if (aiPrediction && !isPredictionStale(station.id)) return;

    setIsLoadingPrediction(true);
    try {
      const response = await fetch(`/api/stations/${station.id}/predict`);
      if (!response.ok) throw new Error('AI prediction unavailable');

      const result = await response.json();
      const pred = result.data;

      const prediction = {
        predicted_status: pred.predicted_status as StationStatus,
        ai_confidence: pred.ai_confidence,
        reasoning: pred.reasoning,
        cached_at: pred.cached_at,
      };

      setAiPrediction(prediction);
      setPrediction(station.id, prediction);
    } catch (error) {
      console.error('AI prediction failed:', error);
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  // Fall back to MOCK location only when real geolocation fails
  const userLat = geoLat ?? MOCK_USER_LAT;
  const userLng = geoLng ?? MOCK_USER_LNG;

  return (
    <div className="relative h-[calc(100vh-3.5rem-4rem)] overflow-hidden">
      {/* Map */}
      <MapView
        stations={filteredStations}
        userLat={userLat}
        userLng={userLng}
        onStationSelect={handleStationSelect}
        onMapLongPress={(lat, lng) => {}}
        className="rounded-b-card"
      />

      {/* Floating controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center gap-2 z-10">
        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterStatus(option.value as FilterValue)}
              className={`
                shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                ${filterStatus === option.value
                  ? 'bg-primary text-white shadow-glow-orange'
                  : 'bg-surface/90 text-text-muted hover:bg-surface-elevated hover:text-text-primary backdrop-blur-sm'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* AI Chat toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            showChat ? 'bg-primary text-white shadow-glow-orange' : 'bg-surface/90 text-text-muted hover:bg-surface-elevated backdrop-blur-sm'
          }`}
          title="AI Fuel Assistant"
        >
          {showChat ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        </button>
      </div>

      {/* Community Stats */}
      <div className="absolute top-20 left-4 z-10">
        <div className="bg-surface/90 backdrop-blur-sm rounded-btn px-3 py-2 text-xs flex items-center gap-3 border border-border">
          <div className="flex items-center gap-1 text-success">
            <Activity className="w-3 h-3" />
            <span className="font-mono">{communityStats.reportsToday}</span>
            <span className="text-text-muted">reports</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1 text-accent">
            <Users className="w-3 h-3" />
            <span className="font-mono">{communityStats.activeUsers}</span>
            <span className="text-text-muted">active</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1 text-primary">
            <span className="font-mono">{communityStats.stationsWithFuel}</span>
            <span className="text-text-muted">available</span>
          </div>
        </div>
      </div>

      {/* Visited stations badge */}
      {visitedStationIds.size > 0 && (
        <div className="absolute bottom-24 left-4 z-10">
          <div className="bg-surface/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-text-muted flex items-center gap-1.5 border border-border">
            <span className="text-lg">⚫</span>
            <span>{visitedStationIds.size} visited today</span>
          </div>
        </div>
      )}

      {/* AI Chat overlay */}
      {showChat && (
        <div className="absolute inset-0 z-20 bg-surface/95 backdrop-blur-sm">
          <div className="h-full max-w-md mx-auto bg-surface border-l border-border">
            <ChatAssistant />
          </div>
        </div>
      )}

      {/* Heartbeat indicator */}
      {heartbeatRunning && lastHeartbeat && (
        <div className="absolute top-36 right-4 z-10">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-surface/90 backdrop-blur-sm rounded-full text-xs text-success border border-border">
            <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Live</span>
          </div>
        </div>
      )}

      {/* Bottom station sheet */}
      <BottomSheet
        isOpen={showStationSheet && !!selectedStation}
        onClose={() => {
          setShowStationSheet(false);
          setSelectedStation(null);
          setAiPrediction(null);
        }}
        title="Station Details"
        snapPoints={[50, 80]}
      >
        {selectedStation && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-display font-bold text-text-primary">{selectedStation.name}</h3>
                <p className="text-sm text-text-muted mt-1">{selectedStation.address}</p>
              </div>
              {visitedStationIds.has(selectedStation.id) && (
                <span className="text-2xl shrink-0" title="Already visited today">⚫</span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge
                status={selectedStation.status}
                pulse={selectedStation.status === 'available'}
              />
              <ConfidenceBadge confidence={selectedStation.confidence} size="md" />
              {userConfirmed[selectedStation.id] && (
                <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
                  ✓ Confirmed
                </span>
              )}
            </div>

            {/* AI Prediction Panel */}
            {(selectedStation.status === 'unknown' || showAIPanel) && (
              <div className="p-3 bg-surface-elevated rounded-card border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary flex items-center gap-1">
                    🔮 AI Prediction
                  </span>
                  {!aiPrediction && (
                    <button
                      onClick={() => handleGetAIPrediction(selectedStation)}
                      disabled={isLoadingPrediction}
                      className="text-xs text-primary hover:text-primary-light disabled:opacity-50 transition-colors"
                    >
                      {isLoadingPrediction ? 'Analyzing...' : 'Get Prediction'}
                    </button>
                  )}
                </div>
                {aiPrediction ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={aiPrediction.predicted_status} size="sm" />
                      <span className="text-sm font-mono text-text-muted">
                        {aiPrediction.ai_confidence}% confidence
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{aiPrediction.reasoning}</p>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">No prediction available yet</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant={userConfirmed[selectedStation.id] ? 'secondary' : 'primary'}
                className="flex-1"
                onClick={() => handleConfirmFuel(selectedStation)}
              >
                <Navigation className="w-4 h-4 mr-2" />
                {userConfirmed[selectedStation.id] ? 'Confirmed ✓' : 'Confirm Fuel'}
              </Button>
              <Button className="flex-1 shadow-glow-orange" onClick={() => handleReport(selectedStation)}>
                <Plus className="w-4 h-4 mr-2" />
                Report
              </Button>
            </div>

            <Button variant="ghost" className="w-full" onClick={() => setShowAIPanel(!showAIPanel)}>
              {showAIPanel ? 'Hide AI Details' : 'Show AI Details'}
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Report form sheet */}
      <BottomSheet
        isOpen={showReportSheet && !!selectedStation}
        onClose={() => setShowReportSheet(false)}
        title="Report Status"
        snapPoints={[70, 90]}
      >
        {selectedStation && (
          <ReportForm
            station={selectedStation}
            onSubmit={handleReportSubmit}
            onCancel={() => setShowReportSheet(false)}
          />
        )}
      </BottomSheet>
    </div>
  );
}
