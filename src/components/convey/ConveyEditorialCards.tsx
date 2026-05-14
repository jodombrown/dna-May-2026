/**
 * DNA | CONVEY - Editorial Post Cards
 *
 * Four visually distinct card types for the CONVEY publication:
 * - Story: Magazine cover energy with copper left border
 * - Update: Dispatch-style neutral card
 * - Question: Emerald-accented discussion card
 * - Opportunity: Amber-accented economic signal card
 *
 * All cards include the DNA ConveyReactionsBar.
 * Zero "like" or "heart". Zero window.location.href. Zero `any`.
 */

import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, HelpCircle, MessageCircle, Bookmark, BookmarkCheck, Share2, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { UniversalFeedItem } from '@/types/feed';
import { useStoryEngagement, useStoryViewTracker } from '@/hooks/useStoryEngagement';
import { useAuth } from '@/contexts/AuthContext';
import { ConveyReactionsBar, type ConveyReactionType } from './ConveyReactionsBar';

// ─── Helpers ─────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'DN';
}

function estimateReadTime(content: string | null | undefined): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function getExcerpt(content: string | null | undefined, max = 140): string {
  if (!content) return '';
  let plain = content.replace(/[#*_\[\]()>`~]/g, '').trim();
  // Strip metadata headers like "Read Time: X min | Tags: ..."
  plain = plain.replace(/^Read\s*Time:\s*\d+\s*min\s*\|?\s*Tags?:\s*[^\n]*/i, '').trim();
  // Strip concatenated hashtag blocks (3+ capitalized words jammed together)
  plain = plain.replace(/(?:[A-Z][a-z]+){3,}/g, '').trim();
  // If first block looks like metadata (contains pipes), skip to first real paragraph
  if (plain.startsWith('|') || /^[^.\n]{0,20}\|/.test(plain)) {
    const parts = plain.split(/\n\n+/);
    plain = parts.length > 1 ? parts.slice(1).join(' ').trim() : plain;
  }
  // Clean up extra whitespace
  plain = plain.replace(/\s+/g, ' ').trim();
  if (plain.length <= max) return plain;
  return plain.substring(0, max).trim() + '…';
}

// Map old emoji reactions to DNA reaction types for the ConveyReactionsBar
function mapReactionsToCounts(
  reactions: { emoji: string; count: number }[]
): Partial<Record<ConveyReactionType, number>> {
  const emojiToType: Record<string, ConveyReactionType> = {
    '🤝': 'asante', '🙏': 'asante',
    '✨': 'inspired',
    '🔨': 'lets_build',
    '💪': 'powerful', '✊': 'powerful',
    '💡': 'insightful', '🧠': 'insightful',
    '👏': 'asante', '❤️': 'asante', '🔥': 'inspired', '🙌': 'powerful',
  };
  const counts: Partial<Record<ConveyReactionType, number>> = {};
  for (const r of reactions) {
    const type = emojiToType[r.emoji];
    if (type) {
      counts[type] = (counts[type] || 0) + r.count;
    }
  }
  return counts;
}

function mapCurrentReaction(emoji: string | undefined): ConveyReactionType | null {
  if (!emoji) return null;
  const map: Record<string, ConveyReactionType> = {
    '🤝': 'asante', '🙏': 'asante', '👏': 'asante', '❤️': 'asante',
    '✨': 'inspired', '🔥': 'inspired',
    '🔨': 'lets_build',
    '💪': 'powerful', '✊': 'powerful', '🙌': 'powerful',
    '💡': 'insightful', '🧠': 'insightful',
  };
  return map[emoji] || null;
}

// Map DNA reaction type back to emoji for storage
const DNA_TYPE_TO_EMOJI: Record<ConveyReactionType, string> = {
  asante: '🤝',
  inspired: '✨',
  lets_build: '🔨',
  powerful: '💪',
  insightful: '💡',
};

// ─── Shared Action Row ───────────────────────────────────────────────

interface ActionRowProps {
  commentCount: number;
  viewCount: number;
  isBookmarked: boolean;
  isTogglingBookmark: boolean;
  onComment: () => void;
  onBookmark: () => void;
  onShare: () => void;
}

function ActionRow({ commentCount, viewCount, isBookmarked, isTogglingBookmark, onComment, onBookmark, onShare }: ActionRowProps) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border/40">
      <div className="flex items-center gap-1">
        <button onClick={onComment} className="p-1.5 rounded-lg hover:bg-muted transition-colors flex items-center gap-1">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          {commentCount > 0 && <span className="text-xs text-muted-foreground">{commentCount}</span>}
        </button>
        <button onClick={onShare} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        {viewCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> {viewCount}
          </span>
        )}
        <button
          onClick={onBookmark}
          disabled={isTogglingBookmark}
          className={cn('p-1.5 rounded-lg hover:bg-muted transition-colors', isBookmarked && 'text-dna-gold')}
        >
          {isTogglingBookmark ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isBookmarked ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Shared Engagement Wrapper ───────────────────────────────────────

interface ConveyCardProps {
  story: UniversalFeedItem;
}

function useConveyCardEngagement(story: UniversalFeedItem) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const viewRef = useStoryViewTracker(story.post_id);

  const {
    reactions,
    currentReaction,
    commentCount,
    viewCount,
    isBookmarked,
    toggleReaction,
    toggleBookmark,
    isTogglingBookmark,
  } = useStoryEngagement(story.post_id, user?.id);

  const reactionCounts = useMemo(() => mapReactionsToCounts(reactions), [reactions]);
  const selectedReaction = useMemo(() => mapCurrentReaction(currentReaction), [currentReaction]);

  const timeAgo = story.created_at
    ? formatDistanceToNow(new Date(story.created_at), { addSuffix: true })
    : '';

  const handleClick = useCallback(() => {
    navigate(`/dna/story/${story.slug || story.post_id}`);
  }, [navigate, story.slug, story.post_id]);

  const handleReact = useCallback(
    (type: ConveyReactionType) => {
      toggleReaction(DNA_TYPE_TO_EMOJI[type]);
    },
    [toggleReaction]
  );

  const handleBookmark = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await toggleBookmark();
    },
    [toggleBookmark]
  );

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const shareUrl = `${window.location.origin}/dna/story/${story.slug || story.post_id}`;
      if (navigator.share) {
        await navigator.share({ title: story.title || 'DNA Story', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    },
    [story.slug, story.post_id, story.title]
  );

  return {
    viewRef,
    timeAgo,
    reactionCounts,
    selectedReaction,
    commentCount,
    viewCount,
    isBookmarked,
    isTogglingBookmark,
    handleClick,
    handleReact,
    handleBookmark,
    handleShare,
  };
}

