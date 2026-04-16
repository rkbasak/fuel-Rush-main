'use client';

import { useState, useEffect } from 'react';
import { Station, StationStatus } from '@/types';
import { useStationStore } from '@/stores';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { StatusBadge, ConfidenceBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StationList } from '@/components/stations/StationList';
import { ReportForm } from '@/components/stations/ReportForm';
import { MOCK_STATIONS, MOCK_USER_LAT, MOCK_USER_LNG } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';
import { Search, Filter, MapPin } from 'lucide-react';

const FILTER_OPTIONS: { label: string; value: StationStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Low Stock', value: 'low' },
  { label: 'Queue', value: 'queue' },
  { label: 'Empty', value: 'empty' },
  { label: 'Unknown', value: 'unknown' },
];

export default function StationsPage() {
  const { stations, setStations, filterStatus, setFilterStatus, selectedStationId } = useStationStore();
  const [showDetail, setShowDetail] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);

  const userLat = MOCK_USER_LAT;
  const userLng = MOCK_USER_LNG;

  useEffect(() => {
    if (stations.length === 0) {
      setStations(MOCK_STATIONS);
    }
  }, [stations.length, setStations]);

  // Fetch visited and confirmed station IDs on mount
  useEffect(() => {
    const fetchStationIds = async () => {
      try {
        // Fetch visited station IDs from ration API
        const visitedRes = await fetch('/api/ration/visited');
        if (visitedRes.ok) {
          const { data } = await visitedRes.json();
          setVisitedIds(data?.visited_ids || []);
        }

        // Fetch confirmed station IDs
        const confirmedRes = await fetch('/api/stations/confirmed');
        if (confirmedRes.ok) {
          const { data } = await confirmedRes.json();
          setConfirmedIds(data?.confirmed_ids || []);
        }
      } catch (error) {
        console.error('Failed to fetch station IDs:', error);
      }
    };

    fetchStationIds();
  }, []);

  const filteredStations = (() => {
    let result = stations;

    if (filterStatus !== 'all') {
      result = result.filter((s) => s.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query)
      );
    }

    return result;
  })();

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setShowDetail(true);
  };

  const handleReport = (station: Station) => {
    setSelectedStation(station);
    setShowDetail(false);
    setShowReport(true);
  };

  const handleConfirm = async (station: Station) => {
    try {
      const response = await fetch(`/api/stations/${station.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: 'upvote' }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data.confirmed) {
          setConfirmedIds((prev) => [...prev, station.id]);
          // Refresh stations
          setStations(
            stations.map((s) =>
              s.id === station.id
                ? { ...s, confidence: result.data.new_confidence || s.confidence }
                : s
            )
          );
        } else {
          setConfirmedIds((prev) => prev.filter((id) => id !== station.id));
        }
      }
    } catch (error) {
      console.error('Confirm failed:', error);
    }
  };

  const handleReportSubmit = async (data: {
    status: Exclude<StationStatus, 'unknown'>;
    waitMinutes?: number;
    photoUrl?: string;
    stationId?: string;
  }) => {
    const targetStation = selectedStation || stations.find((s) => s.id === data.stationId);
    if (!targetStation) return;

    try {
      const response = await fetch(`/api/stations/${targetStation.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: data.status,
          wait_minutes: data.waitMinutes,
          photo_url: data.photoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Report failed');
      }

      const result = await response.json();

      // Update local state
      setStations(
        stations.map((s) =>
          s.id === targetStation.id
            ? {
                ...s,
                status: data.status as StationStatus,
                confidence: result.data.confidence,
                last_reported_at: new Date().toISOString(),
              }
            : s
        )
      );

      setShowReport(false);
      setSelectedStation(null);
    } catch (error) {
      console.error('Report submit failed:', error);
      throw error;
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search stations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-card text-text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilterStatus(option.value)}
            className={`
              shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${filterStatus === option.value
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:bg-surface-elevated'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Station count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Station list */}
      <StationList
        stations={filteredStations}
        selectedId={selectedStationId}
        visitedIds={visitedIds}
        confirmedIds={confirmedIds}
        userLat={userLat}
        userLng={userLng}
        onSelect={handleStationSelect}
        onReport={handleReport}
      />

      {/* Station detail sheet */}
      <BottomSheet
        isOpen={showDetail && !!selectedStation}
        onClose={() => {
          setShowDetail(false);
          setSelectedStation(null);
        }}
        title="Station Details"
        snapPoints={[50, 80]}
      >
        {selectedStation && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-text-primary">{selectedStation.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedStation.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge
                status={selectedStation.status}
                pulse={selectedStation.status === 'available'}
              />
              <ConfidenceBadge confidence={selectedStation.confidence} size="md" />
              {confirmedIds.includes(selectedStation.id) && (
                <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                  ✓ Confirmed
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant={confirmedIds.includes(selectedStation.id) ? 'secondary' : 'primary'}
                className="flex-1"
                onClick={() => handleConfirm(selectedStation)}
              >
                {confirmedIds.includes(selectedStation.id) ? 'Confirmed ✓' : 'Confirm Fuel'}
              </Button>
              <Button className="flex-1" onClick={() => handleReport(selectedStation)}>
                Report Status
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Report form sheet */}
      <BottomSheet
        isOpen={showReport && !!selectedStation}
        onClose={() => setShowReport(false)}
        title="Report Status"
        snapPoints={[70, 90]}
      >
        {selectedStation && (
          <ReportForm
            station={selectedStation}
            onSubmit={handleReportSubmit}
            onCancel={() => setShowReport(false)}
          />
        )}
      </BottomSheet>
    </div>
  );
}
