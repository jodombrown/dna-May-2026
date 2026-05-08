import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GroupDetails, GroupMember, GroupPost } from '@/types/groups';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Lock,
  Eye,
  Settings,
  UserPlus,
  Send,
  Heart,
  MessageCircle,
  Pin,
  ArrowLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { GroupPostComments } from '@/components/groups/GroupPostComments';
import { GroupJoinRequests } from '@/components/groups/GroupJoinRequests';
// STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
// import { GroupSpacesSection } from '@/components/collaboration/GroupSpacesSection';
import { cn } from '@/lib/utils';

interface CommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postAuthor: string;
}

function CommentDialog({ isOpen, onClose, postId, postAuthor }: CommentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: comments, refetch } = useQuery({
    queryKey: ['group-post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_post_comments')
        .select(`
          id,
          content,
          created_at,
          author:profiles!author_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const handleSubmit = async () => {
    if (!commentContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('group_post_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: commentContent.trim(),
        });

      if (error) throw error;

      setCommentContent('');
      refetch();
      toast({
        title: 'Comment posted!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Comments on {postAuthor}'s post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comments List */}
          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {comments && comments.length > 0 ? (
              comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.author.avatar_url} alt={comment.author.full_name} />
                    <AvatarFallback className="bg-[hsl(151,75%,50%)] text-white text-xs">
                      {getInitials(comment.author.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="font-semibold text-sm">{comment.author.full_name}</p>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-3">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>

          {/* Comment Input */}
          <div className="flex gap-3 pt-4 border-t">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-[hsl(151,75%,50%)] text-white text-xs">
                {user?.user_metadata?.full_name
                  ? getInitials(user.user_metadata.full_name)
                  : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Write a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={2}
                maxLength={1000}
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !commentContent.trim()}
                  className="bg-[hsl(151,75%,50%)] hover:bg-[hsl(151,75%,40%)] text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GroupDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState('');
  const [isPostSubmitting, setIsPostSubmitting] = useState(false);
  const [activeCommentDialog, setActiveCommentDialog] = useState<{
    postId: string;
    postAuthor: string;
  } | null>(null);
  const [openComments, setOpenComments] = useState<{ [key: string]: boolean }>({});

  // Fetch group details
  const { data: group, isLoading } = useQuery({
    queryKey: ['group-details', slug, user?.id],
    queryFn: async () => {
      if (!slug || !user) return null;

      // First get group by slug
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('slug', slug)
        .single();

      if (groupError || !groupData) return null;

      const { data, error } = await supabase.rpc('get_group_details', {
        p_group_id: groupData.id,
        p_user_id: user.id,
      });

      if (error) throw error;
      return data?.[0] as GroupDetails | undefined;
    },
    enabled: !!slug && !!user,
  });

  // Fetch members
  const { data: members } = useQuery({
    queryKey: ['group-members', group?.group_id],
    queryFn: async () => {
      if (!group) return [];

      const { data, error } = await supabase.rpc('get_group_members', {
        p_group_id: group.group_id,
        p_role: null,
      });

      if (error) throw error;
      return (data || []) as GroupMember[];
    },
    enabled: !!group,
  });

  // Fetch posts
  const { data: posts, refetch: refetchPosts } = useQuery({
    queryKey: ['group-posts', group?.group_id, user?.id],
    queryFn: async () => {
      if (!group || !user) return [];

      const { data, error } = await supabase.rpc('get_group_posts', {
        p_group_id: group.group_id,
        p_user_id: user.id,
        p_limit: 50,
        p_offset: 0,
      });

      if (error) throw error;
      return (data || []) as GroupPost[];
    },
    enabled: !!group && !!user,
  });

  // group_post_likes and group_post_comments do not carry a denormalized
  // group_id column, so the only available scope is post_id. We derive the
  // current page's post IDs from the loaded posts query.
  const postIdsKey = useMemo(() => {
    if (!posts || posts.length === 0) return '';
    return posts.map((p) => p.post_id).sort().join(',');
  }, [posts]);

  // Real-time updates — group_posts and group_members are filtered by
  // group_id; group_post_likes and group_post_comments are filtered by the
  // post_id set of currently-loaded group posts.
  useEffect(() => {
    if (!group) return;

    const groupId = group.group_id;

    const channel = supabase
      .channel(`group_${groupId}_updates`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_posts',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          refetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['group-details'] });
          queryClient.invalidateQueries({ queryKey: ['group-members'] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [group?.group_id, refetchPosts, queryClient]);

  // Scope likes/comments realtime to the loaded post set. Rebuilds when the
  // post set changes (new post, navigation between groups, etc.).
  useEffect(() => {
    if (!group || !postIdsKey) return;

    const groupId = group.group_id;
    const filter = `post_id=in.(${postIdsKey})`;

    const channel = supabase
      .channel(`group_${groupId}_engagement_${postIdsKey.length}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_post_likes',
          filter,
        },
        () => {
          refetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_post_comments',
          filter,
        },
        () => {
          refetchPosts();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [group?.group_id, postIdsKey, refetchPosts]);

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async () => {
      if (!group || !user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: group.group_id,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-details', slug] });
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: 'Joined group!',
        description: 'Welcome to the community',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to join group',
        variant: 'destructive',
      });
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      if (!group || !user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.group_id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-details', slug] });
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: 'Left group',
        description: 'You are no longer a member',
      });
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!group || !user || !postContent.trim()) throw new Error('Invalid input');

      const { error } = await supabase
        .from('group_posts')
        .insert({
          group_id: group.group_id,
          author_id: user.id,
          content: postContent.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setPostContent('');
      refetchPosts();
      toast({
        title: 'Posted!',
        description: 'Your post is now visible to group members',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive',
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      refetchPosts();
    },
  });

  // Unlike post mutation
  const unlikePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      refetchPosts();
    },
  });

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      toast({
        title: 'Empty post',
        description: 'Please write something',
        variant: 'destructive',
      });
      return;
    }

    setIsPostSubmitting(true);
    try {
      await createPostMutation.mutateAsync();
    } finally {
      setIsPostSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPrivacyIcon = () => {
    if (!group) return null;
    switch (group.privacy) {
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'secret':
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 text-muted-foreground">
            Loading group...
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Group not found</h2>
            <p className="text-muted-foreground mb-6">
              This group doesn't exist or you don't have permission to view it
            </p>
            <Button onClick={() => navigate('/dna/convene/groups')}>
              Back to Groups
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dna/convene/groups')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </Button>

        {/* Cover Image */}
        {group.cover_image_url ? (
          <div className="h-64 rounded-xl overflow-hidden mb-8">
            <img
              src={group.cover_image_url}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-64 bg-gradient-to-br from-[hsl(151,75%,50%)] to-[hsl(151,75%,35%)] rounded-xl mb-8" />
        )}

        {/* Group Header */}
        <div className="flex items-start gap-6 mb-8">
          <Avatar className="h-24 w-24 border-4 border-background -mt-16">
            <AvatarImage src={group.avatar_url} alt={group.name} />
            <AvatarFallback className="bg-[hsl(151,75%,50%)] text-white text-2xl">
              {getInitials(group.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              {getPrivacyIcon() && (
                <Badge variant="outline">
                  {getPrivacyIcon()}
                  <span className="ml-1 capitalize">{group.privacy}</span>
                </Badge>
              )}
              {group.category && (
                <Badge variant="secondary">{group.category}</Badge>
              )}
            </div>

            {group.description && (
              <p className="text-muted-foreground mb-4">{group.description}</p>
            )}

            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{group.member_count} members</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{group.post_count} posts</span>
              </div>
              {group.location && (
                <div className="flex items-center gap-1">
                  <span>{group.location}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {group.is_member ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => leaveGroupMutation.mutate()}
                    disabled={leaveGroupMutation.isPending || group.user_role === 'owner'}
                  >
                    {group.user_role === 'owner' ? 'Owner' : 'Leave Group'}
                  </Button>
                  {['owner', 'admin'].includes(group.user_role || '') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dna/convene/groups/${slug}/settings`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => joinGroupMutation.mutate()}
                  disabled={joinGroupMutation.isPending || group.join_policy === 'invite_only'}
                  className="bg-[hsl(151,75%,50%)] hover:bg-[hsl(151,75%,40%)] text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {group.join_policy === 'invite_only' ? 'Invite Only' : 'Join Group'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {group.is_member ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              {group.can_post && (
                <Card className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-[hsl(151,75%,50%)] text-white">
                        {user?.user_metadata?.full_name
                          ? getInitials(user.user_metadata.full_name)
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Share something with the group..."
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        rows={3}
                        maxLength={5000}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          onClick={handleCreatePost}
                          disabled={isPostSubmitting || !postContent.trim()}
                          className="bg-[hsl(151,75%,50%)] hover:bg-[hsl(151,75%,40%)] text-white"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Posts */}
              <Tabs defaultValue="posts">
                <TabsList>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="about">About</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-4 mt-4">
                  {posts && posts.length > 0 ? (
                    posts.map((post) => (
                      <Card key={post.post_id} className="p-6">
                        {/* Post Header */}
                        <div className="flex items-start gap-3 mb-4">
                          <Avatar
                            className="h-10 w-10 cursor-pointer"
                            onClick={() => navigate(`/dna/${post.author_username}`)}
                          >
                            <AvatarImage src={post.author_avatar_url} alt={post.author_full_name} />
                            <AvatarFallback className="bg-[hsl(151,75%,50%)] text-white text-sm">
                              {getInitials(post.author_full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p
                              className="font-semibold hover:text-[hsl(151,75%,50%)] cursor-pointer"
                              onClick={() => navigate(`/dna/${post.author_username}`)}
                            >
                              {post.author_full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {post.is_pinned && (
                            <Badge variant="secondary" className="text-xs">
                              <Pin className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                        </div>

                        {/* Post Content */}
                        <p className="whitespace-pre-wrap mb-4">{post.content}</p>

                        {/* Post Actions */}
                        <div className="flex items-center gap-4 pt-4 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'gap-2',
                              post.user_has_liked && 'text-red-500'
                            )}
                            onClick={() => {
                              if (post.user_has_liked) {
                                unlikePostMutation.mutate(post.post_id);
                              } else {
                                likePostMutation.mutate(post.post_id);
                              }
                            }}
                          >
                            <Heart
                              className={cn(
                                'h-4 w-4',
                                post.user_has_liked && 'fill-current'
                              )}
                            />
                            {post.like_count}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => setOpenComments(prev => ({
                              ...prev,
                              [post.post_id]: !prev[post.post_id]
                            }))}
                          >
                            <MessageCircle className="h-4 w-4" />
                            {post.comment_count}
                          </Button>
                        </div>

                        {/* Comments Section */}
                        <GroupPostComments
                          postId={post.post_id}
                          isOpen={openComments[post.post_id] || false}
                          onClose={() => setOpenComments(prev => ({ ...prev, [post.post_id]: false }))}
                        />
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No posts yet. Be the first to share something!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="about" className="mt-4">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">About this group</h3>
                    {group.description ? (
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {group.description}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">No description available</p>
                    )}
                  </Card>

                  {/* STUBBED: Phase 2 teardown. GroupSpacesSection removed
                      while COLLABORATE is being rebuilt. Restore in Phase 3. */}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Join Requests (for admins) */}
              {group.user_role && ['owner', 'admin', 'moderator'].includes(group.user_role) && (
                <GroupJoinRequests groupId={group.group_id} />
              )}

              {/* Members */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">
                  Members ({members?.length || 0})
                </h3>
                <div className="space-y-3">
                  {members && members.length > 0 ? (
                    members.slice(0, 5).map((member) => (
                      <div
                        key={member.member_id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-accent p-2 rounded-lg transition-colors"
                        onClick={() => navigate(`/dna/${member.username}`)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar_url} alt={member.full_name} />
                          <AvatarFallback className="bg-[hsl(151,75%,50%)] text-white text-sm">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{member.full_name}</p>
                          <div className="flex items-center gap-2">
                            {member.role !== 'member' && (
                              <Badge variant="secondary" className="text-xs">
                                {member.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No members yet</p>
                  )}
                  {members && members.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full">
                      View All Members
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Private Group</h3>
            <p className="text-muted-foreground mb-6">
              You need to join this group to see its content
            </p>
            <Button
              onClick={() => joinGroupMutation.mutate()}
              disabled={joinGroupMutation.isPending || group.join_policy === 'invite_only'}
              className="bg-[hsl(151,75%,50%)] hover:bg-[hsl(151,75%,40%)] text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {group.join_policy === 'invite_only' ? 'Invite Only' : 'Request to Join'}
            </Button>
          </Card>
        )}
      </div>

      {/* Comment Dialog */}
      {activeCommentDialog && (
        <CommentDialog
          isOpen={!!activeCommentDialog}
          onClose={() => setActiveCommentDialog(null)}
          postId={activeCommentDialog.postId}
          postAuthor={activeCommentDialog.postAuthor}
        />
      )}
    </div>
  );
}
