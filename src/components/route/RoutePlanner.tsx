'use client';

import { useState } from 'react';
import { Station, PlannedRoute } from '@/types';
import { optimizeRoute } from '@/lib/gemini/client';
import { RouteCard } from './RouteCard';

interface RoutePlannerProps {
  stations: Station[];
  userLat: number;
  userLng: number;
  onRouteComplete?: (route: PlannedRoute) => void;
}

export function RoutePlanner({ stations, userLat, userLng, onRouteComplete }: RoutePlannerProps) {
  const [targetFuel, setTargetFuel] = useState(10);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [route, setRoute] = useState<PlannedRoute | null>(null);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const result = await optimizeRoute(userLat, userLng, targetFuel, stations);
      setRoute(result);
      onRouteComplete?.(result);
    } catch (error) {
      console.error('Route optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Slider */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Target: {targetFuel}L
        </label>
        <input
          type="range"
          min={2}
          max={20}
          step={1}
          value={targetFuel}
          onChange={(e) => setTargetFuel(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Optimize button */}
      <button
        onClick={handleOptimize}
        disabled={isOptimizing}
        className="w-full bg-primary text-white py-2.5 rounded-btn font-medium disabled:opacity-50"
      >
        {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
      </button>

      {/* Route */}
      {route && <RouteCard route={route} />}
    </div>
  );
}
