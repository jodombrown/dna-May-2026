import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import { useAuth } from '@/contexts/AuthContext';
import { useInboxBrief } from '@/hooks/messaging/useInboxBrief';
import { useDiaMessagingPrefs } from '@/hooks/messaging/useDiaMessagingPrefs';
import { useAnalytics } from '@/hooks/useAnalytics';
import { InboxDigestSheet } from './InboxDigestSheet';
import { cn } from '@/lib/utils';

const ALLOWED_PATHS = ['/dna/feed'];

/**
 * Query param that deep-links straight into the Inbox Digest sheet.
 * Works on any route the banner is mounted on and on both mobile + desktop
 * (the sheet renders as a Dialog on desktop, a Drawer on mobile).
 *
 *   /dna/feed?digest=open
 */
export const DIGEST_DEEP_LINK_PARAM = 'digest';
export const DIGEST_DEEP_LINK_VALUE = 'open';

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/**
 * Phase 16 - Morning brief.
 * Once per calendar day, after the user lands on the feed, surface a small
 * banner with DIA's cross-thread summary. Dismissible; clicking opens the
 * full inbox digest sheet. Respects the user's DIA summaries preference.
 *
 * The InboxDigestSheet is intentionally rendered OUTSIDE the `!dismissed`
 * gate so dismissing the banner never unmounts the sheet mid-open.
 */
export const MorningBriefBanner: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { prefs } = useDiaMessagingPrefs();
  const { trackEvent } = useAnalytics();
  const [dismissed, setDismissed] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const deepLinkHandledRef = useRef(false);

  const onAllowedPath = ALLOWED_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/'),
  );
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

  // Deep link: ?digest=open opens the sheet directly (mobile + desktop).
  useEffect(() => {
    if (deepLinkHandledRef.current) return;
    const params = new URLSearchParams(location.search);
    if (params.get(DIGEST_DEEP_LINK_PARAM) !== DIGEST_DEEP_LINK_VALUE) return;
    deepLinkHandledRef.current = true;
    setSheetOpen(true);
    void trackEvent('morning_brief_deep_link_open', {
      route: location.pathname,
    });
    // Strip the param so refresh / back does not re-open.
    params.delete(DIGEST_DEEP_LINK_PARAM);
    const nextSearch = params.toString();
    navigate(
      { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate, trackEvent]);

  const brief = useInboxBrief(eligible && !dismissed);

  const markSeenToday = () => {
    try {
      if (user) localStorage.setItem(`dia:morning-brief:${user.id}`, todayKey());
    } catch {
      // ignore
    }
  };

  const handleDismiss = () => {
    void trackEvent('morning_brief_banner_dismiss', {
      unread: brief.data?.totalUnread ?? 0,
    });
    setDismissed(true);
    markSeenToday();
  };

  const handleOpen = () => {
    void trackEvent('morning_brief_banner_tap', {
      unread: brief.data?.totalUnread ?? 0,
      threads: brief.data?.unreadThreadCount ?? 0,
    });
    void trackEvent('inbox_digest_opened', { source: 'morning_brief_banner' });
    setSheetOpen(true);
    markSeenToday();
  };

  const handleSheetOpenChange = (next: boolean) => {
    setSheetOpen(next);
    if (!next) {
      void trackEvent('inbox_digest_closed', { source: 'morning_brief_banner' });
      // Only mark the banner dismissed AFTER the sheet finished closing,
      // so the sheet is never unmounted in the same render as its opener.
      setDismissed(true);
    }
  };

  const showBanner =
    eligible &&
    !dismissed &&
    !brief.isLoading &&
    !brief.isError &&
    !!brief.data &&
    (brief.data.totalUnread ?? 0) > 0;

  return (
    <>
      {showBanner && brief.data && (
        <div
          data-testid="morning-brief-banner"
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
            data-testid="morning-brief-open"
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
      )}

      {/* Rendered outside the `!dismissed` gate on purpose - see file docstring. */}
      <InboxDigestSheet open={sheetOpen} onOpenChange={handleSheetOpenChange} />
    </>
  );
};

export default MorningBriefBanner;
