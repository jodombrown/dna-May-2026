/**
 * Convene — Event Card (Universal Feed)
 *
 * Finalized card model (BD083 palette, 4px bevel via FeedCardBase).
 *
 * CARD STANDARD (BD085): numbers appear only where they are labelled and where
 * they persuade — the proof block. The engagement row is always four verbs
 * (React / Comment / Reshare / Save) on every card, no counts.
 *
 * Convene's proof is NETWORK MOMENTUM: "3 in your network going" beats a raw
 * headcount. Backed by useMutualAttendees (connections ⋈ event_attendees).
 *
 * NOTE (BD082): React is wired to the existing like hook until the 5-reaction
 * write path lands. Reshare is presented and routes to the parent handler.
 */

import React, { useState } from 'react';
import { UniversalFeedItem } from '@/types/feed';
import { FeedCardBase } from './FeedCardBase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  MapPin,
  Check,
  CalendarPlus,
  MessageCircle,
  Bookmark,
  Repeat2,
  Smile,
  Users,
  ChevronRight,
  Settings2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatEventPlace } from '@/lib/events/formatPlace';
import { formatEventDateTime } from '@/lib/events/eventTime';
import { usePostLikes } from '@/hooks/usePostLikes';
import { usePostBookmarks } from '@/hooks/usePostBookmarks';
import { useEventDetailsForFeed } from '@/hooks/useEventDetailsForFeed';
import { useEventRsvpFromFeed } from '@/hooks/useEventRsvpFromFeed';
import { useMutualAttendees } from '@/hooks/useMutualAttendees';
import { ThreadedComments } from '@/components/posts/ThreadedComments';
import { ProofSheet } from '@/components/feed/ProofSheet';
import { PostMenuOwn } from '@/components/posts/PostMenuOwn';
import { PostMenuOthers } from '@/components/posts/PostMenuOthers';

interface EventCardProps {
  item: UniversalFeedItem;
  currentUserId: string;
  onUpdate: () => void;
  showComments?: boolean;
  onCommentClick?: () => void;
  onReshare?: (postId: string) => void;
  onRsvp?: (eventId: string) => void;
  isAttending?: boolean;
}

const EVENT_FORMAT_LABEL: Record<string, string> = {
  in_person: 'In person',
  virtual: 'Virtual',
  hybrid: 'Hybrid',
};

