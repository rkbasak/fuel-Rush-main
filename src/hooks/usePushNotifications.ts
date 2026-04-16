'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMessagingInstance, getToken, onMessage } from '@/lib/firebase/client';
import { useAuthStore } from '@/stores';

export type NotificationType = 
  | 'fuel_nearby' 
  | 'confirm_request' 
  | 'ration_low' 
  | 'ration_reset' 
  | 'report_accepted';

export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  station_id?: string;
  read: boolean;
  created_at: string;
  data?: Record<string, string>;
}

export interface NotificationPermissionResult {
  granted: boolean;
  token: string | null;
  error: string | null;
}

export function usePushNotifications() {
  const { userId } = useAuthStore();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const suppressCache = useRef<Record<string, number>>({}); // station_id -> last notified timestamp

  // Request notification permission and get FCM token
  const requestPermission = useCallback(async (): Promise<NotificationPermissionResult> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { granted: false, token: null, error: 'Notifications not supported' };
    }

    try {
      const messaging = await getMessagingInstance();
      if (!messaging) {
        return { granted: false, token: null, error: 'Firebase Messaging not available' };
      }

      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';

      if (granted) {
        setPermissionGranted(true);
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (token) {
          setFcmToken(token);
          
          // Store FCM token in user profile
          if (userId) {
            const supabase = createClient();
            await supabase
              .from('users')
              .update({ fcm_token: token })
              .eq('id', userId);
          }

          return { granted: true, token, error: null };
        }
      }

      return { granted, token: null, error: null };
    } catch (error) {
      console.error('FCM permission error:', error);
      return { granted: false, token: null, error: String(error) };
    }
  }, [userId]);

  // Handle foreground messages
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupForegroundHandler = async () => {
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);

        const notification: PushNotification = {
          id: payload.messageId || crypto.randomUUID(),
          type: payload.data?.type as NotificationType || 'fuel_nearby',
          title: payload.notification?.title || 'Fuel Rush',
          body: payload.notification?.body || '',
          station_id: payload.data?.station_id,
          read: false,
          created_at: new Date().toISOString(),
          data: payload.data as Record<string, string>,
        };

        // Play sound and show in-app notification
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }

        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((c) => c + 1);

        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            data: notification.data,
          });
        }
      });
    };

    setupForegroundHandler();
  }, []);

  // Fetch user's notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data as PushNotification[]);
        setUnreadCount(data.filter((n: PushNotification) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [userId]);

  // Load notifications on mount / user change
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [userId]);

  // Dismiss/delete notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    try {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }, [notifications]);

  // Proximity check: should we suppress fuel_nearby for this station?
  const shouldSuppressFuelNearby = useCallback((stationId: string): boolean => {
    const lastNotified = suppressCache.current[stationId];
    if (!lastNotified) return false;
    // Don't re-notify within 30 minutes
    return Date.now() - lastNotified < 30 * 60 * 1000;
  }, []);

  // Record that we notified user about a station
  const recordFuelNearbyNotification = useCallback((stationId: string) => {
    suppressCache.current[stationId] = Date.now();
  }, []);

  return {
    fcmToken,
    permissionGranted,
    notifications,
    unreadCount,
    requestPermission,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    shouldSuppressFuelNearby,
    recordFuelNearbyNotification,
  };
}
