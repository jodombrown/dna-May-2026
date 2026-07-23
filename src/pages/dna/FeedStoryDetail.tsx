/**
 * DNA | FEED v2.0 - Story Detail (Feed Stories)
 *
 * Full-page reading experience for stories created via Universal Composer.
 * Uses slug or post_id from posts table.
 * Signed-out visitors are redirected to the public /post/:postId page
 * (PublicSiteHeader, no in-app chrome); this in-app view is members-only.
 */

import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, BookOpen, Share2, X, MessageCircle, Bookmark, ArrowRight, Images } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { HashtagText } from '@/components/feed/HashtagText';
import { usePostLikes } from '@/hooks/usePostLikes';
import { usePostBookmarks } from '@/hooks/usePostBookmarks';
import { ThreadedComments } from '@/components/posts/ThreadedComments';
import { cn } from '@/lib/utils';

export default function FeedStoryDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  const { data: story, isLoading, error } = useQuery({
    queryKey: ['feed-story', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No story identifier provided');

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          subtitle,
          content,
          image_url,
          gallery_urls,
          post_type,
          created_at,
          space_id,
          event_id,
          author_id,
          slug
        `)
        .eq('is_deleted', false)
        .in('post_type', ['story', 'update', 'impact', 'reshare', 'post']);

      if (isUUID) {
        query = query.eq('id', slug);
      } else {
        query = query.eq('slug', slug);
      }

      const { data: postData, error: postError } = await query.maybeSingle();

      if (postError) throw postError;
      if (!postData) throw new Error('Content not found');

      let author = null;
      if (postData.author_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', postData.author_id)
          .single();
        author = profileData;
      }

      return {
        ...postData,
        author,
      };
    },
    enabled: !!slug,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Hooks must be called unconditionally
  const postId = story?.id || '';
  const { likeCount, userHasLiked, toggleLike, isLoading: isLikePending } = usePostLikes(postId, user?.id, {
    postAuthorId: story?.author_id,
    actorName: user?.user_metadata?.full_name,
    actorAvatarUrl: user?.user_metadata?.avatar_url,
  });
  const { userHasBookmarked, toggleBookmark } = usePostBookmarks(postId, user?.id);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: story?.title || 'DNA Story', url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ description: 'Link copied to clipboard' });
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dna/convey');
    }
  };

  const openImagePreview = (url: string) => {
    setPreviewImageUrl(url);
    setShowImagePreview(true);
  };

  // Never redirect on an unresolved session: auth `loading` is true during
  // the initial session check, so `user` is null for a signed-in member on a
  // cold load or hard refresh. Hold a neutral loader (no in-app chrome) until
  // the session resolves, then send signed-out visitors to the public post
  // page. Redirect on the route param — /post/:postId resolves slug or UUID.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/post/${slug}`} replace />;
  }

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center pb-16 md:pb-0">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (error || !story) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 pb-20 md:pb-6">
          <div className="max-w-md w-full bg-muted/50 border border-border rounded-lg p-6 sm:p-8 text-center space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Content not available</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                This content may have been removed or is no longer accessible.
              </p>
            </div>
            <Button onClick={() => navigate('/dna/feed')} variant="outline" size="sm">
              Back to Feed
            </Button>
          </div>
        </div>
      </>
    );
  }

  const isStory = story.post_type === 'story';
  const author = story.author as { username?: string; full_name?: string; avatar_url?: string } | null;
  const galleryUrls = (story.gallery_urls as string[] | null) || [];

  return (
    <div className="min-h-screen bg-background pb-bottom-nav md:pb-0">
      {/* Header Navigation */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Story Content */}
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {isStory && (
          <Badge variant="secondary" className="gap-1 mb-4 text-xs uppercase tracking-wide">
            <BookOpen className="h-3 w-3" />
            Story
          </Badge>
        )}

        <button
          type="button"
          className="group mb-2 inline-flex w-full items-start justify-between gap-3 text-left"
          onClick={() => {
            const titleElement = document.getElementById('story-body-start');
            titleElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          <h1 className="text-2xl md:text-h1 font-serif text-primary leading-tight transition-opacity duration-200 group-hover:opacity-80">
            {story.title}
          </h1>
          <ArrowRight className="mt-1 h-5 w-5 flex-shrink-0 text-primary/80 transition-transform duration-200 group-hover:translate-x-1" />
        </button>

        {story.subtitle && (
          <p className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed">
            {story.subtitle}
          </p>
        )}

        <div className="flex items-center gap-2 pb-4 mb-6 border-b">
          <Avatar
            className="h-10 w-10 cursor-pointer"
            onClick={() => navigate(`/dna/${author?.username}`)}
          >
            <AvatarImage src={author?.avatar_url || ''} />
            <AvatarFallback>{author?.full_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p
              className="font-medium text-sm hover:underline cursor-pointer"
              onClick={() => navigate(`/dna/${author?.username}`)}
            >
              {author?.full_name || author?.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(story.created_at), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Hero Image */}
        {story.image_url && (
          <div
            className="w-full rounded-xl overflow-hidden mb-6 cursor-pointer group bg-muted/30"
            onClick={() => openImagePreview(story.image_url!)}
          >
            <img
              src={story.image_url}
              alt={story.title || 'Story image'}
              className="w-full h-auto max-h-[320px] sm:max-h-[480px] object-contain mx-auto group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        )}

        {/* Photo Gallery */}
        {galleryUrls.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Images className="h-4 w-4" />
              <span>{galleryUrls.length} photo{galleryUrls.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 story-scroll">
              {galleryUrls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="group relative h-56 w-[82%] min-w-[280px] snap-start overflow-hidden rounded-lg bg-muted/30 text-left shadow-sm sm:h-64 sm:w-[420px]"
                  onClick={() => openImagePreview(url)}
                >
                  <img
                    src={url}
                    alt={`Gallery photo ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent px-4 py-3 text-sm font-medium text-background">
                    Photo {idx + 1} of {galleryUrls.length}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body Content */}
        <div id="story-body-start" className="space-y-4">
          {story.content?.split('\n\n').map((paragraph, idx) => (
            <HashtagText
              key={idx}
              content={paragraph}
              onHashtagClick={(tag) => navigate(`/dna/hashtag/${encodeURIComponent(tag)}`)}
              className="text-base md:text-lg text-foreground/90 leading-relaxed whitespace-pre-line block"
            />
          ))}
        </div>

        {/* Engagement Bar */}
        {user && (
          <div className="flex items-center gap-3 md:gap-4 pt-4 mt-8 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="flex min-h-11 items-center gap-2 text-sm"
              onClick={() => toggleLike()}
              disabled={isLikePending}
            >
              <BookOpen
                className={cn(
                  'h-4 w-4',
                  userHasLiked ? 'fill-primary text-primary' : 'text-muted-foreground'
                )}
              />
              <span>{likeCount > 0 ? `${likeCount} Appreciate${likeCount > 1 ? 's' : ''}` : 'Appreciate'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className={cn('h-4 w-4', showComments && 'text-primary')} />
              <span>Comment</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => toggleBookmark()}
            >
              <Bookmark
                className={cn(
                  'h-4 w-4',
                  userHasBookmarked ? 'fill-current text-primary' : 'text-muted-foreground'
                )}
              />
            </Button>
          </div>
        )}

        {/* Threaded Comments */}
        {showComments && user && (
          <div className="mt-4">
            <ThreadedComments postId={story.id} currentUserId={user.id} />
          </div>
        )}
      </article>

      {/* Footer CTA */}
      <div className="border-t bg-muted/30 py-6 md:py-8 mt-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <p className="text-sm md:text-base text-muted-foreground">
            Explore more stories from the diaspora
          </p>
          <Button onClick={() => navigate('/dna/convey')} size="sm">
            View All Stories
          </Button>
        </div>
      </div>

      {/* Image Preview Dialog */}
      {showImagePreview && previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <button
            className="absolute top-4 right-4 text-foreground hover:text-muted-foreground transition-colors"
            onClick={() => setShowImagePreview(false)}
            aria-label="Close preview"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={previewImageUrl}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
