import { StationStatus } from '@/types';
import { getStatusColor, getStatusEmoji, getStatusLabel } from '@/utils';

interface StatusBadgeProps {
  status: StationStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function StatusBadge({ status, showLabel = true, size = 'md', pulse = false }: StatusBadgeProps) {
  const colorClass = getStatusColor(status);
  const emoji = getStatusEmoji(status);
  const label = getStatusLabel(status);

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : 'text-sm px-3 py-1 gap-1.5';

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full uppercase tracking-wide
        ${sizeClasses}
        ${colorClass}/20
      `}
    >
      <span 
        className={`
          inline-block rounded-full ${dotSize} ${colorClass} 
          ${pulse && status === 'available' ? 'animate-pulse' : ''}
        `} 
      />
      {emoji}
      {showLabel && <span>{label}</span>}
    </span>
  );
}

interface ConfidenceBadgeProps {
  confidence: number;
  size?: 'sm' | 'md';
}

export function ConfidenceBadge({ confidence, size = 'sm' }: ConfidenceBadgeProps) {
  const colorClass = confidence > 70 
    ? 'text-success' 
    : confidence > 40 
      ? 'text-warning' 
      : 'text-danger';
  
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className={`font-mono font-medium ${colorClass} ${sizeClass}`}>
      {confidence}%
    </span>
  );
}

interface TrustBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function TrustBadge({ score, size = 'sm' }: TrustBadgeProps) {
  const getBadgeInfo = (s: number) => {
    if (s >= 80) return { label: 'Trusted', color: 'text-success', bg: 'bg-success/20' };
    if (s >= 50) return { label: 'Member', color: 'text-accent', bg: 'bg-accent/20' };
    return { label: 'New', color: 'text-neutral', bg: 'bg-neutral/20' };
  };

  const badge = getBadgeInfo(score);
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${badge.bg} ${badge.color} ${sizeClass}`}>
      <span className="text-sm">🏅</span>
      <span>{badge.label}</span>
    </span>
  );
}
