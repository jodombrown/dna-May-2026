/**
 * Collaborate — Space Card (Universal Feed)
 *
 * Finalized card model (BD083 palette, 4px bevel via FeedCardBase).
 *
 * This IS the Space surfacing in the feed. There is no separate "Spaces card" —
 * one component, one welding (D084).
 *
 * CARD STANDARD (BD085): numbers appear only in the proof block. The engagement
 * row is always four verbs (React / Comment / Reshare / Save), no counts.
 *
 * Collaborate's proof is the SPACE'S LIVE STATE — team / countries / progress.
 * The richest proof of any C, because a Space has a real, ongoing state to show.
 *
 * State:
 *   recruiting → open roles + "Request to join"
 *   update     → progress + "Follow"
 *
 * Capital held (D048): no "$ pooled" figure at v0.0. Non-capital metrics only.
 *
 * BUGFIX: the previous card rendered `item.view_count` labelled "members" — a
 * wrong number wearing a right label. Now reads the real member count.
 */

import React, { useState } from 'react';
import { UniversalFeedItem } from '@/types/feed';
import { FeedCardBase } from './FeedCardBase';
import { linkifyContent } from '@/utils/linkifyContent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  MessageCircle,
  Bookmark,
  Repeat2,
  Smile,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePostLikes } from '@/hooks/usePostLikes';
import { usePostBookmarks } from '@/hooks/usePostBookmarks';
import { ThreadedComments } from '@/components/posts/ThreadedComments';
import { ProofSheet } from '@/components/feed/ProofSheet';
import { PostMenuOwn } from '@/components/posts/PostMenuOwn';
import { PostMenuOthers } from '@/components/posts/PostMenuOthers';

interface SpaceCardProps {
  item: UniversalFeedItem;
  currentUserId: string;
  onUpdate: () => void;
  showComments?: boolean;
  onCommentClick?: () => void;
  onReshare?: (postId: string) => void;
  onJoinRequest?: (spaceId: string) => void;
  onFollow?: (spaceId: string) => void;
  isFollowing?: boolean;
}

interface SpaceFacets {
  space_state?: 'recruiting' | 'update';
  space_type?: string;
  member_count?: number;
  country_count?: number;
  roles_needed?: Array<{ id?: string; title?: string } | string>;
  progress_pct?: number;
  /** One headline metric the Space itself defines, e.g. { label: 'Schools', value: 10 } */
  headline_metric?: { label: string; value: number };
}

const roleLabel = (r: { title?: string } | string): string =>
  typeof r === 'string' ? r : r.title ?? 'Open role';

