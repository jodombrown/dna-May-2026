import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Loader2, MessageCircle, Users, Check, Clock, MoreHorizontal } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import { useInboxDigest } from '@/hooks/messaging/useInboxDigest';
import { useInboxBrief } from '@/hooks/messaging/useInboxBrief';
import { useBriefActions } from '@/hooks/messaging/useBriefActions';

interface InboxDigestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBeforeNavigate?: () => void;
}

/**
 * Phase 15 - Cross-thread inbox digest, opened from PulseDock.
 * Surfaces top unread threads (direct + group) in one place so the user
 * never has to enter the inbox just to triage.
 */
export const InboxDigestSheet: React.FC<InboxDigestSheetProps> = ({
  open,
  onOpenChange,
  onBeforeNavigate,
}) => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useInboxDigest(open);
  const brief = useInboxBrief(open && (data?.totalUnread ?? 0) > 0);
  const { snooze, markRead, markAllRead } = useBriefActions();

  const go = (href: string) => {
    onOpenChange(false);
    onBeforeNavigate?.();
    setTimeout(() => navigate(href), 80);
  };

  const headline = (() => {
    if (!data) return 'Reading your inbox...';
    if (data.totalUnread === 0) return 'You are all caught up across every thread.';
    return `${data.totalUnread} unread message${data.totalUnread === 1 ? '' : 's'} across ${data.unreadThreadCount} thread${data.unreadThreadCount === 1 ? '' : 's'}.`;
  })();

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <ResponsiveModalHeader>
        <div className="flex items-start gap-2">
          <MateMasie className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <ResponsiveModalTitle>Inbox digest</ResponsiveModalTitle>
            <ResponsiveModalDescription>{headline}</ResponsiveModalDescription>
          </div>
        </div>
      </ResponsiveModalHeader>

      <div className="px-4 pb-4 max-h-[65vh] overflow-y-auto">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Building your digest...
          </div>
        )}

        {!isLoading && isError && (
          <p className="text-sm text-destructive py-6 text-center">
            Could not load your inbox right now.
          </p>
        )}

        {!isLoading && !isError && data && data.topThreads.length === 0 && (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
            <Button size="sm" variant="outline" onClick={() => go('/dna/messages')}>
              Open Messages
            </Button>
          </div>
        )}

        {!isLoading && !isError && data && data.topThreads.length > 0 && (
          <>
            {/* Phase 16 - DIA narrative brief */}
            {data.totalUnread > 0 && (
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <MateMasie className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] uppercase tracking-wide text-primary font-medium">
                    DIA brief
                  </span>
                </div>
                {brief.isLoading && (
                  <p className="text-xs text-muted-foreground">Reading across your threads...</p>
                )}
                {!brief.isLoading && brief.data && (
                  <>
                    <p className="text-sm text-foreground font-medium leading-snug">
                      {brief.data.headline}
                    </p>
                    {brief.data.narrative && (
                      <p className="text-xs text-muted-foreground leading-snug mt-1">
                        {brief.data.narrative}
                      </p>
                    )}
                  </>
                )}
                {!brief.isLoading && brief.isError && (
                  <p className="text-xs text-muted-foreground">
                    DIA could not assemble a brief right now.
                  </p>
                )}
              </div>
            )}

            {data.totalUnread > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-md border border-border bg-card px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Direct</p>
                  <p className="text-sm font-semibold text-foreground">
                    {data.directUnread} unread
                  </p>
                </div>
                <div className="rounded-md border border-border bg-card px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Groups</p>
                  <p className="text-sm font-semibold text-foreground">
                    {data.groupUnread} unread
                  </p>
                </div>
              </div>
            )}

            <ul className="space-y-1.5">
              {data.topThreads.map((t) => {
                const hl = brief.data?.highlights.find((h) => h.threadId === t.id);
                return (
                  <li
                    key={`${t.type}-${t.id}`}
                    className="rounded-md border border-border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => go(t.href)}
                      className="w-full text-left px-3 pt-2 pb-1.5 flex items-start gap-3"
                    >
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={t.avatarUrl || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {t.type === 'group' ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            t.title.slice(0, 1).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {t.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">
                            {t.lastMessageRelative}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {hl?.oneLiner || t.lastMessagePreview}
                        </p>
                        {hl?.suggestion && (
                          <p className="text-[11px] text-primary mt-0.5 leading-snug">
                            <MateMasie className="inline h-3 w-3 mr-1 align-[-2px]" />
                            {hl.suggestion}
                          </p>
                        )}
                      </div>
                      {t.unreadCount > 0 && (
                        <span className="self-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center leading-none flex-shrink-0">
                          {t.unreadCount > 99 ? '99+' : t.unreadCount}
                        </span>
                      )}
                    </button>
                    <div className="px-3 pb-2 flex items-center gap-1.5 border-t border-border/50 pt-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                        disabled={t.unreadCount === 0 || markRead.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead.mutate({ threadId: t.id, threadType: t.type });
                        }}
                      >
                        <Check className="h-3 w-3" />
                        Mark read
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Clock className="h-3 w-3" />
                            Snooze
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          <DropdownMenuItem
                            onClick={() =>
                              snooze.mutate({ threadId: t.id, threadType: t.type, hours: 1 })
                            }
                          >
                            For 1 hour
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              snooze.mutate({ threadId: t.id, threadType: t.type, hours: 8 })
                            }
                          >
                            Until later today
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              snooze.mutate({ threadId: t.id, threadType: t.type, hours: 24 })
                            }
                          >
                            Until tomorrow
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              snooze.mutate({ threadId: t.id, threadType: t.type, hours: 168 })
                            }
                          >
                            For a week
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground ml-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          go(t.href);
                        }}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                        Open
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go('/dna/messages')}
          className="gap-1.5"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Open Messages
        </Button>
        {data && data.totalUnread > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={markAllRead.isPending}
            onClick={() =>
              markAllRead.mutate(
                data.topThreads.map((t) => ({
                  id: t.id,
                  type: t.type,
                  unreadCount: t.unreadCount,
                })),
              )
            }
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="ml-auto">
          Close
        </Button>
      </div>
    </ResponsiveModal>
  );
};

export default InboxDigestSheet;
