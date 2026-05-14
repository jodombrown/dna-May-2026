import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import { useAuth } from '@/contexts/AuthContext';
import { useInboxBrief } from '@/hooks/messaging/useInboxBrief';
import { useDiaMessagingPrefs } from '@/hooks/messaging/useDiaMessagingPrefs';
import { InboxDigestSheet } from './InboxDigestSheet';
import { cn } from '@/lib/utils';

const ALLOWED_PATHS = ['/dna/feed'];

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/**
 * Phase 16 - Morning brief.
 * Once per calendar day, after the user lands on the feed, surface a small
 * banner with DIA's cross-thread summary. Dismissible; clicking opens the
 * full inbox digest sheet. Respects the user's DIA summaries preference.
 */
export const MorningBriefBanner: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { prefs } = useDiaMessagingPrefs();
  const [dismissed, setDismissed] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const onAllowedPath = ALLOWED_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'));
  const eligible = !!user && prefs.summariesEnabled && onAllowedPath;

  useEffect(() => {
    if (!eligible || !user) return;
    try {
      const key = `dia:morning-brief:${user.id}`;
      const seen = localStorage.getItem(key);
      if (seen === todayKey()) return;
      setDismissed(false);
    } catch {
      // localStorage unavailable - keep dismissed
    }
  }, [eligible, user]);

  const brief = useInboxBrief(eligible && !dismissed);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      if (user) localStorage.setItem(`dia:morning-brief:${user.id}`, todayKey());
    } catch {
      // ignore
    }
  };

  const handleOpen = () => {
    setSheetOpen(true);
    handleDismiss();
  };

  if (!eligible || dismissed) return null;
  if (brief.isLoading) return null;
  if (brief.isError || !brief.data) return null;
  if ((brief.data.totalUnread ?? 0) === 0) return null;

  return (
    <>
      <div
        className={cn(
          'fixed left-3 right-3 z-30 rounded-md border border-primary/25 bg-card shadow-md',
          'top-[calc(var(--unified-header-height,56px)+var(--pulse-bar-height,56px)+8px)]',
          'lg:left-auto lg:right-6 lg:max-w-sm',
        )}
        role="status"
      >
        <button
          type="button"
          onClick={handleOpen}
          className="w-full text-left px-3 py-2.5 pr-9"
        >
          <div className="flex items-center gap-2 mb-0.5">
            <MateMasie className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] uppercase tracking-wide text-primary font-medium">
              Morning brief
            </span>
            <span className="text-[11px] text-muted-foreground ml-auto">
              {brief.data.totalUnread} unread - {brief.data.unreadThreadCount} threads
            </span>
          </div>
          <p className="text-sm font-medium text-foreground leading-snug">
            {brief.data.headline}
          </p>
          {brief.data.narrative && (
            <p className="text-xs text-muted-foreground leading-snug mt-1 line-clamp-2">
              {brief.data.narrative}
            </p>
          )}
          <p className="text-[11px] text-primary mt-1.5">Tap to open digest</p>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss morning brief"
          className="absolute top-1.5 right-1.5 p-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <InboxDigestSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
};

export default MorningBriefBanner;
