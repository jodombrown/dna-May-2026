/**
 * Publicly Accessible Post Page
 * Route: /post/:postId  (accepts a post UUID or slug)
 *
 * This page is accessible to ANYONE - no authentication required.
 *
 * Route/fetch shell only. All presentation lives in
 * src/components/posts/PublicPostView.tsx — the design-system gate bans
 * layout classes under src/pages.
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PublicPostView, PublicPostNotFound } from '@/components/posts/PublicPostView';

const PublicPostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();

  const isLoggedIn = !!user;

  // Fetch post data. The :postId param accepts a UUID or a slug — internal
  // in-app URLs carry `slug || id`, and signed-out visitors are redirected
  // here on that raw param (mirrors get_public_event's slug-or-UUID contract).
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['public-post', postId],
    queryFn: async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId!);

      // First get the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq(isUUID ? 'id' : 'slug', postId!)
        .eq('is_deleted', false)
        .maybeSingle();

      if (postError) throw postError;
      if (!postData) throw new Error('Post not found');

      // Check if post is public
      if (postData.privacy_level !== 'public') {
        throw new Error('This post is private');
      }

      // Get author profile
      const { data: authorData, error: authorError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, headline, profession')
        .eq('id', postData.author_id)
        .maybeSingle();

      if (authorError) throw authorError;

      // Get engagement counts — keyed on the resolved row's UUID, since the
      // route param may be a slug.
      const [likesResult, commentsResult] = await Promise.all([
        supabase
          .from('post_likes')
          .select('id', { count: 'exact' })
          .eq('post_id', postData.id),
        supabase
          .from('post_comments')
          .select('id', { count: 'exact' })
          .eq('post_id', postData.id)
          .eq('is_deleted', false),
      ]);

      return {
        ...postData,
        author: authorData,
        likes_count: likesResult.count || 0,
        comments_count: commentsResult.count || 0,
      };
    },
    enabled: !!postId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !post) {
    return <PublicPostNotFound isLoggedIn={isLoggedIn} />;
  }

  return <PublicPostView post={post} postId={postId!} isLoggedIn={isLoggedIn} />;
};

export default PublicPostPage;
