'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { NotificationType } from '@/hooks/usePushNotifications';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  station_id?: string;
  data?: Record<string, string>;
  read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  // Proximity notification suppression cache
  suppressedStations: Record<string, number>; // stationId -> suppressedUntil timestamp

  fetchNotifications: (userId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  dismissNotification: (id: string, userId: string) => void;
  
  // Smart suppression helpers
  shouldSuppressFuelNearby: (stationId: string, userId: string) => boolean;
  recordFuelNearby: (stationId: string) => void;
  shouldSuppressConfirmRequest: (stationId: string, userId: string) => boolean;
  recordReportSubmitted: (stationId: string) => void;
  clearOldSuppressions: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  suppressedStations: {},

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        const notifications = data as Notification[];
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  markAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(
        0,
        state.unreadCount - (state.notifications.find((n) => n.id === id)?.read ? 0 : 1)
      ),
    }));

    // Persist to backend
    const supabase = createClient();
    supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Failed to mark as read:', error);
      });
  },

  markAllAsRead: (userId: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));

    const supabase = createClient();
    supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .then(({ error }) => {
        if (error) console.error('Failed to mark all as read:', error);
      });
  },

  dismissNotification: (id: string, userId: string) => {
    const notification = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount:
        notification && !notification.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
    }));

    const supabase = createClient();
    supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Failed to dismiss notification:', error);
      });
  },

  // Smart suppression: don't re-notify about same station within 30 min
  shouldSuppressFuelNearby: (stationId: string, userId: string): boolean => {
    const { suppressedStations, notifications } = get();
    const suppressedUntil = suppressedStations[stationId];
    if (suppressedUntil && Date.now() < suppressedUntil) return true;

    // Also check visited stations today (don't notify about stations user already visited)
    const visitedToday = notifications.some(
      (n) =>
        n.type === 'ration_low' &&
        n.station_id === stationId &&
        new Date(n.created_at).toDateString() === new Date().toDateString()
    );

    return visitedToday;
  },

  recordFuelNearby: (stationId: string) => {
    set((state) => ({
      suppressedStations: {
        ...state.suppressedStations,
        [stationId]: Date.now() + 30 * 60 * 1000, // 30 minutes
      },
    }));
  },

  // Don't send confirm_request if user already reported within 30 min
  shouldSuppressConfirmRequest: (stationId: string, userId: string): boolean => {
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
    return (
      get().notifications.filter(
        (n) =>
          n.type === 'confirm_request' &&
          n.station_id === stationId &&
          new Date(n.created_at).getTime() > thirtyMinAgo
      ).length > 0
    );
  },

  recordReportSubmitted: (stationId: string) => {
    // Mark as suppressed for 30 minutes
    set((state) => ({
      suppressedStations: {
        ...state.suppressedStations,
        [`report_${stationId}`]: Date.now() + 30 * 60 * 1000,
      },
    }));
  },

  clearOldSuppressions: () => {
    const now = Date.now();
    const cleaned = Object.fromEntries(
      Object.entries(get().suppressedStations).filter(
        ([, until]) => now < until
      )
    );
    set({ suppressedStations: cleaned });
  },
}));
