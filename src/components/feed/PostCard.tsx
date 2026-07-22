import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PROFILE_SELECT_COLUMNS } from '@/lib/profileColumns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Flag, Edit3, SmilePlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommentSection } from './CommentSection';
import { ReshareDialog } from './ReshareDialog';
import { createResharePost } from '@/lib/feedWriter';
import { linkifyContent } from '@/utils/linkifyContent';
import { usePostReactions } from '@/hooks/usePostReactions';
import { usePostActions } from '@/hooks/usePostActions';
import { logHighError } from '@/lib/errorLogger';
import { usePostBookmark } from '@/hooks/usePostBookmark';
import { ReactionPicker } from '@/components/posts/ReactionPicker';
import { ReactionSummary } from '@/components/posts/ReactionSummary';
import { ReportDialog } from '@/components/posts/ReportDialog';

interface Post {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  post_type: string;
  visibility?: string;
  is_pinned?: boolean;
  is_flagged?: boolean;
  media_urls?: string[] | null;
  flagged_at?: string | null;
  flagged_by?: string | null;
  [key: string]: any; // Allow additional properties
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [showReshareDialog, setShowReshareDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Report action reuses the existing working report path (see PostMenuOthers).
  const { reportPost } = usePostActions(post.id, post.author_id, user?.id);

  // Fetch author profile
  const { data: author } = useQuery({
    queryKey: ['user-profile', post.author_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT_COLUMNS)
        .eq('id', post.author_id)
        .maybeSingle();
      return data;
    },
  });

  // Use reactions hook with notification context
  const {
    reactions,
    totalReactions,
    currentReaction,
    addReaction,
    removeReaction,
  } = usePostReactions(post.id, user?.id, {
    postAuthorId: post.author_id,
    actorName: author?.full_name,
    actorAvatarUrl: author?.avatar_url,
  });

  // Fetch like count and status
  const { data: likeCount } = useQuery({
    queryKey: ['post-likes-count', post.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('post_likes')
        .select('id', { count: 'exact' })
        .eq('post_id', post.id);
      return count || 0;
    },
  });

  const { data: hasLiked } = useQuery({
    queryKey: ['post-user-liked', post.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch comment count
  const { data: commentCount } = useQuery({
    queryKey: ['post-comments-count', post.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('post_comments')
        .select('id', { count: 'exact' })
        .eq('post_id', post.id);
      return count || 0;
    },
  });

  // Fetch share count
  const { data: shareCount } = useQuery({
    queryKey: ['post-shares-count', post.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('post_shares')
        .select('id', { count: 'exact' })
        .eq('post_id', post.id);
      return count || 0;
    },
  });

  // Saved status + toggle via the canonical post_bookmarks store, matching
  // posts/PostCard and the SavedPostsPage. (Previously used the retired
  // bookmark table, so posts saved from search never showed up on Saved.)
  const {
    isBookmarked: isSaved,
    toggleBookmark: toggleSave,
    isLoading: isSaving,
  } = usePostBookmark(post.id, user?.id);

  // Toggle like
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      if (hasLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id });
        
        if (error) {
          const code = (error as any).code || (error as any).details;
          const message = (error as any).message || '';

          if (code === '23505' || message.includes('duplicate key value')) {
            // Like already exists, treating as success
          } else {
            throw error;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-likes-count', post.id] });
      queryClient.invalidateQueries({ queryKey: ['post-user-liked', post.id] });
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
    },
    onError: (error) => {
      toast('Could not update like. Please try again.');
    },
  });

  // Delete post (soft delete via SECURITY DEFINER RPC; previously a hard
  // row delete, which RLS could not scope to a single column).
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('rpc_soft_delete_post' as any, {
        p_post_id: post.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      toast.success('Post deleted');
    },
    onError: (error) => {
      logHighError(error, 'database', 'rpc_soft_delete_post failed', { postId: post.id });
      toast.error('Failed to delete post. Please try again.');
    },
  });

