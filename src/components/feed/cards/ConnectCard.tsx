/**
 * Connect — Connection Card (Universal Feed)
 *
 * The fifth and final card. Completes the create-and-circulate engine.
 *
 * Connect points at a PERSON. (Contribute points at work + an outcome; that is
 * the line between them, and DIA is prompted on exactly that distinction.)
 *
 * CARD STANDARD (BD085): numbers appear only in the proof block. The engagement
 * row is always four verbs — React / Comment / Reshare / Save — no counts.
 *
 * Connect's proof is RECOGNITION: mutual connections. "4 people you both know"
 * is what turns a cold ask into a warm one, and it is the reason someone
 * replies. Backed by the live `get_mutual_connections` RPC (verified against
 * pg_proc: returns id, username, full_name, avatar_url, headline).
 *
 * The proof block is a door (BD086) — it opens the ProofSheet listing exactly
 * who you both know.
 *
 * Two states, one card:
 *   direction 'seeking'  → they need someone.        Primary: "I can help"
 *   direction 'offering' → they are available.       Primary: "Reach out"
 * Either way, the secondary is "Introduce" — brokering from your own network is
 * the compounding move, and the whole point of a body that knows itself.
 */

import React, { useState } from 'react';
import { UniversalFeedItem } from '@/types/feed';
import { FeedCardBase } from './FeedCardBase';
import { ProofSheet } from '@/components/feed/ProofSheet';
import { linkifyContent } from '@/utils/linkifyContent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  MapPin,
  ArrowLeftRight,
  ChevronRight,
  MessageCircle,
  Bookmark,
  Repeat2,
  Smile,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { usePostLikes } from '@/hooks/usePostLikes';
import { usePostBookmarks } from '@/hooks/usePostBookmarks';
import { ThreadedComments } from '@/components/posts/ThreadedComments';
import { PostMenuOwn } from '@/components/posts/PostMenuOwn';
import { PostMenuOthers } from '@/components/posts/PostMenuOthers';

interface ConnectCardProps {
  item: UniversalFeedItem;
  currentUserId: string;
  onUpdate: () => void;
  showComments?: boolean;
  onCommentClick?: () => void;
  onReshare?: (postId: string) => void;
  /** "I can help" / "Reach out" — opens a message to the author. */
  onRespond?: (authorId: string) => void;
  /** Broker from your own network. */
  onIntroduce?: (authorId: string) => void;
}

interface ConnectFacets {
  /** Who they need, e.g. "Co-founder". */
  intent?: string;
  /** 'seeking' (default) or 'offering'. */
  direction?: 'seeking' | 'offering';
  /** Sector / industry line. */
  sector?: string;
  where?: string;
}

interface MutualConnection {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
}

/**
 * Live RPC (verified signature):
 *   get_mutual_connections(user1_id uuid, user2_id uuid)
 *     → TABLE(id, username, full_name, avatar_url, headline)
 */
function useMutualConnections(otherUserId: string, meId: string) {
  return useQuery({
    queryKey: ['mutual-connections', meId, otherUserId],
    enabled: !!otherUserId && !!meId && otherUserId !== meId,
    queryFn: async (): Promise<MutualConnection[]> => {
      const { data, error } = await supabase.rpc('get_mutual_connections', {
        user1_id: meId,
        user2_id: otherUserId,
      });
      if (error) return [];
      return (data ?? []) as MutualConnection[];
    },
  });
}

export const ConnectCard: React.FC<ConnectCardProps> = ({
  item,
  currentUserId,
  onUpdate,
  showComments = false,
  onCommentClick,
  onReshare,
  onRespond,
  onIntroduce,
}) => {
  const navigate = useNavigate();
  const [localShowComments, setLocalShowComments] = useState(showComments);
  const [proofOpen, setProofOpen] = useState(false);

  const { likeCount, userHasLiked, toggleLike } = usePostLikes(item.post_id, currentUserId);
  const { userHasBookmarked, toggleBookmark } = usePostBookmarks(item.post_id, currentUserId);

  const isOwner = item.author_id === currentUserId;
  const authorName = item.author_display_name || item.author_username || 'Member';
  const firstName = authorName.split(' ')[0];

  const facets = (item as unknown as ConnectFacets) ?? {};
  const isSeeking = facets.direction !== 'offering';

  const { data: mutuals = [] } = useMutualConnections(item.author_id, currentUserId);

  const contextLine = [facets.sector, facets.where].filter(Boolean).join(' · ');

  const commentsVisible = showComments || localShowComments;
  const handleCommentClick = () => {
    if (onCommentClick) onCommentClick();
    else setLocalShowComments((v) => !v);
  };

  return (
    <FeedCardBase bevelType="connect">
      {/* Header — Connect points at a person, so the person leads */}
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
            {authorName}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-bevel-connect">Connect</span>
            {' · '}
            {isSeeking ? 'Seeking' : 'Offering'}
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

      {/* Who they need */}
      {facets.intent && (
        <span className="mb-2 inline-block rounded-full bg-bevel-connect/10 px-2.5 py-0.5 text-[11px] font-semibold text-bevel-connect">
          {facets.intent}
        </span>
      )}

      {/* The ask */}
      <p className="mb-2 text-[15px] font-semibold leading-snug">
        {linkifyContent(item.content || '')}
      </p>

      {/* Context — sector and place */}
      {contextLine && (
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          {facets.sector ? (
            <Briefcase className="h-3.5 w-3.5 flex-shrink-0 text-bevel-connect" />
          ) : (
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-bevel-connect" />
          )}
          {contextLine}
        </p>
      )}

      {/* PROOF — recognition. The only place numbers live on this card,
          and it is a door (BD086). */}
      {mutuals.length > 0 && (
        <button
          type="button"
          onClick={() => setProofOpen(true)}
          className="mt-3 flex w-full items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted"
        >
          <div className="flex flex-shrink-0">
            {mutuals.slice(0, 3).map((m, idx) => (
              <Avatar
                key={m.id}
                className={cn('h-6 w-6 border-2 border-card', idx > 0 && '-ml-2')}
              >
                <AvatarImage src={m.avatar_url || ''} />
                <AvatarFallback className="text-[9px]">
                  {(m.full_name || m.username || 'M')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {mutuals.length} {mutuals.length === 1 ? 'person' : 'people'}
            </span>
            {' you both know'}
          </p>
          <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </button>
      )}

      {/* Act, or broker */}
      {!isOwner && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-bevel-connect text-white hover:bg-bevel-connect/90"
            disabled={!onRespond}
            onClick={() => onRespond?.(item.author_id)}
          >
            {isSeeking ? 'I can help' : `Reach out to ${firstName}`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-bevel-connect text-bevel-connect hover:bg-bevel-connect/5"
            disabled={!onIntroduce}
            onClick={() => onIntroduce?.(item.author_id)}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Introduce
          </Button>
        </div>
      )}

      {/* Engagement — four verbs, no counts (BD085) */}
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
              userHasLiked ? 'fill-bevel-connect/20 text-bevel-connect' : 'text-muted-foreground'
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
              commentsVisible ? 'text-bevel-connect' : 'text-muted-foreground'
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
              item.has_reshared ? 'text-bevel-connect' : 'text-muted-foreground'
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
              userHasBookmarked ? 'fill-current text-bevel-connect' : 'text-muted-foreground'
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

      {/* Who you both know (BD086) */}
      <ProofSheet
        open={proofOpen}
        onOpenChange={setProofOpen}
        kind="mutual_connections"
        entityId={item.author_id}
        title={`People you and ${firstName} both know`}
      />
    </FeedCardBase>
  );
};
