/**
 * DNA | UnifiedNotificationBell
 *
 * Bell icon with unread badge. Clicking opens the unified notification stream
 * inside an IdentitySheet — the same Claude-inspired side panel used for
 * Settings and Account. Non-modal on desktop so the feed stays interactive
 * and isn't obscured by a floating popover.
 */

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { UnifiedNotificationPanel } from './UnifiedNotificationPanel';
import { IdentitySheet } from '@/components/ui/settings-kit/IdentitySheet';

export function UnifiedNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const hasUnread = unreadCount > 0;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(true)}
        aria-label="Notifications"
      >
        <Bell className={cn('h-5 w-5', hasUnread && 'text-primary')} />
        {hasUnread && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-micro text-primary-foreground bg-primary hover:bg-primary/90">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <IdentitySheet
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Notifications"
      >
        <div className="-mx-4 -my-4">
          <UnifiedNotificationPanel
            onClose={() => setIsOpen(false)}
            variant="page"
            hideHeader
          />
        </div>
      </IdentitySheet>
    </>
  );
}
