/**
 * DNA | UnifiedNotificationBell — Sprint 4C
 *
 * Bell icon with unread badge for the navigation header.
 * Clicking opens the UnifiedNotificationPanel as a popover (desktop)
 * or a fullscreen sheet (mobile).
 *
 * Badge shows total unread count from both platform and DIA sources.
 * Badge uses DNA Emerald by default, or DIA gold accent if only DIA unreads.
 */

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { UnifiedNotificationPanel } from './UnifiedNotificationPanel';
import { useMobile } from '@/hooks/useMobile';

export function UnifiedNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { isMobile } = useMobile();

  const hasUnread = unreadCount > 0;

  const handleClose = () => setIsOpen(false);

  // Mobile: full-screen sheet
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setIsOpen(true)}
        >
          <Bell className={cn('h-5 w-5', hasUnread && 'text-primary')} />
          {hasUnread && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-micro text-primary-foreground bg-primary hover:bg-primary/90"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent
            side="right"
            className="w-full p-0 sm:max-w-full [&>button]:hidden"
          >
            <UnifiedNotificationPanel
              onClose={handleClose}
              variant="fullscreen"
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: popover dropdown
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn('h-5 w-5', hasUnread && 'text-primary')} />
          {hasUnread && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-micro text-primary-foreground bg-primary hover:bg-primary/90"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="end"
        sideOffset={8}
      >
        <UnifiedNotificationPanel
          onClose={handleClose}
          variant="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}