export const SpaceCard: React.FC<SpaceCardProps> = ({
  item,
  currentUserId,
  onUpdate,
  showComments = false,
  onCommentClick,
  onReshare,
  onJoinRequest,
  onFollow,
  isFollowing = false,
}) => {
  const navigate = useNavigate();
  const [localShowComments, setLocalShowComments] = useState(showComments);
  const [proofOpen, setProofOpen] = useState(false);

  const { likeCount, userHasLiked, toggleLike } = usePostLikes(item.post_id, currentUserId);
  const { userHasBookmarked, toggleBookmark } = usePostBookmarks(item.post_id, currentUserId);

  const isOwner = item.author_id === currentUserId;
  const authorName = item.author_display_name || item.author_username || 'Space';
  const spaceName = item.space_title || item.title || 'Space';
  const spaceHref = item.space_id ? `/dna/collaborate/spaces/${item.space_id}` : '/dna/collaborate';

  const facets = (item as unknown as SpaceFacets) ?? {};
  const rolesNeeded = facets.roles_needed ?? [];
  const isRecruiting = facets.space_state === 'recruiting' || rolesNeeded.length > 0;
  const progress = facets.progress_pct;

  // The live dashboard. Only real counts — never view_count wearing a members label.
  const stats = [
    { label: 'Team', value: facets.member_count },
    { label: 'Countries', value: facets.country_count },
    facets.headline_metric
      ? { label: facets.headline_metric.label, value: facets.headline_metric.value }
      : null,
  ].filter((s): s is { label: string; value: number } => !!s && typeof s.value === 'number');

  const commentsVisible = showComments || localShowComments;
  const handleCommentClick = () => {
    if (onCommentClick) onCommentClick();
    else setLocalShowComments((v) => !v);
  };

  return (
    <FeedCardBase bevelType="space">
      {/* Header — the Space is the actor, not the person */}
      <div className="mb-3 flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0 cursor-pointer" onClick={() => navigate(spaceHref)}>
          <AvatarImage src={item.media_url || item.author_avatar_url || ''} />
          <AvatarFallback>{spaceName[0]?.toUpperCase() || 'S'}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <span
            className="cursor-pointer text-sm font-semibold hover:underline"
            onClick={() => navigate(spaceHref)}
          >
            {spaceName}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-bevel-space">Collaborate</span>
            {' · '}
            {isRecruiting ? 'Recruiting' : 'Update'}
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

      {/* Type pill */}
      {facets.space_type && (
        <span className="mb-2 inline-block rounded-full bg-bevel-space/10 px-2.5 py-0.5 text-[11px] font-semibold text-bevel-space">
          {facets.space_type}
        </span>
      )}

      {/* What the Space is doing */}
      <p className="mb-3 text-[15px] font-semibold leading-snug">
        {linkifyContent(item.content || '')}
      </p>

      {/* Recruiting — the roles that need filling */}
      {isRecruiting && rolesNeeded.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {rolesNeeded.slice(0, 4).map((role, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 rounded-full bg-bevel-space/10 px-2.5 py-1 text-xs text-bevel-space"
            >
              <Zap className="h-3 w-3" />
              {roleLabel(role)}
            </span>
          ))}
        </div>
      )}

      {/* Update — progress toward completion (D052: helping the body finish what it starts) */}
      {!isRecruiting && typeof progress === 'number' && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-bevel-space">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* PROOF — the Space's live state. The only place numbers live on this card. */}
      {stats.length > 0 && (
        <button
          type="button"
          onClick={() => setProofOpen(true)}
          className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-center transition-colors hover:bg-muted"
        >
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-sm font-semibold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </button>
      )}

      {/* Join the work, or follow it */}
      <div className="mt-3 flex gap-2">
        {isRecruiting ? (
          <Button
            size="sm"
            className="flex-1 bg-bevel-space text-white hover:bg-bevel-space/90"
            disabled={!onJoinRequest || !item.space_id}
            onClick={() => item.space_id && onJoinRequest?.(item.space_id)}
          >
            Request to join
          </Button>
        ) : (
          <Button
            size="sm"
            className={cn(
              'flex-1',
              isFollowing
                ? 'border border-bevel-space bg-transparent text-bevel-space hover:bg-bevel-space/5'
                : 'bg-bevel-space text-white hover:bg-bevel-space/90'
            )}
            disabled={!onFollow || !item.space_id}
            onClick={() => item.space_id && onFollow?.(item.space_id)}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="border-bevel-space text-bevel-space hover:bg-bevel-space/5"
          onClick={() => navigate(spaceHref)}
        >
          View Space
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
              userHasLiked ? 'fill-bevel-space/20 text-bevel-space' : 'text-muted-foreground'
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
            className={cn('h-4 w-4', commentsVisible ? 'text-bevel-space' : 'text-muted-foreground')}
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
              item.has_reshared ? 'text-bevel-space' : 'text-muted-foreground'
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
              userHasBookmarked ? 'fill-current text-bevel-space' : 'text-muted-foreground'
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

      {/* The proof block is a door (BD086) — who is in this Space, and what they hold */}
      <ProofSheet
        open={proofOpen}
        onOpenChange={setProofOpen}
        kind="space_members"
        entityId={item.space_id}
        title={`Inside ${spaceName}`}
      />
    </FeedCardBase>
  );
};
