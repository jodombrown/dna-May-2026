import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Flag, Eye, Clock, MessageSquare, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createNotification } from '@/services/notificationService';

interface FlaggedPost {
  id: string;
  author_id: string;
  content: string;
  flagged_at: string;
  flagged_by: string;
  flag_reason: string;
  moderation_status: string;
  author_name: string;
  author_email: string;
  flagger_name: string;
  moderation_notes?: string;
  post_type: string;
}

interface FlaggedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  flagged_at: string;
  flagged_by: string;
  flag_reason: string;
  moderation_status: string;
  author_name: string;
  author_email: string;
  flagger_name: string;
  moderation_notes?: string;
}

const ContentModeration = () => {
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [flaggedComments, setFlaggedComments] = useState<FlaggedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<FlaggedPost | null>(null);
  const [selectedComment, setSelectedComment] = useState<FlaggedComment | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [selectedCommentIds, setSelectedCommentIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFlaggedContent();
  }, []);

  const fetchFlaggedContent = async () => {
    try {
      setLoading(true);

      // Fetch flagged posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          author_id,
          content,
          post_type,
          flagged_at,
          flagged_by,
          flag_reason,
          moderation_status,
          moderation_notes,
          author:profiles!posts_author_id_fkey(display_name),
          flagger:profiles!posts_flagged_by_fkey(display_name)
        `)
        .in('moderation_status', ['pending', 'flagged'])
        .order('flagged_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch flagged comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          flagged_at,
          flagged_by,
          flag_reason,
          moderation_status,
          moderation_notes,
          author:profiles!post_comments_user_id_fkey(display_name),
          flagger:profiles!post_comments_flagged_by_fkey(display_name)
        `)
        .in('moderation_status', ['pending', 'flagged'])
        .order('flagged_at', { ascending: false });

      if (commentsError) throw commentsError;

      setFlaggedPosts(
        postsData?.map((item: any) => ({
          id: item.id,
          author_id: item.author_id,
          content: item.content,
          post_type: item.post_type,
          flagged_at: item.flagged_at,
          flagged_by: item.flagged_by,
          flag_reason: item.flag_reason,
          moderation_status: item.moderation_status,
          author_name: item.author?.display_name || 'Unknown',
          author_email: item.author?.email || '',
          flagger_name: item.flagger?.display_name || 'Unknown',
          moderation_notes: item.moderation_notes
        })) || []
      );

      setFlaggedComments(
        commentsData?.map((item: any) => ({
          id: item.id,
          post_id: item.post_id,
          user_id: item.user_id,
          content: item.content,
          flagged_at: item.flagged_at,
          flagged_by: item.flagged_by,
          flag_reason: item.flag_reason,
          moderation_status: item.moderation_status,
          author_name: item.author?.display_name || 'Unknown',
          author_email: item.author?.email || '',
          flagger_name: item.flagger?.display_name || 'Unknown',
          moderation_notes: item.moderation_notes
        })) || []
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch flagged content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send moderation notification to user
  const sendModerationNotification = async (
    userId: string,
    contentType: 'post' | 'comment',
    status: 'approved' | 'rejected',
    reason?: string
  ) => {
    const isRejected = status === 'rejected';
    const title = isRejected
      ? `Your ${contentType} has been removed`
      : `Your ${contentType} has been reviewed`;
    const message = isRejected
      ? `Your ${contentType} was removed for violating our community guidelines.${reason ? ` Reason: ${reason}` : ''}`
      : `Your flagged ${contentType} has been reviewed and approved.`;

    await createNotification({
      user_id: userId,
      type: 'moderation_action',
      title,
      message,
      payload: {
        content_type: contentType,
        moderation_status: status,
        is_dna_system: true,
      },
    });
  };

  const handlePostModeration = async (postId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const post = selectedPost;

      const { data: updated, error } = await supabase
        .from('posts')
        .update({
          moderation_status: status,
          moderated_by: user.user.id,
          moderated_at: new Date().toISOString(),
          moderation_notes: reviewNotes || undefined
        })
        .eq('id', postId)
        .select('id');

      if (error) throw error;

      // Fail loud on a no-op: a zero-row update means the post was not moderated.
      const affected = updated?.length ?? 0;
      if (affected === 0) {
        toast({
          title: "No changes",
          description: "No rows were updated — the post may already be moderated or is no longer accessible.",
          variant: "destructive",
        });
        return;
      }

      // Send notification to the post author
      if (post) {
        await sendModerationNotification(post.author_id, 'post', status, post.flag_reason);
      }

      toast({
        title: "Success",
        description: `Post ${status} (${affected} updated)`,
      });

      fetchFlaggedContent();
      setSelectedPost(null);
      setReviewNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to moderate post",
        variant: "destructive",
      });
    }
  };

  const handleCommentModeration = async (commentId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const comment = selectedComment;

      const { data: updated, error } = await supabase
        .from('post_comments')
        .update({
          moderation_status: status,
          moderated_by: user.user.id,
          moderated_at: new Date().toISOString(),
          moderation_notes: reviewNotes || undefined
        })
        .eq('id', commentId)
        .select('id');

      if (error) throw error;

      // Fail loud on a no-op: a zero-row update means the comment was not moderated.
      const affected = updated?.length ?? 0;
      if (affected === 0) {
        toast({
          title: "No changes",
          description: "No rows were updated — the comment may already be moderated or is no longer accessible.",
          variant: "destructive",
        });
        return;
      }

      // Send notification to the comment author
      if (comment) {
        await sendModerationNotification(comment.user_id, 'comment', status, comment.flag_reason);
      }

      toast({
        title: "Success",
        description: `Comment ${status} (${affected} updated)`,
      });

      fetchFlaggedContent();
      setSelectedComment(null);
      setReviewNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to moderate comment",
        variant: "destructive",
      });
    }
  };

  // Bulk moderation functions
  const handleBulkPostModeration = async (status: 'approved' | 'rejected') => {
    if (selectedPostIds.size === 0) return;

    try {
      setBulkProcessing(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const ids = Array.from(selectedPostIds);

      const { data: updated, error } = await supabase
        .from('posts')
        .update({
          moderation_status: status,
          moderated_by: user.user.id,
          moderated_at: new Date().toISOString(),
        })
        .in('id', ids)
        .select('id');

      if (error) throw error;

      // Report the real affected-row count, not the client-side selection size.
      const affectedIds = new Set((updated ?? []).map(r => r.id));
      const affected = affectedIds.size;

      if (affected === 0) {
        toast({
          title: "No changes",
          description: `No rows were updated (0 of ${ids.length} selected). They may already be moderated or no longer accessible.`,
          variant: "destructive",
        });
        return;
      }

      // Notify only the authors whose posts were actually updated.
      const postsToNotify = flaggedPosts.filter(p => affectedIds.has(p.id));
      await Promise.all(
        postsToNotify.map(post =>
          sendModerationNotification(post.author_id, 'post', status, post.flag_reason)
        )
      );

      toast({
        title: affected < ids.length ? "Partial update" : "Bulk action complete",
        description: affected < ids.length
          ? `${affected} of ${ids.length} post(s) ${status}; ${ids.length - affected} not updated.`
          : `${affected} post(s) ${status} successfully`,
        variant: affected < ids.length ? "destructive" : undefined,
      });

      setSelectedPostIds(new Set());
      fetchFlaggedContent();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process bulk moderation",
        variant: "destructive",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkCommentModeration = async (status: 'approved' | 'rejected') => {
    if (selectedCommentIds.size === 0) return;

    try {
      setBulkProcessing(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const ids = Array.from(selectedCommentIds);

      const { data: updated, error } = await supabase
        .from('post_comments')
        .update({
          moderation_status: status,
          moderated_by: user.user.id,
          moderated_at: new Date().toISOString(),
        })
        .in('id', ids)
        .select('id');

      if (error) throw error;

      // Report the real affected-row count, not the client-side selection size.
      const affectedIds = new Set((updated ?? []).map(r => r.id));
      const affected = affectedIds.size;

      if (affected === 0) {
        toast({
          title: "No changes",
          description: `No rows were updated (0 of ${ids.length} selected). They may already be moderated or no longer accessible.`,
          variant: "destructive",
        });
        return;
      }

      // Notify only the authors whose comments were actually updated.
      const commentsToNotify = flaggedComments.filter(c => affectedIds.has(c.id));
      await Promise.all(
        commentsToNotify.map(comment =>
          sendModerationNotification(comment.user_id, 'comment', status, comment.flag_reason)
        )
      );

      toast({
        title: affected < ids.length ? "Partial update" : "Bulk action complete",
        description: affected < ids.length
          ? `${affected} of ${ids.length} comment(s) ${status}; ${ids.length - affected} not updated.`
          : `${affected} comment(s) ${status} successfully`,
        variant: affected < ids.length ? "destructive" : undefined,
      });

      setSelectedCommentIds(new Set());
      fetchFlaggedContent();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process bulk moderation",
        variant: "destructive",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const togglePostSelection = (id: string) => {
    const newSelection = new Set(selectedPostIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedPostIds(newSelection);
  };

  const toggleCommentSelection = (id: string) => {
    const newSelection = new Set(selectedCommentIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCommentIds(newSelection);
  };

  const toggleAllPosts = () => {
    if (selectedPostIds.size === flaggedPosts.length) {
      setSelectedPostIds(new Set());
    } else {
      setSelectedPostIds(new Set(flaggedPosts.map(p => p.id)));
    }
  };

  const toggleAllComments = () => {
    if (selectedCommentIds.size === flaggedComments.length) {
      setSelectedCommentIds(new Set());
    } else {
      setSelectedCommentIds(new Set(flaggedComments.map(c => c.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'flagged':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500"><Flag className="h-3 w-3 mr-1" />Flagged</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Content Moderation</h2>
        <p className="text-muted-foreground">Review and moderate flagged posts and comments</p>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList>
          <TabsTrigger value="posts" className="gap-2">
            <FileText className="h-4 w-4" />
            Flagged Posts ({flaggedPosts.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Flagged Comments ({flaggedComments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {/* Bulk Actions Bar */}
          {selectedPostIds.size > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedPostIds.size} post(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPostIds(new Set())}
                  disabled={bulkProcessing}
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkPostModeration('rejected')}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                  Reject All
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleBulkPostModeration('approved')}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Approve All
                </Button>
              </div>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={flaggedPosts.length > 0 && selectedPostIds.size === flaggedPosts.length}
                      onCheckedChange={toggleAllPosts}
                      aria-label="Select all posts"
                    />
                  </TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Flagged By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flagged</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flaggedPosts.map((post) => (
                  <TableRow key={post.id} className={selectedPostIds.has(post.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPostIds.has(post.id)}
                        onCheckedChange={() => togglePostSelection(post.id)}
                        aria-label={`Select post by ${post.author_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{post.author_name}</div>
                        <div className="text-sm text-muted-foreground">{post.author_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{post.content}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.flag_reason}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{post.flagger_name}</TableCell>
                    <TableCell>{getStatusBadge(post.moderation_status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(post.flagged_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPost(post);
                              setReviewNotes(post.moderation_notes || '');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Review Flagged Post</DialogTitle>
                          </DialogHeader>
                          {selectedPost && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Author</label>
                                  <p className="text-sm">{selectedPost.author_name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Flagged By</label>
                                  <p className="text-sm">{selectedPost.flagger_name}</p>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Flag Reason</label>
                                <p className="text-sm bg-muted p-3 rounded mt-1">
                                  {selectedPost.flag_reason}
                                </p>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Post Content</label>
                                <p className="text-sm bg-muted p-3 rounded mt-1">
                                  {selectedPost.content}
                                </p>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Moderation Notes</label>
                                <Textarea
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Add moderation notes..."
                                  rows={3}
                                />
                              </div>

                              <div className="flex justify-end gap-3">
                                <Button
                                  variant="destructive"
                                  onClick={() => handlePostModeration(selectedPost.id, 'rejected')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handlePostModeration(selectedPost.id, 'approved')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {flaggedPosts.length === 0 && (
            <div className="text-center py-12 border rounded-lg">
              <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No flagged posts to review</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          {/* Bulk Actions Bar */}
          {selectedCommentIds.size > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedCommentIds.size} comment(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCommentIds(new Set())}
                  disabled={bulkProcessing}
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkCommentModeration('rejected')}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                  Reject All
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleBulkCommentModeration('approved')}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Approve All
                </Button>
              </div>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={flaggedComments.length > 0 && selectedCommentIds.size === flaggedComments.length}
                      onCheckedChange={toggleAllComments}
                      aria-label="Select all comments"
                    />
                  </TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Flagged By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flagged</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flaggedComments.map((comment) => (
                  <TableRow key={comment.id} className={selectedCommentIds.has(comment.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCommentIds.has(comment.id)}
                        onCheckedChange={() => toggleCommentSelection(comment.id)}
                        aria-label={`Select comment by ${comment.author_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{comment.author_name}</div>
                        <div className="text-sm text-muted-foreground">{comment.author_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{comment.content}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{comment.flag_reason}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{comment.flagger_name}</TableCell>
                    <TableCell>{getStatusBadge(comment.moderation_status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(comment.flagged_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedComment(comment);
                              setReviewNotes(comment.moderation_notes || '');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Review Flagged Comment</DialogTitle>
                          </DialogHeader>
                          {selectedComment && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Author</label>
                                  <p className="text-sm">{selectedComment.author_name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Flagged By</label>
                                  <p className="text-sm">{selectedComment.flagger_name}</p>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Flag Reason</label>
                                <p className="text-sm bg-muted p-3 rounded mt-1">
                                  {selectedComment.flag_reason}
                                </p>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Comment Content</label>
                                <p className="text-sm bg-muted p-3 rounded mt-1">
                                  {selectedComment.content}
                                </p>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Moderation Notes</label>
                                <Textarea
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Add moderation notes..."
                                  rows={3}
                                />
                              </div>

                              <div className="flex justify-end gap-3">
                                <Button
                                  variant="destructive"
                                  onClick={() => handleCommentModeration(selectedComment.id, 'rejected')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleCommentModeration(selectedComment.id, 'approved')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {flaggedComments.length === 0 && (
            <div className="text-center py-12 border rounded-lg">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No flagged comments to review</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentModeration;
