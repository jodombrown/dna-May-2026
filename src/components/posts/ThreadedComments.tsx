import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Send, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { cn } from '@/lib/utils';

interface ThreadedComment {
  comment_id: string;
  parent_comment_id: string | null;
  author_id: string;
  author_username: string;
  author_full_name: string;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  reaction_counts: Record<string, number>;
  user_reaction: string | null;
  reply_count: number;
}

interface ThreadedCommentsProps {
  postId: string;
  currentUserId: string;
  commentsDisabled?: boolean;
}

export function ThreadedComments({ postId, currentUserId, commentsDisabled = false }: ThreadedCommentsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const { data: comments, isLoading } = useQuery({
    queryKey: ['threaded-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_threaded_comments', {
        p_post_id: postId,
        p_user_id: currentUserId,
      });

      if (error) throw error;
      return (data || []) as ThreadedComment[];
    },
  });

  const handleSubmit = async (parentId?: string | null) => {
    const content = newComment.trim();
    if (!content || content.length > 500) {
      if (content.length > 500) {
        toast.error('Comment must be 500 characters or less');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: currentUserId,
        content,
        parent_comment_id: parentId || null,
      });

      if (error) throw error;

      setNewComment('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['threaded-comments', postId] });
      
      // Auto-expand replies for the parent comment
      if (parentId) {
        setExpandedReplies((prev) => new Set([...prev, parentId]));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      const friendly = /comments are turned off/i.test(message)
        ? 'The author turned off comments for this post.'
        : `Couldn't post your comment. ${message}`;
      toast.error(friendly, {
        action: {
          label: 'Retry',
          onClick: () => handleSubmit(parentId),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Organize comments into tree structure
  const rootComments = comments?.filter((c) => !c.parent_comment_id) || [];
  const repliesByParent = new Map<string, ThreadedComment[]>();
  
  comments?.forEach((comment) => {
    if (comment.parent_comment_id) {
      const existing = repliesByParent.get(comment.parent_comment_id) || [];
      repliesByParent.set(comment.parent_comment_id, [...existing, comment]);
    }
  });

  const renderComment = (comment: ThreadedComment, depth: number = 0) => {
    const replies = repliesByParent.get(comment.comment_id) || [];
    const hasReplies = replies.length > 0;
    const isExpanded = expandedReplies.has(comment.comment_id);
    const isReplying = replyingTo === comment.comment_id;

    return (
      <div key={comment.comment_id} className={cn(depth > 0 && 'ml-8 mt-3')}>
        <CommentItem
          comment={comment}
          postId={postId}
          currentUserId={currentUserId}
          onReply={() => setReplyingTo(isReplying ? null : comment.comment_id)}
          isReplying={isReplying}
        />

        {/* Reply count toggle */}
        {hasReplies && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleReplies(comment.comment_id)}
            className="ml-11 mt-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </>
            )}
          </Button>
        )}

        {/* Reply input */}
        {isReplying && !commentsDisabled && (
          <div className="ml-11 mt-2 flex gap-2">
            <Textarea
              placeholder={`Reply to ${comment.author_full_name}...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(comment.comment_id);
                }
              }}
              rows={2}
              className="resize-none flex-1 text-sm"
            />
            <Button
              onClick={() => handleSubmit(comment.comment_id)}
              disabled={isSubmitting || !newComment.trim()}
              size="icon"
              className="bg-dna-forest hover:bg-dna-forest/90 h-10 w-10 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Nested replies */}
        {isExpanded && replies.map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-dna-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4 pt-4 border-t">
      {/* New comment input */}
      {!commentsDisabled ? (
        <div className="flex gap-3">
          <div className="flex-1">
            <Textarea
              placeholder="Write a comment..."
              value={replyingTo ? '' : newComment}
              onChange={(e) => !replyingTo && setNewComment(e.target.value.slice(0, 500))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !replyingTo) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={2}
              className="resize-none"
              disabled={!!replyingTo}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">
                Press Enter to post, Shift+Enter for new line
              </span>
              <span className="text-xs text-muted-foreground">
                {newComment.length}/500
              </span>
            </div>
          </div>
          <Button
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !newComment.trim() || !!replyingTo}
            size="icon"
            className="bg-dna-forest hover:bg-dna-forest/90 h-10 w-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-sm py-4">
          Comments are turned off for this post.
        </p>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {rootComments.map((comment) => renderComment(comment))}

        {rootComments.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
