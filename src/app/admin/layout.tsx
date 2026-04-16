'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  MapPin, 
  Users, 
  Settings, 
  LogOut, 
  Fuel, 
  Menu, 
  X,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Search,
  Bell,
  User as UserIcon
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/ui/Button';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
        ${active 
          ? 'bg-white/5 text-white font-semibold' 
          : 'text-text-muted hover:bg-white/[0.02] hover:text-text-secondary font-medium'
        }
      `}
    >
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r-full shadow-[0_0_10px_rgba(255,107,53,0.5)]" />
      )}
      <Icon className={`w-[18px] h-[18px] transition-transform ${active ? 'text-primary' : 'opacity-70 group-hover:opacity-100'}`} />
      <span className="text-[13px] tracking-wide">{label}</span>
      {active && <ChevronRight className="ml-auto w-4 h-4 opacity-40 text-primary" />}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (userId === 'mock-user-001' || userId) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(true); // Development passthrough
    }
  }, [userId]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="text-center animate-fade-in flex flex-col items-center">
          <ShieldCheck className="w-12 h-12 text-primary mb-4 opacity-40" />
          <h2 className="text-lg font-display font-bold text-white mb-2">Authenticating</h2>
          <p className="text-xs text-text-muted">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', icon: BarChart3, label: 'Overview' },
    { href: '/admin/stations', icon: MapPin, label: 'Stations' },
    { href: '/admin/reports', icon: AlertTriangle, label: 'Moderation Queue' },
    { href: '/admin/users', icon: Users, label: 'User Directory' },
    { href: '/admin/settings', icon: Settings, label: 'SaaS Config' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col lg:flex-row text-white font-primary overflow-hidden">
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5 h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Fuel className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-display font-bold tracking-tight">FR Command</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -mr-2 text-text-muted hover:text-white transition-colors"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 
        bg-[#111116] lg:bg-[#0A0A0A] border-r border-white/5 flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Desktop Branding */}
        <div className="hidden lg:flex items-center gap-3 h-16 px-6 border-b border-white/5 shrink-0">
          <div className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center shadow-glow-orange">
            <Fuel className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold text-white tracking-tight leading-none">Fuel Rush</h1>
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Admin Platform</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
          <div className="px-3 mb-2 text-[10px] uppercase font-bold tracking-widest text-text-muted">Core Dashboard</div>
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href}
              onClick={() => setIsSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* Admin User Block */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-1 ring-inset ring-white/10">
               <UserIcon className="w-4 h-4 text-white opacity-80" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">Super Admin</div>
              <div className="text-[10px] text-text-muted truncate">admin@fuelrush.bd</div>
            </div>
            <button onClick={() => router.push('/main/map')} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors">
               <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col min-h-0 bg-[#0A0A0A]">
        
        {/* Desktop Topbar */}
        <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-white/5 shrink-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
             <span className="opacity-50 hover:opacity-100 cursor-pointer transition-opacity">Platform</span>
             <ChevronRight className="w-3.5 h-3.5 opacity-30" />
             <span className="text-white">{(navItems.find(n => n.href === pathname)?.label) || 'Dashboard'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group/search hidden md:block w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within/search:text-primary transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search stations, logs..." 
                 className="w-full h-9 bg-white/[0.03] border border-white/10 rounded-full pl-9 pr-4 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
               />
            </div>
            <button className="relative w-9 h-9 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] transition-colors flex items-center justify-center text-text-muted hover:text-white">
               <Bell className="w-4 h-4" />
               <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(255,107,53,0.8)]" />
            </button>
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border border-success/20 bg-success/10 cursor-pointer hover:bg-success/20 transition-colors">
               <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
               <span className="text-[10px] font-bold text-success uppercase tracking-wider">All Systems Operational</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto w-full p-4 lg:p-8 relative z-10 selection:bg-primary/30 selection:text-white">
          <div className="w-full">
             {children}
          </div>
        </div>
        
      </main>
    </div>
  );
}
