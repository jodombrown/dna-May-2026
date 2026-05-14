/**
 * Publicly Accessible Post Page
 * Route: /post/:postId
 * 
 * This page is accessible to ANYONE - no authentication required.
 * Shows post content and CTAs to sign up or engage.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Heart, Share2, ExternalLink, FileText, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { LinkPreviewCard } from '@/components/feed/LinkPreviewCard';
import { linkifyContent } from '@/utils/linkifyContent';
import UnifiedHeader from '@/components/UnifiedHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { Mpatapo } from '@/components/icons/adinkra';

const PublicPostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const isLoggedIn = !!user;

  // Animate banner in after a short delay for non-logged-in users
  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  // Fetch post data
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['public-post', postId],
    queryFn: async () => {
      // First get the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
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

      // Get engagement counts
      const [likesResult, commentsResult] = await Promise.all([
        supabase
          .from('post_likes')
          .select('id', { count: 'exact' })
          .eq('post_id', postId),
        supabase
          .from('post_comments')
          .select('id', { count: 'exact' })
          .eq('post_id', postId)
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

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${postId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: 'Link copied!',
      description: 'Share this post with anyone',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    const url = `${window.location.origin}/post/${postId}`;
    const title = post?.author?.full_name 
      ? `Post by ${post.author.full_name} on DNA` 
      : 'Post on DNA';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: post?.content?.slice(0, 100) + (post?.content?.length > 100 ? '...' : ''),
          url,
        });
      } catch (err) {
        // User cancelled or error - fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleEngage = () => {
    if (!isLoggedIn) {
      sessionStorage.setItem('dna_post_after_auth', postId || '');
      navigate(`/auth?redirect=/dna/feed`);
      return;
    }
    navigate('/dna/feed');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedHeader />
        <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This post doesn't exist, has been removed, or is set to private.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/')}>
              Visit DNA
            </Button>
            {!isLoggedIn && (
              <Button variant="outline" onClick={() => navigate('/waitlist')}>
                Join Waitlist
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const authorName = post.author?.full_name || 'DNA Member';
  const authorUsername = post.author?.username;
  const contentPreview = post.content?.slice(0, 160) || '';

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{authorName} on DNA | Diaspora Network of Africa</title>
        <meta name="description" content={contentPreview} />
        <meta property="og:title" content={`${authorName} on DNA`} />
        <meta property="og:description" content={contentPreview} />
        <meta property="og:image" content={post.image_url || post.author?.avatar_url || '/og-image.png'} />
        <meta property="og:url" content={`${window.location.origin}/post/${postId}`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content={post.image_url ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={`${authorName} on DNA`} />
        <meta name="twitter:description" content={contentPreview} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Use the standard unified header - fixed at top */}
        <UnifiedHeader />

        {/* Spacer for fixed header */}
        <div className="h-16" />

        {/* Animated CTA Banner for non-logged-in users - with spacing from header */}
        <AnimatePresence>
          {!isLoggedIn && showBanner && (
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-gradient-to-r from-dna-forest via-dna-emerald to-dna-forest mt-3 mx-4 sm:mx-auto sm:max-w-2xl rounded-lg shadow-md"
            >
              <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white min-w-0">
                  <Mpatapo className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium truncate">
                    Shared from DNA. Connect with the diaspora
                  </span>
                </div>
                <Button
                  size="sm"
                  className="bg-white text-dna-forest hover:bg-white/90 shrink-0 h-7 text-xs px-3"
                  asChild
                >
                  <Link to="/waitlist">
                    Join Waitlist
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container max-w-2xl mx-auto px-4 py-6">
          {/* Post Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              {/* Author Header */}
              <div className="flex items-start gap-3 mb-4">
                <Link to={authorUsername ? `/u/${authorUsername}` : '#'}>
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-background">
                    <AvatarImage src={post.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(authorName)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link 
                    to={authorUsername ? `/u/${authorUsername}` : '#'}
                    className="font-semibold hover:underline"
                  >
                    {authorName}
                  </Link>
                  {(post.author?.headline || post.author?.profession) && (
                    <p className="text-sm text-muted-foreground truncate">
                      {post.author?.headline || post.author?.profession}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>

                <Button variant="ghost" size="sm" onClick={handleNativeShare} className="shrink-0">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="whitespace-pre-wrap break-words text-foreground leading-relaxed">
                  {linkifyContent(post.content)}
                </p>
              </div>

              {/* Post Image */}
              {post.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="w-full max-h-[500px] object-cover"
                  />
                </div>
              )}

              {/* Link Preview */}
              {post.link_url && (
                <div className="mb-4">
                  <LinkPreviewCard
                    data={{
                      url: post.link_url,
                      title: post.link_title || undefined,
                      description: post.link_description || undefined,
                      thumbnail_url: (post.link_metadata as any)?.thumbnail_url || undefined,
                    }}
                  />
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center gap-6 py-3 border-t border-b text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4" />
                  <span>{post.likes_count} likes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments_count} comments</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4">
                <Button
                  onClick={handleEngage}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {isLoggedIn ? 'Like & Comment' : 'Sign Up to Engage'}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Compact Horizontal Author Card */}
          {post.author && (
            <Card className="mt-4">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <Link to={authorUsername ? `/u/${authorUsername}` : '#'} className="shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.author.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(authorName)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={authorUsername ? `/u/${authorUsername}` : '#'}
                      className="font-semibold text-sm hover:underline block truncate"
                    >
                      {authorName}
                    </Link>
                    {(post.author.headline || post.author.profession) && (
                      <p className="text-xs text-muted-foreground truncate">
                        {post.author.headline || post.author.profession}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => authorUsername && navigate(`/u/${authorUsername}`)}
                    className="shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    <span className="hidden sm:inline">View Profile</span>
                    <span className="sm:hidden">Profile</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compact CTA Card for non-logged-in users */}
          {!isLoggedIn && (
            <Card className="mt-4 bg-gradient-to-r from-dna-forest to-dna-emerald text-white overflow-hidden">
              <CardContent className="py-4 px-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-base font-bold">
                      Join the Conversation on DNA
                    </h2>
                    <p className="text-white/80 text-xs mt-0.5">
                      Connect with the global African diaspora. Like, comment, and share your own stories.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button 
                      size="sm" 
                      className="bg-dna-copper hover:bg-dna-gold text-white h-8 text-xs"
                      asChild
                    >
                      <Link to="/waitlist">
                        Join the Waitlist
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="bg-white text-dna-forest hover:bg-white/90 h-8 text-xs"
                      asChild
                    >
                      <Link to="/about">
                        Learn About DNA
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <footer className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>
              DNA - Diaspora Network of Africa
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <Link to="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default PublicPostPage;
