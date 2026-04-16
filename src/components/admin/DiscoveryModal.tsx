'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Search, 
  MapPin, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  X,
  History,
  AlertTriangle,
  Zap,
  ChevronRight
} from 'lucide-react';
import { Station } from '@/types';

interface DiscoveryModalProps {
  onAdd: (stations: Station[]) => void;
  onCancel: () => void;
}

export function DiscoveryModal({ onAdd, onCancel }: DiscoveryModalProps) {
  const [location, setLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<Partial<Station>[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!location) return;
    setIsScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stations/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.stations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to scan area');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelect = (idx: number) => {
    const next = new Set(selectedIds);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIds(next);
  };

  const handleCommit = () => {
    const selected = results
      .filter((_, idx) => selectedIds.has(idx))
      .map(s => ({
        ...s, 
        id: `discovered-${Math.random().toString(36).substr(2, 9)}`,
        last_reported_at: new Date().toISOString(),
        last_reporter_id: 'ai-discovery',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Station));

    onAdd(selected);
  };

  return (
    <Card className="p-0 bg-surface/10 border-white/5 overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">AI Area Scanning</h3>
              <p className="text-xs text-text-muted italic">Identify fuel infrastructure automatically.</p>
            </div>
         </div>
         <button onClick={onCancel} className="p-2 text-text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
         </button>
      </div>

      <div className="p-8 space-y-8">
        {results.length === 0 ? (
          <div className="space-y-6">
             <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-text-muted leading-relaxed">
                  <strong>AI Scan Tip:</strong> Enter a specific neighborhood or city (e.g., "Banani, Dhaka"). Our engine will query Google Maps and use Gemini to refine the station data.
                </p>
             </div>
             
             <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
               <Input 
                 placeholder="Where should we look for fuel?" 
                 value={location}
                 onChange={(e) => setLocation(e.target.value)}
                 className="pl-12 h-14 bg-background/40 border-white/10 text-lg"
                 onKeyDown={(e) => e.key === 'Enter' && handleScan()}
               />
               <div className="absolute inset-x-0 bottom-[-2px] h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
             </div>

             {error && <p className="text-xs text-danger text-center">{error}</p>}

             <Button 
               onClick={handleScan}
               disabled={!location || isScanning}
               className="w-full h-12 bg-primary text-white shadow-glow-orange group overflow-hidden"
             >
               {isScanning ? (
                 <span className="flex items-center gap-2">
                   <Loader2 className="w-4 h-4 animate-spin" />
                   Analyzing the grid...
                 </span>
               ) : (
                 <span className="flex items-center gap-2">
                   Scan Area with AI <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </span>
               )}
               <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 transition-transform duration-300 scale-x-0 group-hover:scale-x-100" />
             </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-page-in">
             <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  Discovered {results.length} Potential Stations
                </div>
                <button onClick={() => setResults([])} className="text-[10px] text-primary hover:underline">New Search</button>
             </div>

             <div className="max-h-[360px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {results.map((station, i) => (
                  <Card 
                    key={i} 
                    onClick={() => toggleSelect(i)}
                    className={`p-4 cursor-pointer border-white/5 group relative transition-all duration-300 ${
                      selectedIds.has(i) ? 'bg-primary/10 border-primary/30' : 'bg-surface/20 hover:bg-surface-elevated/20'
                    }`}
                  >
                     <div className="flex items-start gap-4 pr-10">
                        <div className={`p-3 rounded-xl border ${
                          selectedIds.has(i) ? 'bg-primary text-white border-primary/50 shadow-glow-orange' : 'bg-surface-elevated text-text-muted border-white/5'
                        }`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                           <div className="text-sm font-bold text-white leading-tight">{station.name}</div>
                           <div className="text-[10px] text-text-muted flex items-center gap-1 mt-1">
                             <MapPin className="w-3 h-3" />
                             {station.address}
                           </div>
                        </div>
                     </div>
                     <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                       selectedIds.has(i) ? 'bg-primary border-primary' : 'border-white/10'
                     }`}>
                        {selectedIds.has(i) && <CheckCircle2 className="w-4 h-4 text-white" />}
                     </div>
                  </Card>
                ))}
             </div>

             <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] text-text-muted uppercase tracking-widest">{selectedIds.size} stations selected for import</div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={onCancel} type="button">Discard</Button>
                  <Button 
                    onClick={handleCommit} 
                    disabled={selectedIds.size === 0}
                    className="bg-accent text-white shadow-glow-accent min-w-[160px]"
                  >
                    Commit to Grid
                  </Button>
                </div>
             </div>
          </div>
        )}
      </div>
    </Card>
  );
}