export const EventCard: React.FC<EventCardProps> = ({
  item,
  currentUserId,
  onUpdate,
  showComments = false,
  onCommentClick,
  onReshare,
  onRsvp,
  isAttending = false,
}) => {
  const navigate = useNavigate();
  const [localShowComments, setLocalShowComments] = useState(showComments);
  const [proofOpen, setProofOpen] = useState(false);

  const { data: eventDetails, isLoading } = useEventDetailsForFeed(item.event_id);
  const { data: mutuals = [] } = useMutualAttendees(item.event_id ?? undefined);

  const { likeCount, userHasLiked, toggleLike } = usePostLikes(item.post_id, currentUserId);
  const { userHasBookmarked, toggleBookmark } = usePostBookmarks(item.post_id, currentUserId);

  // The card RSVPs on its own — the feed does not thread an onRsvp handler
  // down, and a dead grey RSVP button is a bug, not a state.
  const selfRsvp = useEventRsvpFromFeed(item.event_id, currentUserId);
  const attending = onRsvp ? isAttending : selfRsvp.isAttending;

  // You cannot attend what you are hosting. The envelope author is usually the
  // host, but the events row is the source of truth — check both, so a stale
  // or system-authored envelope can never hand the host a dead RSVP button.
  const isOwner =
    item.author_id === currentUserId ||
    (!!eventDetails?.organizer_id && eventDetails.organizer_id === currentUserId);
  const authorName = item.author_display_name || item.author_username || 'Host';

  const title = eventDetails?.title || item.event_title || item.title || 'Event';
  const coverImage = eventDetails?.cover_image_url || item.media_url;
  const attendeeCount = eventDetails?.attendee_count ?? 0;
  const slug = eventDetails?.slug || item.event_id;
  const eventHref = `/dna/convene/events/${slug}`;

  const formatLabel = eventDetails?.event_type
    ? EVENT_FORMAT_LABEL[eventDetails.event_type] ?? eventDetails.event_type
    : null;

  const locationLine =
    (eventDetails ? formatEventPlace(eventDetails, 'compact') : '') ||
    eventDetails?.location_name ||
    null;

  const whenLine = eventDetails ? formatEventDateTime(eventDetails, 'datetime') || null : null;

  const commentsVisible = showComments || localShowComments;
  const handleCommentClick = () => {
    if (onCommentClick) onCommentClick();
    else setLocalShowComments((v) => !v);
  };

  return (
    <FeedCardBase bevelType="event">
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <Avatar
          className="h-10 w-10 flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/dna/${item.author_username}`)}
        >
          <AvatarImage src={item.author_avatar_url || ''} />
          <AvatarFallback>{authorName[0]?.toUpperCase() || 'H'}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <span
            className="cursor-pointer text-sm font-semibold hover:underline"
            onClick={() => navigate(`/dna/${item.author_username}`)}
          >
            {authorName}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-bevel-event">Convene</span>
            {' · Hosting · '}
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </p>
        </div>

        {isOwner ? (
          <PostMenuOwn
            postId={item.post_id}
            authorId={item.author_id}
            currentUserId={currentUserId}
            content={item.content || ''}
            onUpdate={onUpdate}
            editHref={
              item.event_id
                ? `/dna/convene/events/${eventDetails?.slug || item.event_id}/edit`
                : undefined
            }
          />
        ) : (
          <PostMenuOthers
            postId={item.post_id}
            authorId={item.author_id}
            authorName={authorName}
            currentUserId={currentUserId}
            onUpdate={onUpdate}
          />
        )}
      </div>

      {/* Cover — media sits high on a Convene card */}
      <div
        className="relative mb-3 h-40 w-full cursor-pointer overflow-hidden rounded-lg bg-bevel-event/90 sm:h-44"
        onClick={() => navigate(eventHref)}
      >
        {coverImage && (
          <img src={coverImage} alt={title} className="h-full w-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        {formatLabel && (
          <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-bevel-event">
            {formatLabel}
          </span>
        )}
      </div>

      {/* Title + the concrete facts you need to decide */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <>
          <button
            type="button"
            className="block w-full text-left"
            onClick={() => navigate(eventHref)}
          >
            <h3 className="text-base font-semibold leading-snug hover:opacity-80 sm:text-lg">
              {title}
            </h3>
          </button>

          <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
            {whenLine && (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0 text-bevel-event" />
                {whenLine}
              </span>
            )}
            {locationLine && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-bevel-event" />
                {locationLine}
              </span>
            )}
          </div>
        </>
      )}

      {/* PROOF — network momentum. The only place numbers live on this card. */}
      {(mutuals.length > 0 || attendeeCount > 0) && (
        <button
          type="button"
          onClick={() => setProofOpen(true)}
          className="mt-3 flex w-full items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted"
        >
          {mutuals.length > 0 ? (
            <>
              <div className="flex flex-shrink-0">
                {mutuals.slice(0, 3).map((m, idx) => (
                  <Avatar
                    key={m.user_id}
                    className={cn('h-6 w-6 border-2 border-card', idx > 0 && '-ml-2')}
                  >
                    <AvatarImage src={m.avatar_url || ''} />
                    <AvatarFallback className="text-[9px]">
                      {(m.full_name || 'U')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {mutuals.length} in your network
                </span>
                {' going'}
                {attendeeCount > mutuals.length && ` · ${attendeeCount} total`}
              </p>
            </>
          ) : (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">{attendeeCount}</span> going
            </p>
          )}
          <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </button>
      )}

      {/* One-tap RSVP from the feed. You cannot attend what you are hosting —
          the owner gets Manage, not a dead RSVP button. */}
      <div className="mt-3 flex gap-2">
        {isOwner ? (
          <Button
            size="sm"
            className="flex-1 gap-1.5 bg-bevel-event text-white hover:bg-bevel-event/90"
            onClick={() => navigate(`/dna/convene/events/${slug}/manage`)}
          >
            <Settings2 className="h-4 w-4" />
            Manage
          </Button>
        ) : (
          <Button
            size="sm"
            className={cn(
              'flex-1 gap-1.5',
              attending
                ? 'border border-bevel-event bg-transparent text-bevel-event hover:bg-bevel-event/5'
                : 'bg-bevel-event text-white hover:bg-bevel-event/90'
            )}
            disabled={!item.event_id || selfRsvp.isPending}
            onClick={() => {
              if (!item.event_id) return;
              if (onRsvp) onRsvp(item.event_id);
              else selfRsvp.toggleRsvp();
            }}
          >
            {attending ? (
              <>
                <Check className="h-4 w-4" />
                Going
              </>
            ) : (
              <>
                <CalendarPlus className="h-4 w-4" />
                RSVP
              </>
            )}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => navigate(eventHref)}>
          Details
        </Button>
      </div>

      {/* Engagement row — four verbs, no counts (BD085) */}
      <div className="mt-3 flex items-center justify-between border-t pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          onClick={() => toggleLike()}
        >
          <Smile
            className={cn(
              'h-4 w-4',
              userHasLiked ? 'fill-bevel-event/20 text-bevel-event' : 'text-muted-foreground'
            )}
          />
          <span>React</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          onClick={handleCommentClick}
        >
          <MessageCircle
            className={cn('h-4 w-4', commentsVisible ? 'text-bevel-event' : 'text-muted-foreground')}
          />
          <span>Comment</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          disabled={!onReshare}
          onClick={() => onReshare?.(item.post_id)}
        >
          <Repeat2
            className={cn(
              'h-4 w-4',
              item.has_reshared ? 'text-bevel-event' : 'text-muted-foreground'
            )}
          />
          <span>Reshare</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-xs"
          onClick={() => toggleBookmark()}
        >
          <Bookmark
            className={cn(
              'h-4 w-4',
              userHasBookmarked ? 'fill-current text-bevel-event' : 'text-muted-foreground'
            )}
          />
          <span>Save</span>
        </Button>
      </div>

      {commentsVisible && (
        <ThreadedComments
          postId={item.post_id}
          currentUserId={currentUserId}
          commentsDisabled={!!item.comments_disabled}
        />
      )}

      {/* The proof block is a door (BD086) */}
      <ProofSheet
        open={proofOpen}
        onOpenChange={setProofOpen}
        kind="attendees"
        entityId={item.event_id}
        title={`Going to ${title}`}
      />
    </FeedCardBase>
  );
};
