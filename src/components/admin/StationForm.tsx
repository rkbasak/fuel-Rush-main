'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  MapPin, 
  Fuel, 
  ShieldCheck, 
  Map as MapIcon,
  X,
  Plus
} from 'lucide-react';
import { Station, StationStatus } from '@/types';

interface StationFormProps {
  initialData?: Partial<Station>;
  onSubmit: (data: Partial<Station>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StationForm({ initialData, onSubmit, onCancel, isLoading }: StationFormProps) {
  const [formData, setFormData] = useState<Partial<Station>>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    lat: initialData?.lat || 23.8103,
    lng: initialData?.lng || 90.4125,
    status: initialData?.status || 'unknown',
    confidence: initialData?.confidence || 100,
    ...initialData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-0 bg-surface/10 border-white/5 overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">
                {initialData?.id ? 'Edit Station' : 'Manual Entry'}
              </h3>
              <p className="text-xs text-text-muted italic">Configure station parameters accurately.</p>
            </div>
         </div>
         <button onClick={onCancel} className="p-2 text-text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
         </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Section 1: Identity */}
           <div className="space-y-6">
              <div className="flex items-center gap-2 group">
                 <Fuel className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Station Identity</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Station Name</label>
                  <Input 
                    required
                    placeholder="e.g. Jamuna Fuel Station"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background/40 border-white/10 focus:border-primary/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Full Address</label>
                  <Input 
                    required
                    placeholder="e.g. 42 Gulshan Ave, Dhaka"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-background/40 border-white/10"
                  />
                </div>
              </div>
           </div>

           {/* Section 2: Geo Location */}
           <div className="space-y-6">
              <div className="flex items-center gap-2 group">
                 <MapIcon className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Geo-Coordinates</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Latitude</label>
                  <Input 
                    type="number"
                    step="0.000001"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                    className="bg-background/40 border-white/10 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-secondary">Longitude</label>
                  <Input 
                    type="number"
                    step="0.000001"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                    className="bg-background/40 border-white/10 font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-text-muted italic flex items-start gap-1">
                <ShieldCheck className="w-3 h-3 text-success shrink-0 mt-0.5" />
                These coordinates will accurately place the station on the interactive map.
              </p>
           </div>
        </div>

        {/* Section 3: Status */}
        <div className="pt-6 border-t border-white/5 space-y-4">
           <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Initial Status</label>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(['available', 'low', 'queue', 'empty', 'unknown'] as StationStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                    formData.status === status 
                    ? 'bg-primary text-white border-primary shadow-glow-orange' 
                    : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {status}
                </button>
              ))}
           </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
           <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
           <Button loading={isLoading} className="bg-primary text-white shadow-glow-orange min-w-[180px]">
             {initialData?.id ? 'Update Station' : 'Create Station Profile'}
           </Button>
        </div>
      </form>
    </Card>
  );
}
