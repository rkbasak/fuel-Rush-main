'use client';

import { Station } from '@/types';
import { StationCard } from './StationCard';

interface StationListProps {
  stations: Station[];
  selectedId?: string | null;
  visitedIds?: string[];
  confirmedIds?: string[];
  userLat?: number;
  userLng?: number;
  onSelect: (station: Station) => void;
  onReport: (station: Station) => void;
}

export function StationList({
  stations,
  selectedId,
  visitedIds = [],
  confirmedIds = [],
  userLat,
  userLng,
  onSelect,
  onReport,
}: StationListProps) {
  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">⛽</span>
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-1">No stations found</h3>
        <p className="text-sm text-muted max-w-xs">
          Try adjusting your filters or moving the map to explore more areas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          userLat={userLat}
          userLng={userLng}
          isSelected={station.id === selectedId}
          isVisited={visitedIds.includes(station.id)}
          isConfirmed={confirmedIds.includes(station.id)}
          onSelect={onSelect}
          onReport={onReport}
        />
      ))}
    </div>
  );
}
