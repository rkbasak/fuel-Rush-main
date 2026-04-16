'use client';

import { useState, useEffect } from 'react';
import { VehicleType, VEHICLE_LIMITS } from '@/types';
import { useRationStore } from '@/stores';
import { RationGauge } from '@/components/ration/RationGauge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, ConfidenceBadge } from '@/components/ui/Badge';
import { Plus, Trash2, Bike, Car, Truck, Clock, Fuel, AlertTriangle, Star } from 'lucide-react';
import { MOCK_STATIONS } from '@/lib/mock-data';

const VEHICLE_ICONS: Record<VehicleType, React.ReactNode> = {
  motorcycle: <Bike className="w-5 h-5" />,
  sedan: <Car className="w-5 h-5" />,
  suv: <Truck className="w-5 h-5" />,
  commercial: <Truck className="w-5 h-5" />,
};

const VEHICLE_LABELS: Record<VehicleType, string> = {
  motorcycle: 'Motorcycle',
  sedan: 'Sedan (≤2000cc)',
  suv: 'SUV / Large Car',
  commercial: 'Commercial',
};

// Mock fuel-up history
const MOCK_HISTORY = [
  { id: '1', stationName: 'Petrobangla Fuel Station', amount: 4.5, time: '10:30 AM', date: 'Today' },
  { id: '2', stationName: 'Shahjalal Fuel Center', amount: 5.0, time: '9:15 AM', date: 'Yesterday' },
];

export default function RationPage() {
  const { vehicleType, setVehicleType, usedToday, visitsToday, resetIfNewDay, syncWithServer, startPolling, stopPolling, lastServerSync } = useRationStore();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [activeVehicles] = useState<VehicleType[]>(['sedan']);

  useEffect(() => {
    if (lastServerSync === 0 || Date.now() - lastServerSync > 24 * 60 * 60 * 1000) {
      syncWithServer();
    }
    resetIfNewDay();
    startPolling();
    return () => stopPolling();
  }, []);

  const currentLimits = VEHICLE_LIMITS[vehicleType as VehicleType];
  const limit = currentLimits.dailyLimit;
  const percentUsed = limit === Infinity ? 0 : Math.min(100, (usedToday / limit) * 100);

  return (
    <div className="px-4 py-4 space-y-6 animate-page-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">Ration Tracker</h1>
        <p className="text-sm text-text-muted mt-1">Track your daily fuel consumption</p>
      </div>

      {/* Main gauge */}
      <Card className="flex justify-center py-6 border border-border">
        <RationGauge vehicleType={vehicleType as VehicleType} />
      </Card>

      {/* Vehicle selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-semibold text-text-primary">My Vehicles</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddVehicle(!showAddVehicle)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {activeVehicles.map((vType) => (
            <Card
              key={vType}
              className={`
                cursor-pointer transition-all duration-200
                ${vehicleType === vType ? 'ring-2 ring-primary border-primary shadow-glow-orange' : 'hover:bg-surface-elevated'}
              `}
              onClick={() => setVehicleType(vType)}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center transition-all
                  ${vehicleType === vType ? 'bg-primary/20 text-primary' : 'bg-surface-elevated text-text-muted'}
                `}>
                  {VEHICLE_ICONS[vType]}
                </div>
                <div className="flex-1">
                  <div className="font-display font-medium text-text-primary">{VEHICLE_LABELS[vType]}</div>
                  <div className="text-xs text-text-muted">
                    {VEHICLE_LIMITS[vType].dailyLimit === Infinity
                      ? 'BPC Rules'
                      : `${VEHICLE_LIMITS[vType].dailyLimit}L daily · ${VEHICLE_LIMITS[vType].perStation}L per station`}
                  </div>
                </div>
                {vehicleType === vType && (
                  <div className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/20 px-2 py-1 rounded-full">
                    <Star className="w-3 h-3" /> Active
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center border border-border">
          <div className="text-2xl font-display font-bold text-text-primary font-mono">{visitsToday}</div>
          <div className="text-xs text-text-muted mt-1">Visits Today</div>
        </Card>
        <Card className="text-center border border-border">
          <div className="text-2xl font-display font-bold text-text-primary font-mono">{usedToday}L</div>
          <div className="text-xs text-text-muted mt-1">Used Today</div>
        </Card>
        <Card className="text-center border border-border">
          <div className={`text-2xl font-display font-bold font-mono ${
            percentUsed > 80 ? 'text-danger' : 'text-success'
          }`}>
            {limit === Infinity ? '∞' : `${limit - usedToday}L`}
          </div>
          <div className="text-xs text-text-muted mt-1">Remaining</div>
        </Card>
      </div>

      {/* Fuel-up history */}
      <div>
        <h2 className="text-lg font-display font-semibold text-text-primary mb-3">Recent Fill-ups</h2>
        {MOCK_HISTORY.length === 0 ? (
          <Card className="text-center py-8 border border-border">
            <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-3">
              <Fuel className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">No fill-ups logged yet</p>
            <p className="text-xs text-text-muted mt-1">Your fuel history will appear here</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {MOCK_HISTORY.map((log) => (
              <Card key={log.id} className="flex items-center gap-3 border border-border hover:bg-surface-elevated transition-colors">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <Fuel className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-primary truncate">{log.stationName}</div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="font-mono">{log.amount}L</span>
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    <span>{log.time}</span>
                    <span>·</span>
                    <span>{log.date}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reset notice */}
      <Card className="bg-warning/10 border border-warning/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">Midnight Reset</div>
            <div className="text-xs text-text-muted">
              Your daily ration resets at 00:00 BST (UTC+6)
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
