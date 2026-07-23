/**
 * Convey — Story Card (Universal Feed)
 *
 * Finalized card model (BD083 palette, full-frame bevel at --bevel-width via FeedCardBase):
 * - Metadata line: Convey · {story_type} · {age} · {n} min read (BD177 folds
 *   the former kicker pill and read-time badge into one row).
 * - Serif title (whole heading taps through to the story), dek, hero media /
 *   gallery / link preview (BD074 states).
 * - Body with an INLINE expander: title navigates, "…more" expands in place.
 * - Reach earns itself: traveled stories show the full stat block; a story with
 *   no traction renders no row at all (BD177 drops the empty-state row).
 * - Convey → Connect hand-off ("Connect with {author}") in Connect green —
 *   the story-recruits-a-member loop.
 * - Engagement row via shared <CardActionRow>: React / Comment / Reshare, Save
 *   pushed right.
 * - CARD RULE (all five C's): numbers appear only where they are labelled and
 *   where they persuade — the proof block. The engagement row is always four
 *   verbs, identical on every card. A story with no reach yet shows no numbers
 *   at all; it earns them.
 *
 * NOTE (BD082): the 5-DNA-reaction write path does not exist yet. React is
 * wired to the existing like hook (post_likes) so behavior is unchanged and
 * honest; it swaps to the reaction RPC when BD082 lands. Reshare is presented
 * and routes to the existing reshare path.
 */

import React, { useState } from 'react';
import { UniversalFeedItem } from '@/types/feed';
import { FeedCardBase } from './FeedCardBase';
import { CardMedia } from './CardMedia';
import { CardActionRow } from './CardActionRow';
import { linkifyContent } from '@/utils/linkifyContent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  Bookmark,
  Repeat2,
  Smile,
  Images,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePostLikes } from '@/hooks/usePostLikes';
import { usePostBookmarks } from '@/hooks/usePostBookmarks';
import { LinkPreviewCard } from '@/components/feed/LinkPreviewCard';
import { ThreadedComments } from '@/components/posts/ThreadedComments';
import { PostMenuOwn } from '@/components/posts/PostMenuOwn';
import { PostMenuOthers } from '@/components/posts/PostMenuOthers';
import { EditedMarker } from '@/components/posts/EditedMarker';

interface StoryCardProps {
  item: UniversalFeedItem;
  currentUserId: string;
  onUpdate: () => void;
  showComments?: boolean;
  onCommentClick?: () => void;
  onReshare?: (postId: string) => void;
}

/** A story is "traveled" once it has actually reached beyond the author. */
const TRAVELED_VIEW_FLOOR = 100;

const WORDS_PER_MINUTE = 200;
const readTime = (content: string): number =>
  Math.max(1, Math.round(content.trim().split(/\s+/).length / WORDS_PER_MINUTE));

/** Compact relative age for the metadata line: "3 days ago" → "3d". */
const abbrevAge = (iso: string): string => {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const mins = Math.floor(secs / 60);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
};

