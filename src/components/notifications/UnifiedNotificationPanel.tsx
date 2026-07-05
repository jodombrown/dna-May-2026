/**
 * DNA | UnifiedNotificationPanel — Sprint 4C
 *
 * The main notification center that shows both platform and DIA notifications
 * in a unified stream. Supports desktop dropdown and mobile fullscreen modes.
 *
 * Features:
 * - All/Activity/DIA filter tabs
 * - Time-grouped notifications (Just now, Today, Yesterday, etc.)
 * - DIA notifications visually distinct with accent colors
 * - Mark all as read
 * - Empty state with DNA branding
 * - Desktop dropdown (420px wide) and mobile fullscreen
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
import { Bell, CheckCheck, Settings, MoreVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';
import { UnifiedNotificationFilters } from './UnifiedNotificationFilters';
import { UnifiedNotificationCard } from './UnifiedNotificationCard';
import type { UnifiedNotification } from '@/services/unifiedNotificationService';

interface UnifiedNotificationPanelProps {
  onClose: () => void;
  variant?: 'dropdown' | 'fullscreen';
}

export function UnifiedNotificationPanel({
  onClose,
  variant = 'dropdown',
}: UnifiedNotificationPanelProps) {
  const navigate = useNavigate();
  const {
    notifications,
    groupedNotifications,
    unreadCount,
    unreadPlatformCount,
    unreadDiaCount,
    isLoading,
    filter,
    setFilter,
    markAsRead,
    markAsActed,
    dismiss,
    markAllAsRead,
  } = useUnifiedNotifications();

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
      onClose();
    },
    [markAsRead, navigate, onClose]
  );

  const handleAction = useCallback(
    (notification: UnifiedNotification, _route: string) => {
      markAsActed(notification);
      onClose();
    },
    [markAsActed, onClose]
  );

  const handleDismiss = useCallback(
    (notification: UnifiedNotification) => {
      dismiss(notification);
    },
    [dismiss]
  );

  const handleSettings = () => {
    navigate('/dna/settings/notifications');
    onClose();
  };

  const handleViewAll = () => {
    navigate('/dna/notifications');
    onClose();
  };

  const isDropdown = variant === 'dropdown';

  return (
    <div
      className={cn(
        'flex flex-col bg-background',
        isDropdown ? 'w-[420px] max-h-[80vh]' : 'h-full w-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

      {/* Filter tabs: All | Activity | DIA */}
      <div className="flex-shrink-0">
        <UnifiedNotificationFilters
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={{
            all: unreadCount,
            activity: unreadPlatformCount,
            dia: unreadDiaCount,
          }}
        />
      </div>

      {/* Notification list */}
      <ScrollArea className="flex-1">
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
            <p className="font-medium text-sm mb-1">
              {filter === 'dia'
                ? 'No DIA insights yet'
                : filter === 'activity'
                  ? 'No activity notifications'
                  : "You're all caught up"}
            </p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
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
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30 sticky top-0 z-10">
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
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && isDropdown && (
        <div className="p-2 border-t flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full text-sm text-primary hover:text-primary/90"
            onClick={handleViewAll}
          >
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );
}
