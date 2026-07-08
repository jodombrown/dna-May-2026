import { useState, useRef, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PROFILE_SELECT_COLUMNS } from '@/lib/profileColumns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Loader2, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MentionAutocomplete } from './MentionAutocomplete';
import { linkifyContent } from '@/utils/linkifyContent';
import type { MentionSuggestion } from '@/hooks/useMentionAutocomplete';
import { sendNotificationEmail, NOTIFICATION_TYPES } from '@/services/notificationService';
import { mentionService } from '@/services/mentionService';
import { getPostUrl } from '@/lib/config';

interface CommentSectionProps {
  postId: string;
  postAuthorId?: string;
}

export function CommentSection({ postId, postAuthorId }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest');
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Fetch comments - post_comments table doesn't have parent_comment_id column
  const { data: comments, isLoading } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Create comment with email notification
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user!.id,
          content,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Send email notification to post author (if not self-commenting)
      if (postAuthorId && postAuthorId !== user!.id) {
        sendNotificationEmail({
          user_id: postAuthorId,
          notification_type: NOTIFICATION_TYPES.COMMENT,
          title: 'New comment on your post',
          message: `${profile?.full_name || 'Someone'} commented: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"`,
          action_url: getPostUrl(postId),
          actor_name: profile?.full_name,
          actor_avatar_url: profile?.avatar_url,
        }).catch(() => {
          // Failed to send notification email
        });
      }

      return data;
    },
    onSuccess: (data, content) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-comments-count', postId] });

      // Process mentions and send notifications (async, don't block UI)
      if (data && content) {
        mentionService.processMentionsForComment(
          content,
          data.id,
          postId,
          user!.id,
          profile?.full_name || profile?.username || 'Someone'
        ).catch(() => {
          // Failed to process mentions
        });
      }

      setCommentText('');
      toast.success('Comment added');
    },
  });

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleCommentClick = () => {
    if (commentTextareaRef.current) {
      setCursorPosition(commentTextareaRef.current.selectionStart);
    }
  };

  const handleMentionSelect = (mention: MentionSuggestion, startPos: number, endPos: number) => {
    const beforeMention = commentText.substring(0, startPos);
    const afterMention = commentText.substring(endPos);
    const newContent = `${beforeMention}@${mention.username} ${afterMention}`;

    setCommentText(newContent);

    const newCursorPos = startPos + mention.username.length + 2;
    setCursorPosition(newCursorPos);

    setTimeout(() => {
      if (commentTextareaRef.current) {
        commentTextareaRef.current.focus();
        commentTextareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }
    createCommentMutation.mutate(commentText);
  };

  // Sort comments client-side
  const sortedComments = useMemo(() => {
    if (!comments) return [];

    const commentsWithLikes = comments.map(comment => ({
      ...comment,
      // Like count will be fetched in CommentItem, but for sorting we need it here
      // For now, sort by created_at for newest, will enhance with like count later
    }));

    if (sortBy === 'newest') {
      return [...commentsWithLikes].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      // For 'top', we'll need to fetch like counts
      // For now, sort by created_at as fallback
      return [...commentsWithLikes].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  }, [comments, sortBy]);

  return (
    <div className="space-y-4 border-t pt-4">
      {/* Create Comment */}
      {user && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {profile?.full_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 relative">
            <Textarea
              ref={commentTextareaRef}
              placeholder="Write a comment..."
              value={commentText}
              onChange={handleCommentChange}
              onClick={handleCommentClick}
              onKeyUp={handleCommentClick}
              className="min-h-[60px] resize-none text-base md:text-sm"
            />
            <MentionAutocomplete
              text={commentText}
              cursorPosition={cursorPosition}
              onSelectMention={handleMentionSelect}
              textareaRef={commentTextareaRef}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || createCommentMutation.isPending}
              >
                {createCommentMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Comment'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Sorting */}
      {comments && comments.length > 0 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-muted-foreground">
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </p>
          <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'top')} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="newest" className="text-xs px-3">
                <Clock className="h-3 w-3 mr-1.5" />
                Newest
              </TabsTrigger>
              <TabsTrigger value="top" className="text-xs px-3">
                <TrendingUp className="h-3 w-3 mr-1.5" />
                Top
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : sortedComments && sortedComments.length > 0 ? (
          sortedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: any }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch author profile - post_comments uses user_id, not author_id
  const { data: author } = useQuery({
    queryKey: ['user-profile', comment.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT_COLUMNS)
        .eq('id', comment.user_id)
        .maybeSingle();
      return data;
    },
  });

  // Fetch like count
  const { data: likeCount } = useQuery({
    queryKey: ['comment-likes-count', comment.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('comment_likes' as any)
        .select('id', { count: 'exact' })
        .eq('comment_id', comment.id);
      return count || 0;
    },
  });

  // Fetch user liked status
  const { data: hasLiked } = useQuery({
    queryKey: ['comment-user-liked', comment.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('comment_likes' as any)
        .select('id')
        .eq('comment_id', comment.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Toggle like
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      if (hasLiked) {
        await supabase
          .from('comment_likes' as any)
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('comment_likes' as any)
          .insert({ comment_id: comment.id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-likes-count', comment.id] });
      queryClient.invalidateQueries({ queryKey: ['comment-user-liked', comment.id] });
    },
  });

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={author?.avatar_url || ''} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {author?.full_name?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="bg-accent rounded-lg p-3">
          <p className="font-semibold text-sm text-foreground">{author?.full_name || 'User'}</p>
          <div className="text-sm text-foreground mt-1">{linkifyContent(comment.content)}</div>
        </div>
        <div className="flex items-center gap-4 px-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => user && toggleLikeMutation.mutate()}
          >
            <Heart
              className={`h-3 w-3 mr-1 ${hasLiked ? 'fill-current text-red-500' : ''}`}
            />
            {likeCount || 0}
          </Button>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
