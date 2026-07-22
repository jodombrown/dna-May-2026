/**
 * Contribute — Opportunity Card (Universal Feed)
 *
 * Finalized card model (BD083 palette, 4px bevel via FeedCardBase).
 *
 * CARD STANDARD (BD085): numbers appear only in the proof block. The engagement
 * row is always four verbs (React / Comment / Reshare / Save), no counts.
 *
 * Contribute's proof is CONSEQUENCE: the give → to → impact flow (BD084). It is
 * the signature no other card has — recognizable even in grayscale. You see the
 * effect before you act.
 *
 * Contribute is INITIATIVE-centric, not person-centric. Connect points at a
 * person; Contribute points at work + outcome. Distinct on purpose.
 *
 * State:
 *   direction = 'offer' → a giver.        Primary action: "Request this"
 *   direction = 'need'  → an initiative.  Primary action: "I can fill this"
 *
 * Capital is NOT a Contribute currency at v0.0 (D048). The compensation columns
 * exist because the composer writes them; no money is surfaced here.
 */

import React, { useState } from 'react';
import { UniversalFeedItem } from '@/types/feed';
import { FeedCardBase } from './FeedCardBase';
import { linkifyContent } from '@/utils/linkifyContent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Share2,
  MessageCircle,
  Bookmark,
  Repeat2,
  Smile,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePostLikes } from '@/hooks/usePostLikes';
import { usePostBookmarks } from '@/hooks/usePostBookmarks';
import { ThreadedComments } from '@/components/posts/ThreadedComments';
import { PostMenuOwn } from '@/components/posts/PostMenuOwn';
import { PostMenuOthers } from '@/components/posts/PostMenuOthers';

interface OpportunityFeedCardProps {
  item: UniversalFeedItem;
  currentUserId: string;
  onUpdate: () => void;
  showComments?: boolean;
  onCommentClick?: () => void;
  onReshare?: (postId: string) => void;
  /** "I can fill this" / "Request this" */
  onRespond?: (opportunityId: string) => void;
  /** Broker from your network — the compounding move. */
  onRefer?: (opportunityId: string) => void;
}

/** The currency being offered or asked for. Capital is deliberately absent (D048). */
const CATEGORY_LABEL: Record<string, string> = {
  skills_expertise: 'Expertise',
  mentorship_guidance: 'Mentorship',
  partnership_collaboration: 'Partnership',
  knowledge_training: 'Knowledge',
  network_introductions: 'Network',
  physical_resources: 'Resources',
  volunteer_time: 'Time',
};

export const OpportunityFeedCard: React.FC<OpportunityFeedCardProps> = ({
  item,
  currentUserId,
  onUpdate,
  showComments = false,
  onCommentClick,
  onReshare,
  onRespond,
  onRefer,
}) => {
  const navigate = useNavigate();
  const [localShowComments, setLocalShowComments] = useState(showComments);

  const { likeCount, userHasLiked, toggleLike } = usePostLikes(item.post_id, currentUserId);
  const { userHasBookmarked, toggleBookmark } = usePostBookmarks(item.post_id, currentUserId);

  const isOwner = item.author_id === currentUserId;
  const authorName = item.author_display_name || item.author_username || 'Member';

  // Opportunity fields ride the linked entity (BD081 post-backed envelope).
  const opp = (item as unknown as {
    direction?: 'need' | 'offer';
    category?: string;
    give_what?: string;
    give_to?: string;
    intended_impact?: string;
  }) ?? {};

  const isNeed = opp.direction !== 'offer';
  const opportunityId = item.linked_entity_id ?? item.post_id;

  const categoryLabel = opp.category
    ? `${CATEGORY_LABEL[opp.category] ?? opp.category}${isNeed ? ' needed' : ''}`
    : isNeed
      ? 'Needed'
      : 'Offering';

  // The triple (BD084). Falls back gracefully while DIA extraction rolls out.
  const triple = [
    { label: isNeed ? 'Need' : 'Give', value: opp.give_what },
    { label: isNeed ? 'For' : 'To', value: opp.give_to },
    { label: 'Impact', value: opp.intended_impact },
  ];
  const hasTriple = triple.some((t) => !!t.value);

  const commentsVisible = showComments || localShowComments;
  const handleCommentClick = () => {
    if (onCommentClick) onCommentClick();
    else setLocalShowComments((v) => !v);
  };

  return (
    <FeedCardBase bevelType="opportunity">
      {/* Header — the initiative, or the giver */}
      <div className="mb-3 flex items-start gap-3">
        <Avatar
          className="h-10 w-10 flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/dna/${item.author_username}`)}
        >
          <AvatarImage src={item.author_avatar_url || ''} />
          <AvatarFallback>{authorName[0]?.toUpperCase() || 'M'}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <span
            className="cursor-pointer text-sm font-semibold hover:underline"
            onClick={() => navigate(`/dna/${item.author_username}`)}
          >
            {item.title || authorName}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-bevel-opportunity">Contribute</span>
            {' · '}
            {isNeed ? 'Need' : 'Offering'}
            {' · '}
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
            item={item}
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

      {/* Currency pill */}
      <span className="mb-2 inline-block rounded-full bg-bevel-opportunity/15 px-2.5 py-0.5 text-[11px] font-semibold text-bevel-opportunity">
        {categoryLabel}
      </span>

      {/* The ask, or the offer */}
      <p className="mb-3 text-[15px] font-semibold leading-snug">
        {linkifyContent(item.content || '')}
      </p>

      {/* PROOF — the give → to → impact flow. Contribute's signature (BD084). */}
      {hasTriple && (
        <div className="flex items-stretch gap-1.5 rounded-lg bg-muted/50 p-2.5">
          {triple.map((step, idx) => (
            <React.Fragment key={step.label}>
              {idx > 0 && (
                <div className="flex items-center text-bevel-opportunity">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {step.label}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold leading-tight">
                  {step.value || '—'}
                </p>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Act, or broker from your network */}
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-bevel-opportunity text-[#3d2f05] hover:bg-bevel-opportunity/90"
          disabled={!onRespond}
          onClick={() => onRespond?.(opportunityId)}
        >
          {isNeed ? 'I can fill this' : 'Request this'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-bevel-opportunity text-bevel-opportunity hover:bg-bevel-opportunity/5"
          disabled={!onRefer}
          onClick={() => onRefer?.(opportunityId)}
        >
          <Share2 className="h-3.5 w-3.5" />
          Refer
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
              userHasLiked
                ? 'fill-bevel-opportunity/20 text-bevel-opportunity'
                : 'text-muted-foreground'
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
            className={cn(
              'h-4 w-4',
              commentsVisible ? 'text-bevel-opportunity' : 'text-muted-foreground'
            )}
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
              item.has_reshared ? 'text-bevel-opportunity' : 'text-muted-foreground'
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
              userHasBookmarked
                ? 'fill-current text-bevel-opportunity'
                : 'text-muted-foreground'
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
    </FeedCardBase>
  );
};
