/**
 * The Notify-me action that rides with "Dates not yet announced". Inline and
 * link-weight so it can sit anywhere <EventTime> does — inside clickable
 * cards (it stops propagation) and on detail pages alike. Signed-out
 * viewers hit the sign-in wall at the action, not the page, and come back.
 */

import React from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useEventDateNotify } from '@/hooks/convene/useEventDateNotify';

export interface EventDateNotifyButtonProps {
  eventId: string;
  className?: string;
}

export function EventDateNotifyButton({ eventId, className }: EventDateNotifyButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSubscribed, toggle, isToggling } = useEventDateNotify(user ? eventId : null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    toggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold text-primary',
        'hover:underline disabled:opacity-50',
        className
      )}
    >
      {isSubscribed ? (
        <>
          <BellRing className="h-3 w-3" aria-hidden />
          Notifying you
        </>
      ) : (
        <>
          <Bell className="h-3 w-3" aria-hidden />
          Notify me
        </>
      )}
    </button>
  );
}

export default EventDateNotifyButton;
