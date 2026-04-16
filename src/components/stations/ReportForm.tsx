'use client';

import { useState, useEffect } from 'react';
import { Station, StationStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Camera, X, ChevronRight, ChevronLeft, Search, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const STATUS_OPTIONS: {
  status: Exclude<StationStatus, 'unknown'>;
  emoji: string;
  label: string;
  description: string;
  color: string;
}[] = [
  { status: 'available', emoji: '🟢', label: 'Available', description: 'Fuel is available', color: 'bg-status-available' },
  { status: 'low', emoji: '🟡', label: 'Low Stock', description: 'Running out soon', color: 'bg-status-low' },
  { status: 'queue', emoji: '🟠', label: 'Long Queue', description: '>30 min wait', color: 'bg-status-queue' },
  { status: 'empty', emoji: '🔴', label: 'Empty', description: 'No fuel available', color: 'bg-status-empty' },
];

interface ReportFormProps {
  station?: Station; // Optional for new station flow
  onSubmit: (data: {
    status: Exclude<StationStatus, 'unknown'>;
    waitMinutes?: number;
    photoUrl?: string;
    stationId?: string;
  }) => Promise<void>;
  onCancel: () => void;
  preselectedStation?: Station | null;
}

type Step = 'station' | 'status' | 'wait' | 'photo' | 'confirm';

export function ReportForm({ station: initialStation, onSubmit, onCancel, preselectedStation }: ReportFormProps) {
  const [step, setStep] = useState<Step>(preselectedStation ? 'status' : 'station');
  const [selectedStation, setSelectedStation] = useState<Station | null>(preselectedStation || initialStation || null);
  const [selectedStatus, setSelectedStatus] = useState<Exclude<StationStatus, 'unknown'> | null>(null);
  const [waitMinutes, setWaitMinutes] = useState(30);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewStation, setShowNewStation] = useState(false);

  // Simulated station search (in real app, would use Google Places API)
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('stations')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .limit(5);

        setSearchResults(data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setSearchQuery('');
    setSearchResults([]);
    setStep('status');
  };

  const handleStatusSelect = (status: Exclude<StationStatus, 'unknown'>) => {
    setSelectedStatus(status);
    setStep(status === 'queue' ? 'wait' : 'photo');
  };

  const handleSubmit = async () => {
    if (!selectedStation || !selectedStatus) {
      setError('Please complete all steps');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSubmit({
        status: selectedStatus,
        waitMinutes: selectedStatus === 'queue' ? waitMinutes : undefined,
        photoUrl: photoUrl || undefined,
        stationId: selectedStation.id,
      });
    } catch (err) {
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'station':
        return !!selectedStation;
      case 'status':
        return !!selectedStatus;
      case 'wait':
        return true;
      case 'photo':
        return true;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const goBack = () => {
    switch (step) {
      case 'status':
        setStep('station');
        break;
      case 'wait':
      case 'photo':
        setStep('status');
        break;
      case 'confirm':
        setStep(selectedStatus === 'queue' ? 'wait' : 'photo');
        break;
    }
  };

  const calculateConfidencePreview = () => {
    const baseScore = photoUrl ? 60 : 40;
    const photoBonus = photoUrl ? 10 : 0;
    return Math.min(100, baseScore + photoBonus);
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-1 mb-4">
        {['station', 'status', 'photo', 'confirm'].map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded ${
              ['station', 'status', 'wait', 'photo', 'confirm'].indexOf(step) >= i
                ? 'bg-primary'
                : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Step: Station Selection */}
      {step === 'station' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-text-primary">Select Station</h3>
            <p className="text-sm text-muted mt-1">Search for a fuel station</p>
          </div>

          <div className="relative">
            <Input
              type="text"
              placeholder="Search stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map((station) => (
                <button
                  key={station.id}
                  onClick={() => handleStationSelect(station)}
                  className="w-full p-3 bg-surface-elevated rounded-card text-left hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">{station.name}</p>
                      <p className="text-xs text-muted">{station.address}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="text-center pt-2">
            <button
              onClick={() => setShowNewStation(!showNewStation)}
              className="text-sm text-primary hover:text-primary/80"
            >
              Station not listed? Add new station
            </button>
          </div>

          {showNewStation && (
            <Card className="p-4 bg-surface-elevated">
              <p className="text-sm text-muted text-center">
                New station creation would open a form here.
                <br />
                <span className="text-xs">(Powered by Google Places API)</span>
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Step: Status Selection */}
      {step === 'status' && selectedStation && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted">What&apos;s the current status at</p>
            <h3 className="font-semibold text-text-primary">{selectedStation.name}</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STATUS_OPTIONS.map(({ status, emoji, label, description, color }) => (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                className={`
                  flex flex-col items-center p-4 rounded-card border transition-all
                  ${selectedStatus === status
                    ? 'border-primary bg-primary/10 ring-2 ring-primary'
                    : 'border-border bg-surface hover:bg-surface-elevated'
                  }
                `}
              >
                <span className={`w-4 h-4 rounded-full ${color} mb-2`} />
                <span className="text-2xl mb-1">{emoji}</span>
                <span className="font-medium text-text-primary text-sm">{label}</span>
                <span className="text-xs text-muted">{description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Wait Time (only for queue) */}
      {step === 'wait' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted">Estimated wait time</p>
            <h3 className="font-semibold text-text-primary text-3xl font-mono text-primary">
              {waitMinutes} min
            </h3>
          </div>

          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={waitMinutes}
            onChange={(e) => setWaitMinutes(Number(e.target.value))}
            className="w-full accent-primary"
          />

          <div className="flex justify-between text-xs text-muted">
            <span>5 min</span>
            <span>30 min</span>
            <span>60 min</span>
            <span>120 min</span>
          </div>

          <Button
            className="w-full"
            onClick={() => setStep('photo')}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step: Photo */}
      {step === 'photo' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-text-primary">Add Photo</h3>
            <p className="text-sm text-muted mt-1">Optional but increases confidence</p>
          </div>

          <div className="relative">
            <Input
              type="url"
              placeholder="https://... (photo URL)"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              icon={<Camera className="w-4 h-4" />}
            />
            {photoUrl && (
              <button
                onClick={() => setPhotoUrl('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {photoUrl && (
            <div className="bg-surface-elevated rounded-card p-2 text-center">
              <p className="text-xs text-muted">Photo URL entered</p>
              <p className="text-xs text-accent mt-1">+10 confidence bonus</p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => setStep('confirm')}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && selectedStation && selectedStatus && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-text-primary mb-4">Confirm Report</h3>
          </div>

          <Card className="bg-surface-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Station</span>
              <span className="text-sm font-medium text-text-primary">{selectedStation.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Status</span>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full bg-status-${selectedStatus}`} />
                <span className="text-sm font-medium text-text-primary capitalize">{selectedStatus}</span>
              </div>
            </div>
            {selectedStatus === 'queue' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Wait Time</span>
                <span className="text-sm font-mono text-text-primary">{waitMinutes} min</span>
              </div>
            )}
            {photoUrl && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Photo</span>
                <span className="text-xs text-accent">✓ Attached</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm text-muted">Confidence Score</span>
              <span className="text-sm font-mono text-primary">
                ~{calculateConfidencePreview()}%
              </span>
            </div>
          </Card>

          {error && (
            <p className="text-sm text-danger text-center">{error}</p>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-2">
        {step !== 'station' && (
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={goBack}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
        <Button
          type="button"
          className="flex-1"
          loading={isLoading}
          disabled={!canProceed()}
          onClick={step === 'confirm' ? handleSubmit : undefined}
        >
          {step === 'confirm' ? 'Submit Report' : 'Continue'}
          {step !== 'confirm' && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
}
