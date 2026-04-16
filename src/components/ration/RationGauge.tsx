'use client';

import { VehicleType, VEHICLE_LIMITS } from '@/types';
import { useRationStore } from '@/stores';
import { formatFuel } from '@/utils';

interface RationGaugeProps {
  vehicleType?: VehicleType;
  compact?: boolean;
}

export function RationGauge({ vehicleType = 'sedan', compact = false }: RationGaugeProps) {
  const { usedToday, dailyLimit } = useRationStore();
  const limit = VEHICLE_LIMITS[vehicleType].dailyLimit;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - usedToday);
  const percentUsed = limit === Infinity ? 0 : Math.min(100, (usedToday / limit) * 100);

  const getProgressColor = () => {
    if (percentUsed > 80) return '#FF1744'; // danger
    if (percentUsed > 50) return '#FFB300';  // warning
    return '#00E676';                        // success
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${percentUsed}%`,
              backgroundColor: getProgressColor()
            }}
          />
        </div>
        <span className={`text-sm font-mono ${percentUsed > 80 ? 'text-danger' : 'text-success'}`}>
          {formatFuel(remaining)}
        </span>
      </div>
    );
  }

  const strokeColor = getProgressColor();
  const circumference = 2 * Math.PI * 42; // radius = 42
  const strokeDashoffset = circumference - (percentUsed / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Circular gauge */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#1E1E2E"
            strokeWidth="8"
          />
          {/* Progress circle with gradient effect */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out animate-progress-fill"
            style={{
              filter: `drop-shadow(0 0 6px ${strokeColor}50)`
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold text-text-primary font-mono">
            {formatFuel(remaining)}
          </span>
          <span className="text-xs text-text-muted">remaining</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-8 text-center">
        <div>
          <div className="text-lg font-semibold text-text-primary font-mono">{formatFuel(usedToday)}</div>
          <div className="text-xs text-text-muted">used today</div>
        </div>
        <div className="w-px bg-border" />
        <div>
          <div className="text-lg font-semibold text-text-primary font-mono">
            {limit === Infinity ? '∞' : formatFuel(limit)}
          </div>
          <div className="text-xs text-text-muted">daily limit</div>
        </div>
      </div>

      {/* Alert */}
      {percentUsed > 80 && (
        <div className="w-full bg-danger/10 border border-danger/30 rounded-card p-3 text-center animate-pulse">
          <span className="text-sm text-danger font-medium">
            ⚠️ Approaching daily limit ({Math.round(percentUsed)}% used)
          </span>
        </div>
      )}
    </div>
  );
}
