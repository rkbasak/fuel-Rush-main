'use client';

import { Station } from '@/types';
import { StatusBadge, ConfidenceBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPin, Navigation, Clock, Fuel, ThumbsUp, Star } from 'lucide-react';
import { formatDistance, timeAgo, calcDistance } from '@/utils';
import { useRationStore } from '@/stores';
import { useState } from 'react';

interface StationCardProps {
  station: Station;
  userLat?: number;
  userLng?: number;
  isSelected?: boolean;
  isVisited?: boolean;
  isConfirmed?: boolean;
  isAIPrediction?: boolean;
  onSelect?: (station: Station) => void;
  onReport?: (station: Station) => void;
  onConfirm?: (station: Station) => void;
}

export function StationCard({
  station,
  userLat,
  userLng,
  isSelected,
  isVisited,
  isConfirmed = false,
  isAIPrediction = false,
  onSelect,
  onReport,
  onConfirm,
}: StationCardProps) {
  const distance = userLat && userLng
    ? calcDistance(userLat, userLng, station.lat, station.lng)
    : null;

  const [isPressed, setIsPressed] = useState(false);

  return (
    <Card
      className={`
        cursor-pointer transition-all duration-150
        ${isSelected ? 'ring-2 ring-primary border-primary shadow-glow-orange' : ''}
        ${isVisited ? 'opacity-70' : ''}
        ${isPressed ? 'scale-[0.98]' : ''}
      `}
      onClick={() => onSelect?.(station)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Station info */}
        <div className="flex-1 min-w-0">
          {/* Name and badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-display font-semibold text-text-primary truncate">{station.name}</h3>
            {isAIPrediction && (
              <span className="shrink-0 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                <span>🔮</span> AI
              </span>
            )}
            {isVisited && (
              <span className="shrink-0 text-xs bg-neutral/20 text-neutral px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> Visited
              </span>
            )}
            {isConfirmed && (
              <span className="shrink-0 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> Confirmed
              </span>
            )}
          </div>

          {/* Address */}
          <div className="flex items-center gap-1 text-sm text-text-muted mb-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{station.address}</span>
          </div>

          {/* Status row */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={station.status} size="sm" pulse={station.status === 'available'} />
            <ConfidenceBadge confidence={station.confidence} />
            {distance !== null && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Navigation className="w-3 h-3" />
                {formatDistance(distance)}
              </span>
            )}
            {station.last_reported_at && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Clock className="w-3 h-3" />
                {timeAgo(station.last_reported_at)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            size="sm"
            variant={isConfirmed ? 'secondary' : 'ghost'}
            className="text-xs min-w-[80px]"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm?.(station);
            }}
          >
            <ThumbsUp className="w-3.5 h-3.5 mr-1" />
            {isConfirmed ? 'Confirmed' : 'Confirm'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs min-w-[80px]"
            onClick={(e) => {
              e.stopPropagation();
              onReport?.(station);
            }}
          >
            <Fuel className="w-3.5 h-3.5 mr-1" />
            Report
          </Button>
        </div>
      </div>
    </Card>
  );
}
