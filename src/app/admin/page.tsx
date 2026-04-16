'use client';

import { 
  MapPin, 
  AlertTriangle, 
  Users, 
  Activity,
  Zap,
  TrendingUp,
  Fuel,
  ChevronRight,
  ShieldCheck,
  MoreHorizontal,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendValue: string;
  isPositive: boolean;
  icon: React.ElementType;
}

function StatCard({ title, value, trend, trendValue, isPositive, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-[#111116] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[13px] font-medium text-text-muted">{title}</h3>
        <div className="p-1.5 rounded-lg bg-white/[0.03] group-hover:bg-white/[0.06] transition-colors">
          <Icon className="w-4 h-4 text-text-secondary" />
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-display font-bold text-white tracking-tight">{value}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <div className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${isPositive ? 'text-success bg-success/10' : 'text-warning bg-warning/10'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
          {trendValue}
        </div>
        <span className="text-[11px] text-text-muted">{trend}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const moderationQueue = [
    { id: 'RPT-8891', station: 'Petrobangla Fuel', reporter: 'user-001', type: 'Shortage', confidence: 95, time: '2 mins ago', status: 'pending' },
    { id: 'RPT-8890', station: 'Jamuna Station', reporter: 'user-843', type: 'Queue Length', confidence: 82, time: '12 mins ago', status: 'pending' },
    { id: 'RPT-8889', station: 'Padma Petroleum', reporter: 'user-112', type: 'Conflict', confidence: 64, time: '24 mins ago', status: 'review' },
    { id: 'RPT-8888', station: 'Shahjalal Gas', reporter: 'user-094', type: 'Refilled', confidence: 91, time: '45 mins ago', status: 'pending' },
    { id: 'RPT-8887', station: 'Trust Fill Station', reporter: 'user-402', type: 'Shortage', confidence: 45, time: '1 hr ago', status: 'flagged' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-page-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Overview</h1>
          <p className="text-sm text-text-muted mt-1">Real-time metrics for Dhaka Metropolitan Area.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="h-9 px-4 text-xs font-semibold bg-white/[0.03] border-white/5 hover:bg-white/[0.08]">
            Export Data
          </Button>
          <Button size="sm" className="h-9 px-4 text-xs font-semibold shadow-[0_0_15px_rgba(255,107,53,0.3)] hover:shadow-[0_0_20px_rgba(255,107,53,0.5)] transition-shadow">
             <Zap className="w-3.5 h-3.5 mr-2" />
             Instant Grid Alert
          </Button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Stations" value="142" trend="vs last week" trendValue="+5.2%" isPositive={true} icon={MapPin} />
        <StatCard title="Daily Reports" value="1,248" trend="vs yesterday" trendValue="+12.4%" isPositive={true} icon={AlertTriangle} />
        <StatCard title="Confidence Index" value="CRITICAL" trend="Grid stability" trendValue="82/100" isPositive={false} icon={Activity} />
        <StatCard title="Verified Scouts" value="8,402" trend="vs last month" trendValue="+18.1%" isPositive={true} icon={Users} />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Moderation Data Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Moderation Queue
            </h2>
            <a href="/admin/reports" className="text-xs font-semibold text-text-muted hover:text-white flex items-center gap-1 transition-colors">
              View All <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          
          <div className="border border-white/5 bg-[#111116] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-[11px] font-semibold text-text-muted uppercase tracking-widest bg-white/[0.01]">
              <div className="col-span-4">Report Details</div>
              <div className="col-span-3">Reporter</div>
              <div className="col-span-3">AI Confidence</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            
            <div className="divide-y divide-white/5">
              {moderationQueue.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors group">
                  <div className="col-span-4 flex items-start gap-3">
                    <div className="mt-0.5 w-6 h-6 rounded-md bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                      <Fuel className="w-3 h-3 text-text-secondary group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white">{item.station}</div>
                      <div className="text-[11px] text-text-muted mt-0.5">{item.type} • {item.time}</div>
                    </div>
                  </div>
                  
                  <div className="col-span-3 flex flex-col justify-center">
                    <span className="text-[12px] font-mono text-text-secondary">{item.reporter}</span>
                  </div>

                  <div className="col-span-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.confidence > 80 ? 'bg-success' : item.confidence > 50 ? 'bg-warning' : 'bg-danger'}`} 
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono flex-shrink-0 w-8 text-right">{item.confidence}%</span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button className="p-1.5 text-text-muted hover:text-white hover:bg-white/5 rounded-md transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Vitals Vertical */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-text-muted" />
            System Vitals
          </h2>
          
          <div className="bg-[#111116] border border-white/5 rounded-2xl p-5 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-text-secondary line-clamp-1">Edge Latency (Dhaka)</span>
                <span className="text-[12px] font-mono text-success">42ms</span>
              </div>
              <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full w-[25%] bg-success" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-text-secondary line-clamp-1">Gemini AI Quota</span>
                <span className="text-[12px] font-mono text-warning">82%</span>
              </div>
              <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full w-[82%] bg-warning" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-text-secondary line-clamp-1">Supabase DB Load</span>
                <span className="text-[12px] font-mono text-success">14%</span>
              </div>
              <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full w-[14%] bg-success" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-text-secondary line-clamp-1">Upstash Cache Hit</span>
                <span className="text-[12px] font-mono text-primary">94%</span>
              </div>
              <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full w-[94%] bg-primary shadow-[0_0_8px_rgba(255,107,53,0.5)]" />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <Button variant="secondary" className="w-full h-8 text-xs bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]">
                View Grafana Logs
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
