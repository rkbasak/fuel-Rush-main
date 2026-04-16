'use client';

import { useState, useEffect } from 'react';
import { Station, StationStatus, RouteOptimizationResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStationStore, useRationStore } from '@/stores';
import { MOCK_STATIONS, MOCK_USER_LAT, MOCK_USER_LNG } from '@/lib/mock-data';
import { Navigation, Bot, Loader2, Fuel, AlertTriangle } from 'lucide-react';

export default function RoutePage() {
  const { stations, setStations } = useStationStore();
  const { visitedStationIds, litersRemaining, vehicleType, canVisitStation, routeOptimizing, setRouteOptimizing, setCurrentRoute, currentRoute } = useRationStore();
  const [optimizedRoute, setOptimizedRoute] = useState<RouteOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (stations.length === 0) setStations(MOCK_STATIONS); }, [stations.length, setStations]);

  const handleOptimize = async () => {
    setRouteOptimizing(true);
    setError(null);
    try {
      const res = await fetch('/api/routes/optimize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_lat: MOCK_USER_LAT, start_lng: MOCK_USER_LNG, fuel_needed_liters: Math.min(litersRemaining, 20) }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setOptimizedRoute(data.data);
      setCurrentRoute(data.data);
    } catch { setError('Failed to optimize route. Please try again.'); }
    finally { setRouteOptimizing(false); }
  };

  const availableStations = stations.filter((s) => s.status !== 'empty' && s.status !== 'unknown' && canVisitStation(s.id));
  const visitableCount = availableStations.length;

  const statusColors: Record<StationStatus, string> = { available: 'text-status-available', low: 'text-status-low', queue: 'text-status-queue', empty: 'text-status-empty', unknown: 'text-muted' };
  const statusEmoji: Record<StationStatus, string> = { available: '🟢', low: '🟡', queue: '🟠', empty: '🔴', unknown: '⚫' };

  return (
    <div className="px-4 py-4 space-y-6">
      <div><h1 className="text-2xl font-bold text-text-primary">Smart Route</h1><p className="text-sm text-muted mt-1">AI-optimized multi-stop routing</p></div>

      <Card className="bg-surface-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Fuel className="w-5 h-5 text-accent" /><div><div className="text-sm font-medium text-text-primary">{litersRemaining === Infinity ? '∞L remaining' : `${litersRemaining}L remaining`}</div><div className="text-xs text-muted">{vehicleType} · {visitableCount} stations visitable</div></div></div>
          {visitedStationIds.size > 0 && <div className="flex items-center gap-1 text-xs text-muted"><span>⚫</span><span>{visitedStationIds.size} visited today</span></div>}
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2"><Bot className="w-5 h-5 text-primary" /><h2 className="font-semibold text-text-primary">AI Route Optimizer</h2></div>
          <div className="text-sm text-muted">
            <p>Smart Route considers:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Your remaining daily ration ({litersRemaining}L)</li><li>Already-visited stations (excluded)</li><li>Real-time station status &amp; confidence</li><li>Distance &amp; traffic time optimization</li>
            </ul>
          </div>
          {visitedStationIds.size > 0 && <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-card"><AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" /><div className="text-xs text-warning">{visitedStationIds.size} station(s) already visited are excluded</div></div>}
          {visitableCount === 0 && <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/30 rounded-card"><AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" /><div className="text-xs text-danger">No visitable stations available.</div></div>}
          <Button className="w-full" onClick={handleOptimize} loading={routeOptimizing} disabled={routeOptimizing || visitableCount === 0}>
            {routeOptimizing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI Optimizing Route...</> : <><Navigation className="w-4 h-4 mr-2" />Find Best Route</>}
          </Button>
        </div>
      </Card>

      {optimizedRoute && (
        <div className="space-y-4 animate-fade-in">
          {optimizedRoute.ai_reasoning && <Card className="bg-primary/5 border border-primary/20"><div className="flex items-start gap-2"><Bot className="w-4 h-4 text-primary shrink-0 mt-0.5" /><p className="text-sm text-text-secondary">{optimizedRoute.ai_reasoning}</p></div></Card>}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center py-3"><div className="text-lg font-bold text-text-primary font-mono">{optimizedRoute.stops.filter((s) => s.station.id !== 'destination').length}</div><div className="text-xs text-muted">Stops</div></Card>
            <Card className="text-center py-3"><div className="text-lg font-bold text-text-primary font-mono">{optimizedRoute.total_distance_km}km</div><div className="text-xs text-muted">Total Distance</div></Card>
            <Card className="text-center py-3"><div className="text-lg font-bold text-text-primary font-mono">{optimizedRoute.total_duration_min}min</div><div className="text-xs text-muted">Est. Duration</div></Card>
          </div>
          {optimizedRoute.stops.filter((s) => s.station.id !== 'destination').map((stop, idx, arr) => {
            const stationStatus = stop.station.status as StationStatus;
            return (
              <Card key={stop.station.id} className="relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <div className="flex items-start gap-3 pl-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><span className="text-sm font-bold text-primary">{stop.order}</span></div>
                    {idx < arr.length - 1 && <div className="w-px h-6 bg-border" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-medium text-text-primary truncate">{stop.station.name}</span><span className={`text-sm ${statusColors[stationStatus]}`}>{statusEmoji[stationStatus]}</span></div>
                    <div className="text-xs text-muted mt-0.5 truncate">{stop.station.address}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted"><span>{stop.distance_km}km</span><span>ETA: {stop.eta}</span><span>{stop.station.confidence}% confidence</span></div>
                  </div>
                </div>
              </Card>
            );
          })}
          <Button className="w-full" variant="secondary"><Navigation className="w-4 h-4 mr-2" />Start Navigation</Button>
        </div>
      )}

      {error && <Card className="bg-danger/10 border border-danger/30"><p className="text-sm text-danger">{error}</p></Card>}

      {!optimizedRoute && !routeOptimizing && (
        <Card className="text-center py-12"><div className="text-5xl mb-4">🗺️</div><h3 className="text-lg font-medium text-text-primary mb-2">Plan Your Fuel Run</h3><p className="text-sm text-muted max-w-xs mx-auto">Let our AI find the optimal route considering your ration, visited stations, and real-time availability.</p></Card>
      )}
    </div>
  );
}
