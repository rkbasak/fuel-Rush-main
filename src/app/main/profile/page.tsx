'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores';
import { createClient } from '@/lib/supabase/client';
import { User, Shield, Bell, HelpCircle, LogOut, ChevronRight, Star, Award, Fuel, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { userId, isAuthenticated, trustScore, setUser, logout } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user.id);
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, logout]);

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logout();
    router.push('/');
  };

  const getTrustLevel = (score: number) => {
    if (score >= 80) return { level: 'Trusted Scout', icon: '🏅', color: 'text-success', bg: 'bg-success/20' };
    if (score >= 50) return { level: 'Fuel Scout', icon: '⭐', color: 'text-accent', bg: 'bg-accent/20' };
    return { level: 'New Member', icon: '🌱', color: 'text-warning', bg: 'bg-warning/20' };
  };

  const trustInfo = getTrustLevel(trustScore);

  const menuItems = [
    { icon: ShieldAlert, label: 'Admin Dashboard', description: 'Manage stations & SaaS config', href: '/admin', priority: true },
    { icon: Shield, label: 'Privacy & Security', description: 'Data, permissions', href: '/main/privacy' },
    { icon: Bell, label: 'Notifications', description: 'Alerts, sounds', href: '/main/notifications' },
    { icon: HelpCircle, label: 'Help & Support', description: 'FAQ, contact us', href: '/main/help' },
  ];

  return (
    <div className="px-4 py-4 space-y-6 animate-page-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">Profile</h1>
        <p className="text-sm text-text-muted mt-1">Manage your account and preferences</p>
      </div>

      {/* User card */}
      <Card className="flex items-center gap-4 border border-border">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow-orange">
          <User className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-display font-semibold text-text-primary text-lg">
            {isAuthenticated ? 'Fuel Rush User' : 'Guest User'}
          </div>
          <div className={`inline-flex items-center gap-1 text-sm font-medium mt-1 px-2 py-0.5 rounded-full ${trustInfo.bg} ${trustInfo.color}`}>
            <span>{trustInfo.icon}</span>
            <span>{trustInfo.level}</span>
          </div>
        </div>
        {!isAuthenticated && (
          <Button size="sm" onClick={handleSignIn} className="shadow-glow-orange">Sign In</Button>
        )}
      </Card>

      {/* Trust score info */}
      <Card className="bg-surface-elevated border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${trustInfo.bg} flex items-center justify-center`}>
            <Award className={`w-5 h-5 ${trustInfo.color}`} />
          </div>
          <div>
            <h3 className="font-display font-medium text-text-primary">About Trust Score</h3>
            <p className="text-xs text-text-muted">Your contribution weight in the community</p>
          </div>
        </div>
        <p className="text-sm text-text-muted mb-3">
          Your trust score increases as you submit accurate reports. Higher trust scores
          give your reports more weight in the community.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                trustScore >= 80 ? 'bg-success' : trustScore >= 50 ? 'bg-accent' : 'bg-warning'
              }`}
              style={{ width: `${trustScore}%` }}
            />
          </div>
          <span className={`text-sm font-mono font-semibold ${trustInfo.color}`}>{trustScore}</span>
        </div>
      </Card>

      {/* Contribution Stats */}
      <Card className="border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-medium text-text-primary">Contribution Stats</h3>
            <p className="text-xs text-text-muted">Your impact on the community</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-surface rounded-xl">
            <div className="text-2xl font-display font-bold text-text-primary font-mono">47</div>
            <div className="text-xs text-text-muted mt-1">Reports</div>
          </div>
          <div className="text-center p-3 bg-surface rounded-xl">
            <div className="text-2xl font-display font-bold text-text-primary font-mono">89</div>
            <div className="text-xs text-text-muted mt-1">Confirmations</div>
          </div>
          <div className="text-center p-3 bg-surface rounded-xl">
            <div className="text-2xl font-display font-bold text-primary font-mono">782</div>
            <div className="text-xs text-text-muted mt-1">Points</div>
          </div>
        </div>
      </Card>

      {/* Menu items */}
      <div className="space-y-2">
        {menuItems.map(({ icon: Icon, label, description, href, priority }) => (
          <a
            key={label}
            href={href}
            className="block"
          >
            <Card className={`flex items-center gap-3 hover:bg-surface-elevated transition-colors cursor-pointer border hover:border-primary/30 ${priority ? 'bg-primary/5 border-primary/20' : 'border-border'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${priority ? 'bg-primary/20' : 'bg-surface-elevated'}`}>
                <Icon className={`w-5 h-5 ${priority ? 'text-primary' : 'text-text-muted'}`} />
              </div>
              <div className="flex-1">
                <div className={`font-medium ${priority ? 'text-white' : 'text-text-primary'}`}>{label}</div>
                <div className="text-xs text-text-muted">{description}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </Card>
          </a>
        ))}
      </div>

      {/* Logout */}
      {isAuthenticated && (
        <Button variant="danger" className="w-full shadow-glow-red" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      )}

      {/* App info */}
      <div className="text-center pt-4 pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
            <Fuel className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-display font-semibold text-text-primary">Fuel Rush v0.1.0</span>
        </div>
        <div className="text-xs text-text-muted">Bangladesh Fuel Intelligence Platform</div>
      </div>
    </div>
  );
}
