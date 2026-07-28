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

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PublicPostView, PublicPostNotFound } from '@/components/posts/PublicPostView';
import { isUUID } from '@/utils/slugify';

const fetchPublicPost = async (postId: string) => {
  const { data, error } = await supabase.rpc('get_public_post', {
    p_slug_or_id: postId,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('Post not found');
  return {
    ...row,
    author: row.author_name
      ? {
          username: row.author_username,
          full_name: row.author_name,
          avatar_url: row.author_avatar_url,
        }
      : null,
  };
};

const PublicPostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLoggedIn = !!user;

  // Fetch post data. The :postId param accepts a UUID or a slug — internal
  // in-app URLs carry `slug || id`, and signed-out visitors are redirected
  // here on that raw param (mirrors get_public_event's slug-or-UUID contract).
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['public-post', postId],
    queryFn: () => fetchPublicPost(postId!),
    enabled: !!postId,
  });

  useEffect(() => {
    if (!postId || !post?.slug || !isUUID(postId)) return;
    navigate(`/post/${post.slug}`, { replace: true });
  }, [navigate, post?.slug, postId]);

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

  return <PublicPostView post={post} postId={post.slug || postId!} isLoggedIn={isLoggedIn} />;
};

export default PublicPostPage;
