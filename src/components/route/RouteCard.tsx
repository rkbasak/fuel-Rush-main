'use client';

import { PlannedRoute, RouteStop } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Navigation, Clock, MapPin, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { useState } from 'react';

interface RouteCardProps {
  route: PlannedRoute;
  onNavigate?: (stop: RouteStop) => void;
  isExpanded?: boolean;
}

export function RouteCard({ route, onNavigate, isExpanded: defaultExpanded = true }: RouteCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (route.stops.length === 0) {
    return (
      <Card className="text-center py-8">
        <div className="text-4xl mb-3">🗺️</div>
        <h3 className="font-medium text-text-primary mb-1">No route available</h3>
        <p className="text-sm text-muted">{route.ai_reasoning}</p>
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Route summary */}
      <div className="p-4 bg-surface-elevated border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-text-primary">Planned Route</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted">
            <Navigation className="w-4 h-4" />
            <span>{route.total_distance_km}km</span>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <Clock className="w-4 h-4" />
            <span>~{route.total_duration_min}min</span>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <MapPin className="w-4 h-4" />
            <span>{route.stops.length} stops</span>
          </div>
        </div>
      </div>

      {/* AI reasoning */}
      <div className="px-4 py-3 border-b border-border bg-primary/5">
        <div className="flex items-start gap-2">
          <Bot className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-text-secondary">{route.ai_reasoning}</p>
        </div>
      </div>

      {/* Stops */}
      {isExpanded && (
        <div className="p-2">
          {route.stops.map((stop, index) => (
            <div key={stop.station.id} className="relative">
              {/* Connector line */}
              {index < route.stops.length - 1 && (
                <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
              )}
              
              <div className="flex items-start gap-3 p-3 rounded-card hover:bg-surface transition-colors">
                {/* Step number */}
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-white font-semibold text-sm z-10">
                  {stop.order}
                </div>
                
                {/* Station info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-text-primary truncate">{stop.station.name}</h4>
                    <StatusBadge status={stop.station.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>{stop.distance_km}km</span>
                    <span>ETA: {stop.eta}</span>
                  </div>
                </div>

                {/* Navigate button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.(stop)}
                  className="shrink-0"
                >
                  <Navigation className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
