'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Fuel,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Sparkles,
  UploadCloud
} from 'lucide-react';
import { MOCK_STATIONS } from '@/lib/mock-data';
import { Station, StationStatus } from '@/types';
import { DiscoveryModal } from '@/components/admin/DiscoveryModal';
import { StationForm } from '@/components/admin/StationForm';
import { CsvUploadModal } from '@/components/admin/CsvUploadModal';


export default function AdminStations() {
  const [stations, setStations] = useState<Station[]>(MOCK_STATIONS);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'add' | 'discover' | 'csv'>('list');


  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddStations = (newStations: Station[]) => {
    setStations(prev => [...newStations, ...prev]);
    setView('list');
  };

  const handleManualAdd = (data: Partial<Station>) => {
    const newStation: Station = {
      id: `manual-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name || 'Unnamed',
      address: data.address || 'Unknown',
      lat: data.lat || 23.8,
      lng: data.lng || 90.4,
      status: data.status || 'unknown',
      confidence: data.confidence || 100,
      last_reported_at: new Date().toISOString(),
      last_reporter_id: 'admin-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setStations(prev => [newStation, ...prev]);
    setView('list');
  };

  const getStatusBadge = (status: StationStatus) => {
    const styles = {
      available: 'bg-success/20 text-success border-success/30',
      low: 'bg-warning/20 text-warning border-warning/30',
      queue: 'bg-accent/20 text-accent border-accent/30',
      empty: 'bg-danger/20 text-danger border-danger/40',
      unknown: 'bg-surface-elevated text-text-muted border-white/5',
    };
    
    const icons = {
      available: <CheckCircle2 className="w-3 h-3" />,
      low: <AlertCircle className="w-3 h-3" />,
      queue: <Clock className="w-3 h-3" />,
      empty: <XCircle className="w-3 h-3" />,
      unknown: <Search className="w-3 h-3" />,
    };

    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
        {icons[status]}
        {status}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-page-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Stations</h1>
          <p className="text-sm text-text-muted mt-1">
            Maintain the accuracy of the fuel grid. Add new providers or edit status overrides.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setView('discover')}
            variant="secondary" 
            className="border-accent/30 hover:border-accent hover:bg-accent/5 text-accent"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Discover with AI
          </Button>
          <Button 
            onClick={() => setView('csv')}
            variant="secondary" 
            className="border-white/10 hover:border-white/20 hover:bg-white/5 text-text-muted"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button 
            onClick={() => setView('add')}

            className="shadow-glow-orange min-w-[160px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Station
          </Button>
        </div>
      </div>

      {view === 'discover' && (
        <DiscoveryModal onAdd={handleAddStations} onCancel={() => setView('list')} />
      )}

      {view === 'csv' && (
        <CsvUploadModal onAdd={handleAddStations} onCancel={() => setView('list')} />
      )}


      {view === 'add' && (
        <StationForm onSubmit={handleManualAdd} onCancel={() => setView('list')} />
      )}

      {view === 'list' && (
        <>
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input 
                placeholder="Search by station name or locality..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 bg-[#111116] border-white/5 h-10 text-sm"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" className="h-10 px-4 text-xs font-semibold bg-[#111116] border-white/5 hover:bg-white/[0.08]">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="secondary" className="h-10 px-4 text-xs font-semibold bg-[#111116] border-white/5 hover:bg-white/[0.08]">
                Sort: Newest
              </Button>
            </div>
          </div>

          {/* Stations Grid/List */}
          <div className="bg-[#111116] border border-white/5 rounded-2xl overflow-hidden mt-6">
            <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Station Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Confidence</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Last Update</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredStations.map((station) => (
                <tr key={station.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-white/5 flex items-center justify-center">
                        <Fuel className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{station.name}</div>
                        <div className="text-xs text-text-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {station.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(station.status)}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <span className={`text-xs font-mono font-bold ${
                         station.confidence > 80 ? 'text-success' : station.confidence > 50 ? 'text-warning' : 'text-danger'
                       }`}>
                         {station.confidence}%
                       </span>
                       <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full ${
                             station.confidence > 80 ? 'bg-success' : station.confidence > 50 ? 'bg-warning' : 'bg-danger'
                           }`} 
                           style={{ width: `${station.confidence}%` }}
                         />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-text-muted">
                      {station.last_reported_at ? new Date(station.last_reported_at).toLocaleTimeString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-primary/20 hover:text-primary transition-all">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-danger/20 hover:text-danger transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
