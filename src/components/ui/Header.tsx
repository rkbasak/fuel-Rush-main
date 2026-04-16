'use client';

import { Fuel, Bell } from 'lucide-react';
import { useRationStore, useAuthStore } from '@/stores';
import { useNotificationStore } from '@/stores/notifications';
import Link from 'next/link';
import { useEffect } from 'react';

export function Header() {
  const { usedToday, dailyLimit } = useRationStore();
  const { userId } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const percentUsed = dailyLimit > 0 ? Math.round((usedToday / dailyLimit) * 100) : 0;

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId, fetchNotifications]);

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border safe-area-pt">
      <div className="flex items-center justify-between px-4 h-14 w-full">
        {/* Logo */}
        <Link href="/main/map" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-glow-orange transition-transform group-hover:scale-105">
            <Fuel className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-display font-bold text-text-primary tracking-tight">
            Fuel Rush
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Quick ration indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-text-muted">Today:</span>
            <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentUsed > 80 ? 'bg-danger' : percentUsed > 50 ? 'bg-warning' : 'bg-accent'
                }`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            <span className={`font-mono ${percentUsed > 80 ? 'text-danger' : 'text-accent'}`}>
              {percentUsed}%
            </span>
          </div>

          {/* Notifications bell */}
          <Link
            href="/main/notifications"
            className="relative p-2 rounded-xl hover:bg-surface transition-all duration-200 group"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-bounce-in shadow-glow-red">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
