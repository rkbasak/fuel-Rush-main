'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  MapPin, 
  History,
  ShieldAlert,
  ChevronRight,
  Filter,
  Search,
  Zap,
  Fuel
} from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface Report {
  id: string;
  station: string;
  user: string;
  userTrust: number;
  reportType: string;
  value: string;
  time: string;
  confidence: number;
  status: 'pending' | 'verified' | 'rejected';
}

const MOCK_REPORTS: Report[] = [
  { id: '1', station: 'Petrobangla Fuel', user: 'Rahat Islam', userTrust: 84, reportType: 'Shortage', value: 'Low Stock', time: '2m ago', confidence: 95, status: 'pending' },
  { id: '2', station: 'Jamuna Station', user: 'Adnan Sami', userTrust: 92, reportType: 'Queue', value: 'Over 20 cars', time: '12m ago', confidence: 82, status: 'pending' },
  { id: '3', station: 'Padma Petroleum', user: 'Zahin Ahmed', userTrust: 45, reportType: 'Rationing', value: 'Strictly 5L', time: '24m ago', confidence: 64, status: 'pending' },
  { id: '4', station: 'Shahjalal Gas', user: 'Mousumi Akter', userTrust: 78, reportType: 'Refilled', value: 'Stock Replenished', time: '45m ago', confidence: 91, status: 'pending' },
];

export default function ModerationQueue() {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected'>('pending');

  const handleAction = (id: string, newStatus: 'verified' | 'rejected') => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const filteredReports = reports.filter(r => r.status === activeTab);

  return (
    <div className="space-y-6 lg:space-y-8 animate-page-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            Moderation Queue
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Verify platform reports to filter out fraud and maintain high data integrity.
          </p>
        </div>
        <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5">
          {(['pending', 'verified', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-text-muted hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#111116] border border-white/5 rounded-2xl flex items-center gap-4">
           <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
             <Clock className="w-4 h-4" />
           </div>
           <div>
             <div className="text-xl font-display font-bold text-white leading-none mb-1">12</div>
             <div className="text-[10px] text-text-muted uppercase tracking-widest">Pending Verify</div>
           </div>
        </div>
        <div className="p-4 bg-[#111116] border border-white/5 rounded-2xl flex items-center gap-4">
           <div className="p-2 rounded-lg bg-success/10 border border-success/20 text-success">
             <ShieldAlert className="w-4 h-4" />
           </div>
           <div>
             <div className="text-xl font-display font-bold text-white leading-none mb-1">94%</div>
             <div className="text-[10px] text-text-muted uppercase tracking-widest">System Authenticity</div>
           </div>
        </div>
        <div className="p-4 bg-[#111116] border border-white/5 rounded-2xl flex items-center gap-4">
           <div className="p-2 rounded-lg bg-danger/10 border border-danger/20 text-danger">
             <AlertTriangle className="w-4 h-4" />
           </div>
           <div>
             <div className="text-xl font-display font-bold text-white leading-none mb-1">3</div>
             <div className="text-[10px] text-text-muted uppercase tracking-widest">Flagged Today</div>
           </div>
        </div>
      </div>

      {/* Reports Feed */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center bg-[#111116] border-dashed border-white/10 rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-success opacity-30 mb-4" />
            <h3 className="text-lg font-display font-bold text-white opacity-60">Queue Crystal Clear.</h3>
            <p className="text-text-muted text-xs mt-2 italic">
              All user reports for this category have been processed.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="bg-[#111116] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors group">
              <div className="flex flex-col lg:flex-row lg:items-center">
                {/* Left Side: Report info */}
                <div className="flex-1 p-5 flex flex-col md:flex-row md:items-center gap-6">
                   <div className="flex items-start gap-4 min-w-[200px]">
                      <div className="w-10 h-10 mt-1 bg-white/[0.03] rounded-xl flex items-center justify-center border border-white/5">
                        <Fuel className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white leading-tight">{report.station}</div>
                        <div className="text-[11px] text-text-muted flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          Reported {report.time}
                        </div>
                      </div>
                   </div>

                   <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6 items-center">
                     <div>
                       <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1.5">User & Trust</div>
                       <div className="flex items-center gap-2">
                         <span className="text-xs font-semibold text-white truncate">{report.user}</span>
                         <span className="text-[9px] font-mono text-success font-bold px-1.5 py-0.5 rounded border border-success/20 bg-success/10 shrink-0">
                           {report.userTrust}%
                         </span>
                       </div>
                     </div>

                     <div className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <div className="text-[9px] text-text-muted uppercase tracking-widest mb-0.5">{report.reportType}</div>
                        <div className="text-xs font-bold text-white">{report.value}</div>
                     </div>

                     <div className="hidden lg:block">
                        <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1.5">Confidence</div>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${report.confidence > 80 ? 'bg-success' : 'bg-warning'} animate-pulse`} />
                          <span className="text-xs font-mono font-bold text-white">{report.confidence}% Match</span>
                        </div>
                     </div>
                   </div>
                </div>

                {/* Right Side: Actions */}
                <div className="p-4 lg:p-5 lg:border-l border-white/5 flex items-center justify-end gap-2 bg-white/[0.01]">
                   {activeTab === 'pending' ? (
                     <>
                        <Button 
                          variant="ghost" 
                          className="h-9 px-3 text-xs font-semibold text-text-muted hover:text-danger hover:bg-danger/10"
                          onClick={() => handleAction(report.id, 'rejected')}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          Dismiss
                        </Button>
                        <Button 
                          className="h-9 px-3 text-xs font-semibold bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white transition-colors"
                          onClick={() => handleAction(report.id, 'verified')}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Verify
                        </Button>
                     </>
                   ) : (
                     <div className="flex items-center gap-2 px-3 py-1.5">
                       <History className="w-3.5 h-3.5 text-text-muted" />
                       <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Processed as {activeTab}</span>
                     </div>
                   )}
                </div>
              </div>
              
              {/* Context Footer */}
              <div className="px-5 py-2.5 bg-white/[0.02] border-t border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono text-text-muted uppercase">ID: RPT-{report.id}58-01</span>
                </div>
                <button className="text-[10px] font-semibold text-text-muted hover:text-white flex items-center gap-1 transition-colors">
                  View Raw Logs <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
