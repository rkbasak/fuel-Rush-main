'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  UserPlus, 
  MoreVertical,
  ChevronRight,
  Zap,
  Star,
  Activity,
  History,
  Phone
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  trustScore: number;
  role: 'admin' | 'user' | 'moderator';
  reportsConfirmed: number;
  status: 'active' | 'flagged' | 'banned';
  lastSeen: string;
}

const MOCK_USERS: AdminUser[] = [
  { id: '1', name: 'Rahat Islam', phone: '+8801712345678', trustScore: 94, role: 'moderator', reportsConfirmed: 42, status: 'active', lastSeen: '2m ago' },
  { id: '2', name: 'Adnan Sami', phone: '+8801812345679', trustScore: 82, role: 'user', reportsConfirmed: 12, status: 'active', lastSeen: '12m ago' },
  { id: '3', name: 'Zahin Ahmed', phone: '+8801612345680', trustScore: 15, role: 'user', reportsConfirmed: 1, status: 'flagged', lastSeen: '2d ago' },
  { id: '4', name: 'Mousumi Akter', phone: '+8801912345681', trustScore: 78, role: 'user', reportsConfirmed: 8, status: 'active', lastSeen: '45m ago' },
  { id: '5', name: 'System Admin', phone: '+8801512345682', trustScore: 100, role: 'admin', reportsConfirmed: 0, status: 'active', lastSeen: 'Just now' },
];

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.phone.includes(search)
  );

  const getRoleBadge = (role: string) => {
    const roles = {
      admin: 'bg-primary/20 text-primary border-primary/30',
      moderator: 'bg-accent/20 text-accent border-accent/30',
      user: 'bg-white/[0.03] text-text-muted border-white/5',
    };
    return (
      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-widest ${roles[role as keyof typeof roles]}`}>
        {role}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <ShieldCheck className="w-4 h-4 text-success" />;
      case 'flagged': return <ShieldAlert className="w-4 h-4 text-warning" />;
      case 'banned': return <ShieldX className="w-4 h-4 text-danger" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-page-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            User Directory
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Audit user behaviors and manage system-wide roles.
          </p>
        </div>
        <Button className="h-9 px-4 text-xs font-semibold shadow-[0_0_15px_rgba(255,107,53,0.3)] hover:shadow-[0_0_20px_rgba(255,107,53,0.5)]">
          <UserPlus className="w-3.5 h-3.5 mr-2" />
          Invite Moderator
        </Button>
      </div>

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { icon: Users, label: 'Active Today', value: '4.2k', iconClass: 'p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary' },
          { icon: Star, label: 'Top Reporters', value: '18', iconClass: 'p-2 rounded-lg bg-accent/10 border border-accent/20 text-accent' },
          { icon: Activity, label: 'Auth Rate', value: '91%', iconClass: 'p-2 rounded-lg bg-success/10 border border-success/20 text-success' },
          { icon: History, label: 'Avg Retention', value: '14d', iconClass: 'p-2 rounded-lg bg-warning/10 border border-warning/20 text-warning' },
        ] as const).map((met, i) => (
          <div key={i} className="p-4 bg-[#111116] border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-colors">
             <div className={met.iconClass}>
               <met.icon className="w-4 h-4" />
             </div>
             <div>
               <div className="text-xl font-display font-bold text-white leading-none mb-1">{met.value}</div>
               <div className="text-[10px] text-text-muted uppercase tracking-widest">{met.label}</div>
             </div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-[#111116] border border-white/5 rounded-2xl overflow-hidden mt-6">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input 
              placeholder="Search by name, phone, or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-10 bg-white/[0.02] border-white/5 text-sm w-full lg:w-96"
            />
          </div>
          <Button variant="secondary" className="h-10 px-4 text-xs font-semibold bg-white/[0.02] border-white/5 hover:bg-white/[0.08] shrink-0">
            <Filter className="w-4 h-4 mr-2" />
            Advanced
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">User Profile</th>
                <th className="px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">Role</th>
                <th className="px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Trust Index</th>
                <th className="px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Verified Reports</th>
                <th className="px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 mt-0.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center relative overflow-hidden">
                        <div className="text-sm font-black text-primary opacity-40">{user.name.charAt(0)}</div>
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-white leading-tight">{user.name}</div>
                        <div className="text-[11px] font-mono text-text-muted flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 opacity-50" />
                          {user.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex flex-col items-center">
                       <span className={`text-[13px] font-mono font-black ${
                         user.trustScore > 80 ? 'text-success' : user.trustScore > 50 ? 'text-warning' : 'text-danger'
                       }`}>
                         {user.trustScore}
                       </span>
                       <span className="text-[9px] text-text-muted uppercase tracking-tighter opacity-70">Points</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center font-mono text-[13px] font-bold text-text-secondary">
                    {user.reportsConfirmed}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${
                         user.status === 'active' ? 'text-success' : user.status === 'flagged' ? 'text-warning' : 'text-danger'
                       }`}>
                         {user.status}
                       </span>
                       {getStatusIcon(user.status)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/10 transition-all lg:opacity-0 group-hover:opacity-100 text-text-muted hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-5 py-3 bg-white/[0.01] border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
           <div className="text-[9px] text-text-muted uppercase tracking-widest font-bold">Showing {filteredUsers.length} of 4,284 users</div>
           <div className="flex gap-2">
             <Button variant="ghost" className="h-8 px-3 text-[11px] font-semibold text-text-muted hover:text-white bg-white/[0.02]" disabled>Previous</Button>
             <Button variant="ghost" className="h-8 px-3 text-[11px] font-semibold text-text-muted hover:text-white bg-white/[0.02]">Next <ChevronRight className="w-3 h-3 ml-1" /></Button>
           </div>
        </div>
      </div>
      
      {/* Moderation Tip */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
         <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
         <p className="text-[13px] text-text-secondary leading-relaxed">
           <strong className="text-white">Moderation Insight:</strong> Users with a trust index above 90 are automatically eligible for the "Self-Verification" tier. Verified reports from these users are broadcasted immediately without manual oversight.
         </p>
      </div>
    </div>
  );
}