  // Reshare post
  const reshareMutation = useMutation({
    mutationFn: async (commentary: string) => {
      if (!user) throw new Error('Not authenticated');

      await createResharePost({
        originalPostId: post.id,
        authorId: user.id,
        commentary: commentary || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-shares-count', post.id] });
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast.success('Post reshared successfully!');
    },
    onError: (error) => {
      toast.error('Failed to reshare post. Please try again.');
    },
  });

  const handleReshare = async (commentary: string) => {
    await reshareMutation.mutateAsync(commentary);
  };

  // Edit post via the column-allowlisted SECURITY DEFINER RPC. updated_at is
  // owned by a database trigger, so we never write it; we pass the post's
  // current updated_at for optimistic concurrency (40001 on mismatch).
  const editPostMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('rpc_update_post' as any, {
        p_post_id: post.id,
        p_expected_updated_at: post.updated_at,
        p_patch: { content },
      });

      if (error) {
        if ((error as any).code === '40001') throw new Error('POST_STALE');
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      toast.success('Post updated successfully!');
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'POST_STALE') {
        toast.error('This post changed since you opened it. Reload before saving.');
      } else {
        logHighError(error, 'database', 'rpc_update_post failed', { postId: post.id });
        toast.error('Failed to update post. Please try again.');
      }
    },
  });

  const handleEdit = async (content: string) => {
    await editPostMutation.mutateAsync(content);
  };

  const isOwnPost = user?.id === post.author_id;
  const isEdited = post.updated_at && post.updated_at !== post.created_at;

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      {/* Post Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author?.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {author?.full_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{author?.full_name || 'User'}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
              {isEdited && (
                <Badge variant="secondary" className="text-xs">
                  Edited
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwnPost && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    // Event posts route to the canonical event editor so
                    // organizers edit the underlying event, not just the
                    // auto-generated feed announcement text.
                    if (post.post_type === 'event' && post.event_id) {
                      navigate(`/dna/convene/events/${post.event_id}/edit`);
                      return;
                    }
                    // TODO: wire to the unified post edit surface. The inline
                    // EditPostDialog was retired in the rpc_update_post
                    // migration; editPostMutation above is the RPC-backed save
                    // path that surface will call.
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => deletePostMutation.mutate()}>
                  Delete
                </DropdownMenuItem>
              </>
            )}
            {!isOwnPost && (
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Content */}
      <div className="text-foreground whitespace-pre-wrap">{linkifyContent(post.content)}</div>

      {/* Reaction Summary (above action bar) */}
      {totalReactions > 0 && (
        <div className="flex items-center justify-between border-t pt-2">
          <ReactionSummary reactions={reactions} totalCount={totalReactions} />
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex gap-3 sm:gap-6">
          {/* Reaction Picker */}
          <ReactionPicker onReactionSelect={(emoji) => {
            if (!user) {
              toast.error('Please sign in to react');
              return;
            }
            if (currentReaction === emoji) {
              removeReaction(emoji);
            } else {
              addReaction(emoji);
            }
          }}>
            <Button
              variant="ghost"
              size="sm"
              className={currentReaction ? 'text-primary' : ''}
            >
              {currentReaction ? (
                <span className="text-lg mr-1">{currentReaction}</span>
              ) : (
                <SmilePlus className="h-4 w-4 mr-2" />
              )}
              {totalReactions > 0 ? totalReactions : 'React'}
            </Button>
          </ReactionPicker>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {commentCount || 0}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => user && setShowReshareDialog(true)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {shareCount || 0}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => user && toggleSave()}
          disabled={isSaving}
          className={isSaved ? 'text-primary' : ''}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && <CommentSection postId={post.id} postAuthorId={post.author_id} />}

      {/* Reshare Dialog */}
      <ReshareDialog
        isOpen={showReshareDialog}
        onClose={() => setShowReshareDialog(false)}
        onReshare={handleReshare}
        originalPost={{
          id: post.id,
          author_name: author?.full_name || 'User',
          author_avatar: author?.avatar_url || null,
          content: post.content,
          media_url: post.media_urls?.[0] || null,
        }}
      />

      {/* Report Dialog */}
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        onSubmit={(reason, description) => {
          reportPost.mutate({ reason, description });
        }}
        type="post"
      />
    </Card>
  );
}