const compact = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`;

/** Title-cases the raw story_type value ("founder_journey" → "Founder journey"). */
const kickerLabel = (storyType: string | null): string => {
  if (!storyType) return 'Story';
  const s = storyType.replace(/[_-]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const StoryCard: React.FC<StoryCardProps> = ({
  item,
  currentUserId,
  onUpdate,
  showComments = false,
  onCommentClick,
  onReshare,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localShowComments, setLocalShowComments] = useState(showComments);

  const { likeCount, userHasLiked, toggleLike } = usePostLikes(item.post_id, currentUserId);
  const { userHasBookmarked, toggleBookmark } = usePostBookmarks(item.post_id, currentUserId);

  const isOwner = item.author_id === currentUserId;
  const authorName = item.author_display_name || item.author_username || 'this member';
  const firstName = authorName.split(' ')[0];

  const bodyPreview = item.content.slice(0, 240);
  const needsExpansion = item.content.length > 240;
  const storyHref = `/dna/story/${item.slug || item.post_id}`;

  // Reach scales, it doesn't start big.
  const hasTraveled = item.view_count >= TRAVELED_VIEW_FLOOR;
  const totalReactions = likeCount;

  const commentsVisible = showComments || localShowComments;
  const handleCommentClick = () => {
    if (onCommentClick) onCommentClick();
    else setLocalShowComments((v) => !v);
  };

  return (
    <FeedCardBase bevelType="story">
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <Avatar
          className="h-10 w-10 flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/dna/${item.author_username}`)}
        >
          <AvatarImage src={item.author_avatar_url || ''} />
          <AvatarFallback>{authorName[0]?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <span
            className="cursor-pointer text-sm font-semibold hover:underline"
            onClick={() => navigate(`/dna/${item.author_username}`)}
          >
            {authorName}
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-bevel-story">Convey</span>
            {' · '}
            {kickerLabel(item.story_type)}
            {' · '}
            {abbrevAge(item.created_at)}
            {' · '}
            {readTime(item.content)} min read
            {/* BD160 requires the edit disclosure stay visible to non-authors and
                anon viewers; the author's marker relocates to the PostMenu overflow. */}
            {!isOwner && item.edited_at && (
              <>
                {' · '}
                <EditedMarker editedAt={item.edited_at} postId={item.post_id} isOwn={false} />
              </>
            )}
          </p>
        </div>

        {isOwner ? (
          <PostMenuOwn
            postId={item.post_id}
            authorId={item.author_id}
            currentUserId={currentUserId}
            content={item.content}
            onUpdate={onUpdate}
            item={item}
            editedAt={item.edited_at}
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

      {/* Title — whole heading is the tap target; runs full measure (BD177). */}
      <button
        type="button"
        className="group block w-full text-left"
        onClick={() => navigate(storyHref)}
      >
        <h3 className="font-serif text-lg font-semibold leading-tight transition-opacity group-hover:opacity-80 md:text-xl">
          {item.title || 'Untitled story'}
        </h3>
      </button>

      {/* Dek */}
      {item.subtitle && (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.subtitle}</p>
      )}

      {/* Media — hero. Bleeds to the frame (BD178); mid-card, so square corners. */}
      {item.media_url && (
        <CardMedia
          className="mt-3 h-44 cursor-pointer sm:h-48"
          onClick={() => navigate(storyHref)}
        >
          <img
            src={item.media_url}
            alt={item.title || 'Story'}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </CardMedia>
      )}

      {/* Media — gallery (carousel with peek, BD074) */}
      {item.gallery_urls && item.gallery_urls.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Images className="h-3.5 w-3.5" />
            <span>{item.gallery_urls.length} photos</span>
          </div>
          <div
            className="story-scroll -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1"
            onClick={() => navigate(storyHref)}
          >
            {item.gallery_urls.map((url, idx) => (
              <div
                key={idx}
                className="h-36 w-[78%] min-w-[220px] max-w-[280px] flex-shrink-0 snap-start overflow-hidden rounded-xl bg-muted/30 sm:h-40 sm:w-[240px]"
              >
                <img
                  src={url}
                  alt={`Gallery ${idx + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media — link preview (compact, BD074) */}
      {item.link_url && (
        <div className="mt-3">
          <LinkPreviewCard
            data={{
              url: item.link_url,
              title: item.link_title || undefined,
              description: item.link_description || undefined,
              provider_name: item.link_metadata?.provider_name,
              thumbnail_url: item.link_metadata?.thumbnail_url,
              type: item.link_metadata?.embed_type,
              is_video: item.link_metadata?.is_video,
            }}
            showRemoveButton={false}
            size="full"
          />
        </div>
      )}

      {/* Body preview — the expander is INLINE, never its own row. The title
          navigates; this toggles in place. Two distinct behaviors (BD177). */}
      <div className="mt-3">
        {isExpanded ? (
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            {(() => {
              const paragraphs = item.content.split('\n\n');
              return paragraphs.map((p, idx) => (
                <p key={idx} className="whitespace-pre-line">
                  {linkifyContent(p)}
                  {idx === paragraphs.length - 1 && (
                    <>
                      {' '}
                      <button
                        type="button"
                        onClick={() => setIsExpanded((v) => !v)}
                        className="font-semibold text-bevel-story"
                      >
                        Show less
                      </button>
                    </>
                  )}
                </p>
              ));
            })()}
          </div>
        ) : (
          <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {linkifyContent(bodyPreview)}
            {needsExpansion && (
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="font-semibold text-bevel-story"
              >
                …more
              </button>
            )}
          </p>
        )}
      </div>

      {/* Reach — earns itself. A story with no traction renders no row at all
          (BD177): an empty-state row costs layout for near-zero information. */}
      {hasTraveled && (
        <div className="mt-3 flex justify-between rounded-lg bg-muted/50 px-3 py-2 text-center">
          <div>
            <p className="text-sm font-semibold">{compact(item.view_count)}</p>
            <p className="text-[11px] text-muted-foreground">Views</p>
          </div>
          <div>
            <p className="text-sm font-semibold">{compact(totalReactions)}</p>
            <p className="text-[11px] text-muted-foreground">Reactions</p>
          </div>
          <div>
            <p className="text-sm font-semibold">{compact(item.comment_count)}</p>
            <p className="text-[11px] text-muted-foreground">Comments</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-bevel-story">{compact(item.reshare_count)}</p>
            <p className="text-[11px] text-muted-foreground">Reshares</p>
          </div>
        </div>
      )}

      {/* Convey → Connect hand-off (loop closes; Connect green, not Convey) */}
      {!isOwner && (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border p-2.5">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage src={item.author_avatar_url || ''} />
            <AvatarFallback className="text-[10px]">
              {authorName[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <p className="flex-1 text-xs text-muted-foreground">Moved by this?</p>
          <Button
            size="sm"
            className="h-7 bg-bevel-connect text-xs text-white hover:bg-bevel-connect/90"
            onClick={() => navigate(`/dna/${item.author_username}`)}
          >
            Connect with {firstName}
          </Button>
        </div>
      )}

      {/* Engagement row: React / Comment / Reshare (left-packed) · Save (right) */}
      <CardActionRow
        accent="text-bevel-story"
        actions={[
          {
            icon: Smile,
            label: 'React',
            onClick: () => toggleLike(),
            active: userHasLiked,
            activeClassName: 'fill-bevel-story/20 text-bevel-story',
          },
          {
            icon: MessageCircle,
            label: 'Comment',
            onClick: handleCommentClick,
            active: commentsVisible,
          },
          {
            icon: Repeat2,
            label: 'Reshare',
            onClick: () => onReshare?.(item.post_id),
            active: item.has_reshared,
            disabled: !onReshare,
          },
        ]}
        trailing={{
          icon: Bookmark,
          label: 'Save',
          onClick: () => toggleBookmark(),
          active: userHasBookmarked,
          activeClassName: 'fill-current text-bevel-story',
        }}
      />

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
