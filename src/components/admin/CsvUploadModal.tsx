'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Table } from 'lucide-react';
import Papa from 'papaparse';
import { Station } from '@/types';

interface CsvUploadModalProps {
  onAdd: (stations: Station[]) => void;
  onCancel: () => void;
}

export function CsvUploadModal({ onAdd, onCancel }: CsvUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<Station[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && (selected.type === 'text/csv' || selected.name.endsWith('.csv'))) {
      setFile(selected);
      setError(null);
      parseFile(selected);
    } else {
      setError('Please select a valid CSV file.');
    }
  };

  const parseFile = (file: File) => {
    setParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsing(false);
        const validated = mapAndValidate(results.data);
        if (validated.length === 0) {
          setError('No valid station data found in the CSV. Ensure headers for Name, Address, Lat, and Lng exist.');
        } else {
          setPreview(validated);
        }
      },
      error: (err) => {
        setParsing(false);
        setError('Error parsing CSV: ' + err.message);
      }
    });
  };

  const mapAndValidate = (data: unknown[]): Station[] => {
    return (data as Record<string, string>[]).map(row => {
      // Flexible mapping for common headers
      const name = row.name || row.Name || row.station_name || row.Station || '';
      const address = row.address || row.Address || row.location || row.Location || '';
      const lat = parseFloat(row.lat || row.Lat || row.latitude || row.Latitude || '0');
      const lng = parseFloat(row.lng || row.Lng || row.longitude || row.Longitude || '0');
      const status = row.status || row.Status || 'unknown';

      return {
        id: `csv-${Math.random().toString(36).substr(2, 9)}`,
        name,
        address,
        lat,
        lng,
        status: (status as import('@/types').StationStatus) || 'unknown',
        confidence: 100,
        last_reported_at: new Date().toISOString(),
        last_reporter_id: 'csv-import',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } satisfies Station;

    }).filter(s => s.name && s.lat !== 0 && s.lng !== 0);
  };

  const handleImport = () => {
    if (preview.length > 0) {
      onAdd(preview);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />
      
      <Card className="relative w-full max-w-2xl bg-surface/90 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-tight">Bulk Import Stations</h2>
              <p className="text-xs text-text-muted">Import a .csv file with coordinates and names.</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-lg text-text-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:bg-white/5 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors mb-4">
                  <FileText className="w-8 h-8 text-text-muted group-hover:text-primary" />
                </div>
                <p className="mb-2 text-sm text-white font-bold">Click to upload or drag and drop</p>
                <p className="text-xs text-text-muted">CSV (MAX. 5MB)</p>
              </div>
              <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{file.name}</div>
                    <div className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB • {preview.length} stations found</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview([]); setError(null); }}>
                  Change File
                </Button>
              </div>

              {parsing ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-text-muted">Parsing fuel stations...</p>
                </div>
              ) : error ? (
                <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest px-2">
                    <Table className="w-4 h-4" />
                    Data Preview
                  </div>
                  <div className="max-h-48 overflow-auto border border-white/5 rounded-xl bg-background/40">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-surface border-b border-white/5">
                        <tr>
                          <th className="px-3 py-2 text-text-muted">Name</th>
                          <th className="px-3 py-2 text-text-muted">Lat/Lng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {preview.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-white font-medium">{row.name}</td>
                            <td className="px-3 py-2 text-text-muted">{row.lat!.toFixed(4)}, {row.lng!.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.length > 10 && (
                    <p className="text-[10px] text-text-muted italic px-2">+ {preview.length - 10} more rows...</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-background/20 flex gap-3 justify-end items-center">
            <div className="flex-1">
               {preview.length > 0 && (
                 <p className="text-[10px] text-success/80 font-bold uppercase tracking-widest"> Ready for import </p>
               )}
            </div>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button 
            disabled={!preview.length || parsing}
            onClick={handleImport}
            className="shadow-glow-orange min-w-[140px]"
          >
            Import Stations
          </Button>
        </div>
      </Card>
    </div>
  );
}
