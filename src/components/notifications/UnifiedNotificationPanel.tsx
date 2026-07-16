/**
 * DNA | UnifiedNotificationPanel
 *
 * The single notification surface for the whole product. Renders both platform
 * and DIA notifications in one time-grouped stream, filtered by lane
 * (All | Unread | DIA).
 *
 * Variants:
 * - `dropdown`   — desktop popover (420px) opened from the header bell
 * - `fullscreen` — mobile sheet opened from the header bell
 * - `page`       — embedded in the routed /dna/notifications page (full width,
 *                  no dropdown chrome, no close button)
 *
 * The unread number is the canonical RPC count (useUnreadNotificationCount),
 * the same source the header bell badge uses.
 */

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck, Settings, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { UnifiedNotificationFilters } from './UnifiedNotificationFilters';
import { UnifiedNotificationCard } from './UnifiedNotificationCard';
import type { UnifiedNotification } from '@/services/unifiedNotificationService';

interface UnifiedNotificationPanelProps {
  onClose?: () => void;
  variant?: 'dropdown' | 'fullscreen' | 'page';
}

export function UnifiedNotificationPanel({
  onClose,
  variant = 'dropdown',
}: UnifiedNotificationPanelProps) {
  const navigate = useNavigate();
  const {
    notifications,
    groupedNotifications,
    isLoading,
    filter,
    setFilter,
    markAsRead,
    markAsActed,
    dismiss,
    markAllAsRead,
  } = useUnifiedNotifications();

  // Canonical unread count — same RPC source as the header bell badge.
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const close = useCallback(() => onClose?.(), [onClose]);

  // Mark visible DIA notifications as seen when panel opens
  useEffect(() => {
    for (const notif of notifications) {
      if (notif.type === 'dia' && !notif.isRead) {
        markAsRead(notif);
      }
    }
    // Only run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpen = useCallback(
    (notification: UnifiedNotification) => {
      markAsRead(notification);
      if (notification.primaryAction?.route) {
        navigate(notification.primaryAction.route);
      }
      close();
    },
    [markAsRead, navigate, close]
  );

  const handleAction = useCallback(
    (notification: UnifiedNotification, _route: string) => {
      markAsActed(notification);
      close();
    },
    [markAsActed, close]
  );

  const handleDismiss = useCallback(
    (notification: UnifiedNotification) => {
      dismiss(notification);
    },
    [dismiss]
  );

  const handleSettings = () => {
    navigate('/dna/settings/notifications');
    close();
  };

  const handleViewAll = () => {
    navigate('/dna/notifications');
    close();
  };

  const isDropdown = variant === 'dropdown';
  const isPage = variant === 'page';

  const list = (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : notifications.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-body mb-1">
            {filter === 'dia'
              ? 'No DIA insights yet'
              : filter === 'unread'
                ? "You're all caught up"
                : 'No notifications yet'}
          </p>
          <p className="text-meta text-muted-foreground max-w-xs">
            {filter === 'dia'
              ? 'DIA will surface intelligence as you use the platform.'
              : "When something happens in your diaspora network, you'll see it here."}
          </p>
        </div>
      ) : (
        <div>
          {groupedNotifications.map(group => (
            <div key={group.label}>
              {/* Time group header */}
              <div className="px-4 py-2 text-meta font-medium text-muted-foreground bg-muted/30 sticky top-0 z-10">
                {group.label}
              </div>

              {/* Notifications */}
              <div className="divide-y divide-border/50">
                {group.notifications.map(notif => (
                  <UnifiedNotificationCard
                    key={notif.id}
                    notification={notif}
                    onOpen={handleOpen}
                    onDismiss={handleDismiss}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        'flex flex-col bg-background',
        isDropdown && 'w-full max-h-screen',
        variant === 'fullscreen' && 'h-full w-full',
        isPage && 'w-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-h3">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-micro bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                aria-label="Notification options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={4}>
              {unreadCount > 0 && (
                <DropdownMenuItem onClick={() => markAllAsRead()}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Notification settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter lanes: All | Unread | DIA */}
      <div className="flex-shrink-0">
        <UnifiedNotificationFilters
          activeFilter={filter}
          onFilterChange={setFilter}
          unreadCount={unreadCount}
        />
      </div>

      {/* Notification list */}
      {isPage ? (
        <div className="flex-1">{list}</div>
      ) : (
        <ScrollArea className="flex-1">{list}</ScrollArea>
      )}

      {/* Footer — dropdown only */}
      {notifications.length > 0 && isDropdown && (
        <div className="p-2 border-t flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full text-body text-primary hover:text-primary/90"
            onClick={handleViewAll}
          >
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );
}
