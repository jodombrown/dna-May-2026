/**
 * DNA | CONVENE — My Event Card (Hosting Tab)
 * Enhanced card with status badge, inline metrics, contextual actions.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Share2, Copy, BarChart3, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { EventTime } from '@/components/events/EventTime';
import { eventStartMs } from '@/lib/events/eventTime';
import { isEventCompleted } from '@/lib/events/lifecycle';
import { cn } from '@/lib/utils';
import { ConveneEventBadge } from './ConveneEventBadge';
import { getEventStatus } from '@/utils/convene/getEventStatus';
import { PastEventDiaNudge } from './PastEventDiaNudge';
import { toast } from 'sonner';

interface MyEventCardEvent {
  id: string;
  title: string;
  slug?: string | null;
  start_time: string | null;
  time_confirmed?: boolean | null;
  date_confirmed?: boolean | null;
  end_time?: string | null;
  status?: string | null;
  max_attendees?: number | null;
  cover_image_url?: string | null;
  event_type?: string;
  format?: string;
  event_attendees?: Array<{ count: number }>;
}

interface MyEventCardProps {
  event: MyEventCardEvent;
  isPast?: boolean;
  className?: string;
}

export function MyEventCard({ event, isPast = false, className }: MyEventCardProps) {
  const navigate = useNavigate();
  const attendeeCount = event.event_attendees?.[0]?.count ?? 0;
  // Canonical event state: `status` is the source of truth; the legacy
  // boolean mirror columns are trigger-derived and must not be read here.
  const eventStatus = event.status ?? 'published';
  const isCancelled = eventStatus === 'cancelled';
  const isDraft = eventStatus === 'draft';
  const isCompleted = isEventCompleted(event);
  const liveStatus =
    isCancelled || isDraft || isCompleted ? null : getEventStatus(event, attendeeCount);

  const startMs = eventStartMs(event);
  const startDate = startMs !== null ? new Date(startMs) : null;
  const monthAbbrev = startDate ? format(startDate, 'MMM').toUpperCase() : 'TBA';
  const dayNumber = startDate ? format(startDate, 'd') : '·';

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dna/convene/events/${event.slug || event.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Event link copied!');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dna/convene/events/${event.slug || event.id}`;
    if (navigator.share) {
      navigator.share({ title: event.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const navigateTo = (path: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(path);
  };

  const eventPath = `/dna/convene/events/${event.slug || event.id}`;

  const registrationLabel = event.max_attendees
    ? `${attendeeCount}/${event.max_attendees} registered`
    : `${attendeeCount} registered`;

  return (
    <div className={cn('space-y-2', className)}>
      <Card
        className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-module-convene"
        onClick={() => navigate(eventPath)}
      >
        <div className="p-4 flex items-start gap-3">
          {/* Date box */}
          <div className="flex-shrink-0 w-11 h-11 border border-border rounded-lg bg-background flex flex-col items-center justify-center">
            <span className="text-micro text-dna-convene uppercase leading-none">
              {monthAbbrev}
            </span>
            <span className="text-lg font-bold leading-none mt-0.5">{dayNumber}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base leading-tight line-clamp-1 text-foreground">
                {event.title}
              </h3>
              {isCancelled ? (
                <Badge variant="destructive">Cancelled</Badge>
              ) : isCompleted ? (
                <Badge variant="secondary">Completed</Badge>
              ) : isDraft ? (
                <Badge variant="outline">Draft</Badge>
              ) : (
                liveStatus && <ConveneEventBadge status={liveStatus} />
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {/* The organizer's own card — no Notify-me on your own event. */}
              <EventTime
                event={{
                  start_time: event.start_time,
                  time_confirmed: event.time_confirmed,
                  date_confirmed: event.date_confirmed,
                }}
                variant="datetime"
                notifyAction={false}
              />
            </p>

            <p className="text-xs text-muted-foreground mt-1">{registrationLabel}</p>

            {/* Contextual actions */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {isPast ? (
                <>
                  <Button variant="outline" size="sm" onClick={navigateTo(eventPath)}>
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View Recap
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-3.5 w-3.5 mr-1.5" />
                    Share Recap
                  </Button>
                </>
              ) : isCancelled ? (
                <Button variant="outline" size="sm" onClick={navigateTo('/dna/convene/events/new')}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Duplicate
                </Button>
              ) : isDraft ? (
                <Button variant="outline" size="sm" onClick={navigateTo(eventPath)}>
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit Draft
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={navigateTo(eventPath)}>
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Manage
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-3.5 w-3.5 mr-1.5" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy Link
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* CONVENE → CONVEY nudge for past events */}
      {isPast && !isCancelled && (
        <PastEventDiaNudge eventId={event.id} eventTitle={event.title} variant="share_story" />
      )}
    </div>
  );
}
