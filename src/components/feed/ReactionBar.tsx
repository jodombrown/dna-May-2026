/**
 * DNA | Sprint 11 - Feed Reaction Bar
 *
 * Five DNA-specific reaction types with tap/long-press behavior.
 * Default tap: apply "asante" reaction
 * Long-press/hover: show reaction picker with all 5 types
 *
 * Reactions: asante, inspired, lets_build, powerful, insightful
 * Optimistic updates with Supabase sync in background.
 */

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

export type FeedReactionType = 'asante' | 'inspired' | 'lets_build' | 'powerful' | 'insightful';

interface ReactionConfig {
  type: FeedReactionType;
  emoji: string;
  label: string;
  color: string;
}

interface ReactionBarProps {
  contentType: string;
  contentId: string;
  currentUserId: string;
  reactionCount: number;
  commentCount: number;
  bookmarkCount: number;
  shareCount: number;
  onCommentClick: () => void;
  onBookmarkClick: () => void;
  onShareClick: () => void;
  isBookmarked?: boolean;
  className?: string;
}

// ============================================================
// REACTION CONFIGURATIONS
// ============================================================

const REACTIONS: ReactionConfig[] = [
  { type: 'asante', emoji: '\uD83D\uDE4F', label: 'Asante', color: 'text-amber-500' },
  { type: 'inspired', emoji: '\u2728', label: 'Inspired', color: 'text-copper-500' },
  { type: 'lets_build', emoji: '\uD83D\uDD28', label: "Let's Build", color: 'text-blue-500' },
  { type: 'powerful', emoji: '\u270A', label: 'Powerful', color: 'text-red-500' },
  { type: 'insightful', emoji: '\uD83E\uDDE0', label: 'Insightful', color: 'text-emerald-500' },
];

const DEFAULT_REACTION: FeedReactionType = 'asante';

// ============================================================
// COMPONENT
// ============================================================

export const ReactionBar: React.FC<ReactionBarProps> = ({
  contentType,
  contentId,
  currentUserId,
  reactionCount,
  commentCount,
  bookmarkCount,
  shareCount,
  onCommentClick,
  onBookmarkClick,
  onShareClick,
  isBookmarked = false,
  className,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  // Fetch current user's reaction
  const { data: currentReaction } = useQuery({
    queryKey: ['feed-reaction', contentType, contentId, currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data } = await supabase
        .from('feed_reactions')
        .select('reaction_type')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('user_id', currentUserId)
        .maybeSingle();
      return (data as Record<string, string> | null)?.reaction_type as FeedReactionType | null;
    },
    enabled: !!currentUserId,
  });

  // Fetch reaction aggregate
  const { data: reactionAgg } = useQuery({
    queryKey: ['feed-reaction-agg', contentType, contentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('feed_reactions')
        .select('reaction_type')
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      const counts: Record<string, number> = {};
      for (const row of (data || []) as Array<Record<string, string>>) {
        counts[row.reaction_type] = (counts[row.reaction_type] || 0) + 1;
      }
      return {
        total: (data || []).length,
        breakdown: counts,
      };
    },
  });

  // Toggle reaction mutation
  const reactionMutation = useMutation({
    mutationFn: async (reactionType: FeedReactionType | null) => {
      if (!currentUserId) throw new Error('Not authenticated');

      if (reactionType === null) {
        // Remove reaction
        await supabase
          .from('feed_reactions')
          .delete()
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .eq('user_id', currentUserId);
      } else if (currentReaction) {
        // Update reaction
        await supabase
          .from('feed_reactions')
          .update({ reaction_type: reactionType })
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .eq('user_id', currentUserId);
      } else {
        // Insert reaction
        const { error } = await supabase.from('feed_reactions').insert({
          user_id: currentUserId,
          content_type: contentType,
          content_id: contentId,
          reaction_type: reactionType,
        });
        if (error) {
          const errMsg = (error as unknown as Record<string, string>).message || '';
          if (errMsg.includes('duplicate key')) {
            // Already exists, update instead
            await supabase
              .from('feed_reactions')
              .update({ reaction_type: reactionType })
              .eq('content_type', contentType)
              .eq('content_id', contentId)
              .eq('user_id', currentUserId);
          } else {
            throw error;
          }
        }
      }
    },
    onMutate: async (reactionType) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ['feed-reaction', contentType, contentId, currentUserId],
      });
      queryClient.setQueryData(
        ['feed-reaction', contentType, contentId, currentUserId],
        reactionType
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['feed-reaction', contentType, contentId, currentUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ['feed-reaction-agg', contentType, contentId],
      });
    },
    onError: () => {
      toast.error('Could not save reaction');
    },
  });

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleTap = useCallback(() => {
    if (currentReaction) {
      // Toggle off
      reactionMutation.mutate(null);
    } else {
      // Apply default reaction
      reactionMutation.mutate(DEFAULT_REACTION);
    }
    setShowPicker(false);
  }, [currentReaction, reactionMutation]);

  const handleReactionSelect = useCallback(
    (type: FeedReactionType) => {
      if (currentReaction === type) {
        reactionMutation.mutate(null);
      } else {
        reactionMutation.mutate(type);
      }
      setShowPicker(false);
    },
    [currentReaction, reactionMutation]
  );

  const handlePointerDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const totalReactions = reactionAgg?.total ?? reactionCount;
  const activeReactionConfig = currentReaction
    ? REACTIONS.find((r) => r.type === currentReaction)
    : null;

  return (
    <div className={cn('relative', className)}>
      {/* Reaction Picker Popover */}
      {showPicker && (
        <div
          className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-card border border-border rounded-full px-2 py-1.5 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
          onMouseLeave={() => setShowPicker(false)}
        >
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.type}
              onClick={() => handleReactionSelect(reaction.type)}
              className={cn(
                'flex flex-col items-center px-2 py-1 rounded-full transition-all',
                'hover:bg-accent hover:scale-110',
                currentReaction === reaction.type && 'bg-accent scale-110'
              )}
              title={reaction.label}
            >
              <span className="text-xl">{reaction.emoji}</span>
              <span className="text-[9px] font-medium text-muted-foreground mt-0.5">
                {reaction.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-1">
          {/* Reaction Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex items-center gap-1.5 h-9 px-3 text-xs',
              currentReaction && activeReactionConfig?.color
            )}
            onClick={handleTap}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onMouseEnter={() => setShowPicker(true)}
          >
            {activeReactionConfig ? (
              <span className="text-base">{activeReactionConfig.emoji}</span>
            ) : (
              <Heart className="h-[18px] w-[18px]" />
            )}
            {totalReactions > 0 && <span>{totalReactions}</span>}
          </Button>

          {/* Comment Button */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 h-9 px-3 text-xs"
            onClick={onCommentClick}
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            {commentCount > 0 && <span>{commentCount}</span>}
          </Button>

          {/* Share Button */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 h-9 px-3 text-xs"
            onClick={onShareClick}
          >
            <Share2 className="h-[18px] w-[18px]" />
            {shareCount > 0 && <span>{shareCount}</span>}
          </Button>
        </div>

        {/* Bookmark Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-9 px-3',
            isBookmarked && 'text-amber-500'
          )}
          onClick={onBookmarkClick}
        >
          <Bookmark
            className={cn(
              'h-[18px] w-[18px]',
              isBookmarked && 'fill-current'
            )}
          />
        </Button>
      </div>
    </div>
  );
};