// ═════════════════════════════════════════════════════════════════════
// CARD 1 — STORY
// ═════════════════════════════════════════════════════════════════════

export function ConveyStoryPostCard({ story }: ConveyCardProps) {
  const eng = useConveyCardEngagement(story);
  const readTime = estimateReadTime(story.content);

  return (
    <div
      ref={eng.viewRef}
      className="bg-card rounded-xl overflow-hidden border border-border/50 border-l-4 border-l-dna-copper hover:shadow-lg transition-all group"
    >
      {/* Cover Image */}
      {story.media_url && (
        <div onClick={eng.handleClick} className="relative aspect-[16/9] overflow-hidden cursor-pointer">
          <img src={story.media_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {/* Gradient overlay bottom 30% */}
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/60 to-transparent" />
          {/* Story badge */}
          <div className="absolute top-3 left-3 inline-flex items-center rounded-full bg-dna-copper/90 text-white text-xs font-semibold px-2.5 py-0.5 backdrop-blur-sm">
            Story
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3
          onClick={eng.handleClick}
          className="font-bold text-lg text-dna-forest line-clamp-2 cursor-pointer hover:underline leading-snug"
        >
          {story.title || story.content?.substring(0, 100)}
        </h3>

        {/* Read time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{readTime} min read</span>
        </div>

        {/* Author row */}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={story.author_avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs">{getInitials(story.author_display_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{story.author_display_name}</p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{eng.timeAgo}</span>
        </div>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-2">{getExcerpt(story.content)}</p>

        {/* Reactions */}
        <ConveyReactionsBar
          selectedReaction={eng.selectedReaction}
          reactionCounts={eng.reactionCounts}
          onReact={eng.handleReact}
        />

        {/* Actions */}
        <ActionRow
          commentCount={eng.commentCount}
          viewCount={eng.viewCount}
          isBookmarked={eng.isBookmarked}
          isTogglingBookmark={eng.isTogglingBookmark}
          onComment={eng.handleClick}
          onBookmark={() => eng.handleBookmark({ stopPropagation: () => {} } as React.MouseEvent)}
          onShare={() => eng.handleShare({ stopPropagation: () => {} } as React.MouseEvent)}
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// CARD 2 — UPDATE (Dispatch Style)
// ═════════════════════════════════════════════════════════════════════

export function ConveyUpdatePostCard({ story }: ConveyCardProps) {
  const eng = useConveyCardEngagement(story);

  return (
    <div
      ref={eng.viewRef}
      className="bg-card/80 rounded-xl border border-border/50 hover:shadow-md transition-all"
    >
      <div className="p-4 space-y-3">
        {/* Type label */}
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Update</span>

        {/* Content */}
        <p
          onClick={eng.handleClick}
          className="text-base leading-relaxed cursor-pointer hover:text-foreground/80 transition-colors"
        >
          {story.content?.substring(0, 300)}
          {(story.content?.length || 0) > 300 && '…'}
        </p>

        {/* Optional image */}
        {story.media_url && (
          <div onClick={eng.handleClick} className="rounded-lg overflow-hidden cursor-pointer">
            <img src={story.media_url} alt="" className="w-full h-auto max-h-64 object-cover" />
          </div>
        )}

        {/* Author dispatch row */}
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={story.author_avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs">{getInitials(story.author_display_name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{story.author_display_name}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{eng.timeAgo}</span>
        </div>

        {/* Reactions */}
        <ConveyReactionsBar
          selectedReaction={eng.selectedReaction}
          reactionCounts={eng.reactionCounts}
          onReact={eng.handleReact}
        />

        {/* Actions */}
        <ActionRow
          commentCount={eng.commentCount}
          viewCount={eng.viewCount}
          isBookmarked={eng.isBookmarked}
          isTogglingBookmark={eng.isTogglingBookmark}
          onComment={eng.handleClick}
          onBookmark={() => eng.handleBookmark({ stopPropagation: () => {} } as React.MouseEvent)}
          onShare={() => eng.handleShare({ stopPropagation: () => {} } as React.MouseEvent)}
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// CARD 3 — QUESTION (Discussion Card)
// ═════════════════════════════════════════════════════════════════════

export function ConveyQuestionPostCard({ story }: ConveyCardProps) {
  const eng = useConveyCardEngagement(story);

  return (
    <div
      ref={eng.viewRef}
      className="bg-card rounded-xl border border-border/50 border-l-4 border-l-dna-emerald hover:shadow-md transition-all"
    >
      <div className="p-4 space-y-3">
        {/* Question badge */}
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-dna-emerald" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Question</span>
        </div>

        {/* Question text */}
        <h3
          onClick={eng.handleClick}
          className="font-semibold text-base cursor-pointer hover:text-dna-emerald transition-colors leading-snug"
        >
          {story.title || story.content?.substring(0, 200)}
        </h3>

        {/* Response count */}
        {eng.commentCount > 0 && (
          <p className="text-sm text-dna-emerald">
            {eng.commentCount} {eng.commentCount === 1 ? 'response' : 'responses'}
          </p>
        )}

        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={story.author_avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs">{getInitials(story.author_display_name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{story.author_display_name}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{eng.timeAgo}</span>
        </div>

        {/* CTA */}
        <button
          onClick={eng.handleClick}
          className="text-sm text-dna-emerald font-medium hover:underline"
        >
          Share your perspective →
        </button>

        {/* Reactions */}
        <ConveyReactionsBar
          selectedReaction={eng.selectedReaction}
          reactionCounts={eng.reactionCounts}
          onReact={eng.handleReact}
        />

        {/* Actions */}
        <ActionRow
          commentCount={eng.commentCount}
          viewCount={eng.viewCount}
          isBookmarked={eng.isBookmarked}
          isTogglingBookmark={eng.isTogglingBookmark}
          onComment={eng.handleClick}
          onBookmark={() => eng.handleBookmark({ stopPropagation: () => {} } as React.MouseEvent)}
          onShare={() => eng.handleShare({ stopPropagation: () => {} } as React.MouseEvent)}
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// CARD 4 — OPPORTUNITY (Economic Signal)
// ═════════════════════════════════════════════════════════════════════

export function ConveyOpportunityPostCard({ story }: ConveyCardProps) {
  const eng = useConveyCardEngagement(story);

  return (
    <div
      ref={eng.viewRef}
      className="bg-card rounded-xl border border-border/50 border-l-4 border-l-amber-500 hover:shadow-md transition-all"
    >
      <div className="p-4 space-y-3">
        {/* Badge row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-semibold px-2.5 py-0.5">
            Opportunity
          </div>
          {story.story_type && (
            <Badge variant="outline" className="text-dna-forest border-dna-forest/30 text-xs">
              {story.story_type}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={eng.handleClick}
          className="font-semibold text-base cursor-pointer hover:underline leading-snug"
        >
          {story.title || story.content?.substring(0, 150)}
        </h3>

        {/* Description excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-2">{getExcerpt(story.content, 180)}</p>

        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={story.author_avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-xs">{getInitials(story.author_display_name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{story.author_display_name}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{eng.timeAgo}</span>
        </div>

        {/* CTA */}
        <Button
          onClick={eng.handleClick}
          size="sm"
          className="bg-dna-emerald hover:bg-dna-emerald/90 text-white rounded-full h-8 px-4 text-xs"
        >
          Express Interest
        </Button>

        {/* Reactions */}
        <ConveyReactionsBar
          selectedReaction={eng.selectedReaction}
          reactionCounts={eng.reactionCounts}
          onReact={eng.handleReact}
        />

        {/* Actions */}
        <ActionRow
          commentCount={eng.commentCount}
          viewCount={eng.viewCount}
          isBookmarked={eng.isBookmarked}
          isTogglingBookmark={eng.isTogglingBookmark}
          onComment={eng.handleClick}
          onBookmark={() => eng.handleBookmark({ stopPropagation: () => {} } as React.MouseEvent)}
          onShare={() => eng.handleShare({ stopPropagation: () => {} } as React.MouseEvent)}
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// Smart Card Router — picks the right card type based on post data
// ═════════════════════════════════════════════════════════════════════

export function ConveyEditorialCard({ story }: ConveyCardProps) {
  // Determine card type from post_type and story_type
  const postType = story.post_type;
  const storyType = story.story_type?.toLowerCase();

  // Questions
  if (storyType === 'question' || story.title?.endsWith('?')) {
    return <ConveyQuestionPostCard story={story} />;
  }

  // Opportunities
  if (storyType === 'opportunity' || postType === 'need') {
    return <ConveyOpportunityPostCard story={story} />;
  }

  // Updates (no title, or explicitly "update" type)
  if (storyType === 'update' || (!story.title && !story.media_url)) {
    return <ConveyUpdatePostCard story={story} />;
  }

  // Default: Story card (highest visual weight)
  return <ConveyStoryPostCard story={story} />;
}
