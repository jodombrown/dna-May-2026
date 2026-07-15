/**
 * Presentational view for the public post page (/post/:postId).
 *
 * All layout and presentation for that route lives here so the page file
 * stays a pure route/fetch shell — the design-system gate bans layout
 * classes under src/pages. Receives the already-fetched post as props.
 */

import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Heart, Share2, ExternalLink, FileText, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { LinkPreviewCard } from '@/components/feed/LinkPreviewCard';
import { linkifyContent } from '@/utils/linkifyContent';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import { FiveCsDiscoverySection } from '@/components/five-cs/FiveCsDiscoverySection';

interface PublicPostAuthor {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  profession: string | null;
}

export interface PublicPostViewPost {
  content: string;
  image_url: string | null;
  link_url: string | null;
  link_title: string | null;
  link_description: string | null;
  link_metadata: unknown;
  created_at: string;
  updated_at: string | null;
  author: PublicPostAuthor | null;
  likes_count: number;
  comments_count: number;
}

interface PublicPostViewProps {
  post: PublicPostViewPost;
  /** Raw route param (UUID or slug) — used to build share URLs. */
  postId: string;
  isLoggedIn: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const PublicPostNotFound = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader />
      <div aria-hidden style={{ height: "var(--unified-header-height, 64px)" }} />
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-h1 mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This post doesn't exist, has been removed, or is set to private.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate('/')}>
            Visit DNA
          </Button>
          {!isLoggedIn && (
            <Button variant="outline" onClick={() => navigate('/auth?mode=signup')}>
              Join the Waitlist
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const PublicPostView = ({ post, postId, isLoggedIn }: PublicPostViewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

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

  const authorName = post.author?.full_name || 'DNA Member';
  const authorUsername = post.author?.username;
  const SITE_URL = 'https://diasporanetwork.africa';
  const rawContent = (post.content || '').trim();
  const contentPreview = rawContent.length >= 50
    ? (rawContent.length > 160 ? rawContent.slice(0, 157).trimEnd() + '...' : rawContent)
    : `Read this post by ${authorName} on DNA, the mobilization infrastructure for the Global African Diaspora's return.`;
  const postUrl = `${SITE_URL}/post/${postId}`;
  const ogImage = post.image_url || post.author?.avatar_url || `${SITE_URL}/og-image.png`;
  const absoluteOgImage = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
  const postTitle = `${authorName} on DNA | Diaspora Network of Africa`;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${authorName} on DNA`,
    description: contentPreview,
    image: absoluteOgImage,
    url: postUrl,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUsername ? { url: `${SITE_URL}/dna/${authorUsername}` } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Diaspora Network of Africa',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{postTitle}</title>
        <meta name="description" content={contentPreview} />
        <link rel="canonical" href={postUrl} />
        <meta property="og:title" content={`${authorName} on DNA`} />
        <meta property="og:description" content={contentPreview} />
        <meta property="og:image" content={absoluteOgImage} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Diaspora Network of Africa" />
        <meta name="twitter:card" content={post.image_url ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={`${authorName} on DNA`} />
        <meta name="twitter:description" content={contentPreview} />
        <meta name="twitter:image" content={absoluteOgImage} />
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <UnifiedHeader />
        <div aria-hidden style={{ height: "var(--unified-header-height, 64px)" }} />

        <div className="container max-w-2xl mx-auto px-4 pt-3 pb-6">

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
                    <p className="text-body text-muted-foreground truncate">
                      {post.author?.headline || post.author?.profession}
                    </p>
                  )}
                  <p className="text-meta text-muted-foreground mt-0.5">
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
                    className="w-full max-h-96 object-cover"
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
              <div className="flex items-center gap-6 py-3 border-t border-b text-body text-muted-foreground">
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
                {isLoggedIn ? (
                  <Button
                    onClick={handleEngage}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Like & Comment
                  </Button>
                ) : (
                  <div className="flex-1 flex items-center justify-between gap-3 rounded-md bg-muted/40 border border-border px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0 text-body text-muted-foreground">
                      <Heart className="w-4 h-4 shrink-0" />
                      <span className="truncate">Like, comment, and reply on DNA</span>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 h-8 text-meta" asChild>
                      <Link to="/auth?mode=signup">Join the Waitlist</Link>
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  aria-label="Copy link to post"
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
                      <AvatarFallback className="bg-primary text-primary-foreground text-body">
                        {getInitials(authorName)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={authorUsername ? `/u/${authorUsername}` : '#'}
                      className="font-semibold text-body hover:underline block truncate"
                    >
                      {authorName}
                    </Link>
                    {(post.author.headline || post.author.profession) && (
                      <p className="text-meta text-muted-foreground truncate">
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

          {/* Five C's discovery - signed-out visitors only */}
          {!isLoggedIn && (
            <div className="mt-8">
              <FiveCsDiscoverySection
                username={authorUsername}
                memberFirstName={post.author?.full_name?.split(' ')[0] ?? null}
                source="public_post"
              />
            </div>
          )}

        </div>
        <Footer />
      </div>

    </>
  );
};
