'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/stores/notifications';
import { useAuthStore } from '@/stores';
import { Bell, Check, X, Fuel, AlertTriangle, RotateCcw, ThumbsUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  fuel_nearby: <Fuel className="w-5 h-5 text-accent" />,
  confirm_request: <AlertTriangle className="w-5 h-5 text-warning" />,
  ration_low: <AlertTriangle className="w-5 h-5 text-danger" />,
  ration_reset: <RotateCcw className="w-5 h-5 text-accent" />,
  report_accepted: <ThumbsUp className="w-5 h-5 text-success" />,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  fuel_nearby: 'border-l-accent',
  confirm_request: 'border-l-warning',
  ration_low: 'border-l-danger',
  ration_reset: 'border-l-accent',
  report_accepted: 'border-l-success',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { userId } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotificationStore();

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId, fetchNotifications]);

  const router = useRouter();

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Deep link to station if station_id present
    if (notification.station_id) {
      router.push(`/main/map?station=${notification.station_id}`);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => userId && markAllAsRead(userId)}>
            <Check className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center">
            <Bell className="w-8 h-8 text-muted" />
          </div>
          <p className="text-text-secondary font-medium">No notifications yet</p>
          <p className="text-sm text-muted text-center max-w-xs">
            When stations near you get fuel or your ration is updated, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`
                relative bg-surface rounded-card p-4 border-l-4 cursor-pointer
                transition-all hover:bg-surface-elevated
                ${NOTIFICATION_COLORS[notification.type] || 'border-l-border'}
                ${!notification.read ? 'ring-1 ring-primary/20' : 'opacity-80'}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                  {NOTIFICATION_ICONS[notification.type] || <Bell className="w-5 h-5 text-muted" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-sm leading-tight">
                        {notification.title}
                      </p>
                      <p className="text-text-secondary text-sm mt-1 leading-relaxed">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted mt-1.5">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-1">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full" title="Unread" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id, userId || '');
                        }}
                        className="p-1 rounded hover:bg-surface-elevated transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4 text-muted" />
                      </button>
                    </div>
                  </div>

                  {/* Station link */}
                  {notification.station_id && (
                    <Link
                      href={`/main/map?station=${notification.station_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      <Fuel className="w-3 h-3" />
                      View station
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification preference note */}
      <div className="mt-6 p-4 bg-surface-elevated rounded-card">
        <p className="text-xs text-muted text-center">
          💡 Notifications are sent based on your location and station updates.
          <br />
          Disable in your browser&apos;s notification settings to opt out.
        </p>
      </div>
    </div>
  );
}
