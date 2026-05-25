import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PostWithAuthor } from '@/types/posts';
import { MessageCircle, Globe, Users, Repeat2, Heart, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LinkPreviewCard } from '@/components/feed/LinkPreviewCard';
import { ThreadedComments } from './ThreadedComments';
import { ReactionSummary } from './ReactionSummary';
import { SharedPostCard } from './SharedPostCard';
import { LikedByModal } from './LikedByModal';
import { ShareDialog } from './ShareDialog';
import { ReshareDialog } from '@/components/feed/dialogs/ReshareDialog';
import { PostMenuOwn } from './PostMenuOwn';
import { PostMenuOthers } from './PostMenuOthers';
import { usePostReactions } from '@/hooks/usePostReactions';
import { usePostLikes } from '@/hooks/usePostLikes';
import { usePostBookmark } from '@/hooks/usePostBookmark';
import { useReshare } from '@/hooks/useReshare';
import { usePostShares } from '@/hooks/usePostShares';
import { ReactionEmoji } from '@/types/reactions';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { usePostViewTracker } from '@/hooks/usePostViewTracker';
import { PostAnalytics } from './PostAnalytics';
import { feedAnalytics } from '@/lib/feedAnalytics';
import { MediaLightbox } from '@/components/feed/MediaLightbox';
import { linkifyContent } from '@/utils/linkifyContent';

interface PostCardProps {
  post: PostWithAuthor;
  currentUserId: string;
  onUpdate?: () => void;
  onCommentClick?: () => void;
  showComments?: boolean;
  feedItem?: any; // UniversalFeedItem for reshare support
  isReshare?: boolean;
}

export function PostCard({
  post,
  currentUserId,
  onUpdate,
  onCommentClick,
  showComments = false,
  feedItem,
  isReshare = false,
}: PostCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  
  const [showRepostDialog, setShowRepostDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showLikedByModal, setShowLikedByModal] = useState(false);
  const [showReshareDialog, setShowReshareDialog] = useState(false);
  const [showMediaLightbox, setShowMediaLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  
  // Truncate content at ~200 characters
  const CONTENT_PREVIEW_LENGTH = 200;
  const needsContentExpansion = post.content.length > CONTENT_PREVIEW_LENGTH;
  const contentPreview = needsContentExpansion 
    ? post.content.slice(0, CONTENT_PREVIEW_LENGTH) 
    : post.content;
  
  // Post reactions (emoji reactions) with notification context
  const {
    reactions,
    totalReactions,
    currentReaction,
    addReaction,
    removeReaction,
    isLoading: isReacting,
  } = usePostReactions(post.post_id, currentUserId, {
    postAuthorId: post.author_id,
    actorName: profile?.full_name,
    actorAvatarUrl: profile?.avatar_url,
  });

  // Post likes (simple heart like) with notification context
  const {
    likeCount,
    userHasLiked,
    likedBy,
    toggleLike,
    isLoading: isLiking,
  } = usePostLikes(post.post_id, currentUserId, {
    postAuthorId: post.author_id,
    actorName: profile?.full_name,
    actorAvatarUrl: profile?.avatar_url,
  });

  // Post bookmark
  const {
    isBookmarked,
    toggleBookmark,
    isLoading: isBookmarking,
  } = usePostBookmark(post.post_id, currentUserId);

  // Reshare functionality
  const {
    hasReshared,
    reshareCount,
    isLoading: isResharing,
    isReshareDialogOpen,
    openReshareDialog,
    closeReshareDialog,
    handleReshare,
    handleQuickReshare,
  } = useReshare({
    postId: post.post_id,
    userId: currentUserId,
    originalAuthorId: post.author_id,
    originalAuthorName: post.author_full_name,
    onSuccess: onUpdate,
  });

  // Post shares
  const {
    shareCount,
    userHasShared,
    sharePost,
    isSharing,
  } = usePostShares(post.post_id, currentUserId);

  // Automatic view tracking
  const viewTrackerRef = usePostViewTracker(post.post_id);

  const isOwnPost = post.author_id === currentUserId;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  // Explicit post_type → badge mapping. Only these values render a chip.
  // Standard / missing / 'update' / 'standard' → no badge (prevents accidental
  // 'Update' label on plain posts).
  const POST_TYPE_BADGES = {
    article: { label: 'Article', icon: '📄', color: 'text-copper-600' },
    question: { label: 'Question', icon: '❓', color: 'text-orange-600' },
    celebration: { label: 'Celebration', icon: '🎉', color: 'text-copper-600' },
  } as const;

  const postTypeDisplay =
    post.post_type && post.post_type in POST_TYPE_BADGES
      ? POST_TYPE_BADGES[post.post_type as keyof typeof POST_TYPE_BADGES]
      : null;

  const handleReactionSelect = async (reaction: ReactionEmoji) => {
    const userHasThisReaction = reactions.find((r) =>
      r.emoji === reaction && r.users.some((u) => u.user_id === currentUserId)
    );

    if (userHasThisReaction) {
      await removeReaction(reaction);
    } else {
      // Remove any existing reaction first
      if (currentReaction && currentReaction !== reaction) {
        await removeReaction(currentReaction);
      }
      await addReaction(reaction);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.post_id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author_full_name}`,
          text: post.content.substring(0, 100) + '...',
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copied!',
        description: 'Post link copied to clipboard',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_deleted: true })
        .eq('id', post.post_id);

      if (error) throw error;

      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted',
      });

      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const isRepost = !!post.original_post_id;

  return (
    <Card ref={viewTrackerRef} className="p-6 border-2 rounded-xl shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]" style={{ borderColor: 'hsl(215 16% 47%)' }}>
      {/* Repost indicator */}
      {isRepost && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Repeat2 className="h-4 w-4" />
          <span>
            <span className="font-medium text-foreground">{post.author_full_name}</span> shared this
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar
          className="h-12 w-12 cursor-pointer"
          onClick={() => navigate(`/dna/${post.author_username}`)}
        >
          <AvatarImage src={post.author_avatar_url} alt={post.author_full_name} />
          <AvatarFallback className="bg-[hsl(151,75%,50%)] text-white">
            {getInitials(post.author_full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-semibold cursor-pointer hover:text-[hsl(151,75%,50%)] transition-colors"
              onClick={() => navigate(`/dna/${post.author_username}`)}
            >
              {post.author_full_name}
            </h3>
            {post.is_connection && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Connection
              </Badge>
            )}
          </div>
          
          {post.author_headline && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {post.author_headline}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{timeAgo}</span>
            {postTypeDisplay && (
              <>
                <span>•</span>
                <span className={cn('flex items-center gap-1', postTypeDisplay.color)}>
                  <span>{postTypeDisplay.icon}</span>
                  <span>{postTypeDisplay.label}</span>
                </span>
              </>
            )}
            <span>•</span>
            {post.privacy_level === 'public' ? (
              <Globe className="h-3 w-3" />
            ) : (
              <Users className="h-3 w-3" />
            )}
          </div>
          
          {/* Analytics - only show on own posts */}
          {isOwnPost && (
            <PostAnalytics postId={post.post_id} className="mt-1" showEngagement />
          )}
        </div>

        {isOwnPost ? (
          <PostMenuOwn
            postId={post.post_id}
            authorId={post.author_id}
            currentUserId={currentUserId}
            content={post.content}
            isPinned={!!post.pinned_at}
            commentsDisabled={!!post.comments_disabled}
            onUpdate={onUpdate}
          />
        ) : (
          <PostMenuOthers
            postId={post.post_id}
            authorId={post.author_id}
            authorName={post.author_full_name}
            currentUserId={currentUserId}
            onUpdate={onUpdate}
          />
        )}
      </div>

      {/* Share Commentary (if this is a repost with commentary) */}
      {isRepost && post.share_commentary && (
        <div className="mb-4">
          <div className="whitespace-pre-wrap break-words">{linkifyContent(post.share_commentary)}</div>
        </div>
      )}

      {/* Original Post Content (if repost) */}
      {isRepost ? (
        <SharedPostCard post={post} />
      ) : (
        <>
          {/* Content with Read More */}
          <div className="mb-4">
            <div className="whitespace-pre-wrap break-words">
              {linkifyContent(isContentExpanded ? post.content : contentPreview)}
              {needsContentExpansion && !isContentExpanded && '...'}
            </div>
            {needsContentExpansion && (
              <button
                onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="text-primary text-sm font-medium mt-1 hover:underline"
              >
                {isContentExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* Media Display - supports single image/video or multi-image gallery */}
          {(() => {
            const isVideo = post.image_url ? /\.(mp4|webm|mov|quicktime)$/i.test(post.image_url) : false;
            const galleryAll: string[] = [];
            if (post.image_url && !isVideo) galleryAll.push(post.image_url);
            if (Array.isArray(post.gallery_urls)) {
              for (const u of post.gallery_urls) {
                if (typeof u === 'string' && u && !galleryAll.includes(u)) galleryAll.push(u);
              }
            }

            // Video posts: keep existing single-media behavior
            if (isVideo && post.image_url) {
              return (
                <div
                  className="mb-4 rounded-lg overflow-hidden border cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => { setLightboxIndex(0); setShowMediaLightbox(true); }}
                >
                  <video
                    src={post.image_url}
                    className="w-full h-auto max-h-[32rem] object-cover"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(0); setShowMediaLightbox(true); }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              );
            }

            if (galleryAll.length === 0) return null;

            const openAt = (i: number) => { setLightboxIndex(i); setShowMediaLightbox(true); };

            if (galleryAll.length === 1) {
              return (
                <div
                  className="mb-4 rounded-lg overflow-hidden border cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => openAt(0)}
                >
                  <img
                    src={galleryAll[0]}
                    alt="Post media"
                    className="w-full object-cover max-h-[32rem]"
                    loading="eager"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.parentElement) target.parentElement.style.display = 'none';
                    }}
                  />
                </div>
              );
            }

            // Multi-image gallery layouts
            const count = galleryAll.length;
            const visible = galleryAll.slice(0, 4);
            const extra = count - visible.length;

            const gridClass =
              count === 2
                ? 'grid-cols-2'
                : count === 3
                  ? 'grid-cols-2 grid-rows-2'
                  : 'grid-cols-2 grid-rows-2';

            return (
              <div className={cn('mb-4 grid gap-1 rounded-lg overflow-hidden border', gridClass)}>
                {visible.map((url, idx) => {
                  const isFirstOfThree = count === 3 && idx === 0;
                  const isLastTile = idx === visible.length - 1;
                  const showOverlay = isLastTile && extra > 0;
                  return (
                    <button
                      type="button"
                      key={`${url}-${idx}`}
                      onClick={() => openAt(idx)}
                      className={cn(
                        'relative block overflow-hidden bg-muted hover:opacity-95 transition-opacity',
                        isFirstOfThree && 'row-span-2',
                      )}
                    >
                      <img
                        src={url}
                        alt={`Post media ${idx + 1}`}
                        className="w-full h-full object-cover aspect-square"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                      />
                      {showOverlay && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-2xl font-semibold">+{extra}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Link/Video Preview - Uses LinkPreviewCard which only shows play button for videos */}
          {post.link_url && (
            <div className="mb-4">
              <LinkPreviewCard
                data={{
                  url: post.link_url,
                  title: post.link_title,
                  description: post.link_description,
                  thumbnail_url: post.link_metadata?.thumbnail_url,
                  provider_name: post.link_metadata?.provider_name,
                  type: post.link_metadata?.embed_type,
                  is_video: post.link_metadata?.is_video,
                }}
                showRemoveButton={false}
                size="full"
              />
            </div>
          )}
        </>
      )}

      {/* Stats */}
      {(likeCount > 0 || totalReactions > 0 || post.comments_count > 0 || reshareCount > 0) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b text-sm">
          <div className="flex items-center gap-3">
            {/* Like count - clickable */}
            {likeCount > 0 && (
              <button
                onClick={() => setShowLikedByModal(true)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                <span>{likeCount}</span>
              </button>
            )}

            {/* Emoji reactions summary */}
            {totalReactions > 0 && (
              <ReactionSummary reactions={reactions} totalCount={totalReactions} />
            )}
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            {post.comments_count > 0 && (
              <span>
                {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
              </span>
            )}
            {reshareCount > 0 && (
              <span className="flex items-center gap-1">
                <Repeat2 className="h-3 w-3" />
                {reshareCount} {reshareCount === 1 ? 'reshare' : 'reshares'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t [&>button]:min-h-[44px]">
        {/* Simple Like Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            toggleLike();
            feedAnalytics[userHasLiked ? 'unlike' : 'like']({
              userId: currentUserId,
              postId: post.post_id,
              postType: post.post_type || 'post',
              context: { surface: 'home' },
            });
          }}
          disabled={isLiking}
          className={cn(
            'flex-1 gap-1.5 px-2',
            userHasLiked && 'text-red-500 hover:text-red-600'
          )}
        >
          <Heart className={cn('h-4 w-4', userHasLiked && 'fill-red-500')} />
          <span className="hidden sm:inline">{userHasLiked ? 'Liked' : 'Like'}</span>
          <span className="sm:hidden">{likeCount > 0 ? likeCount : ''}</span>
        </Button>

        {/* DNA v1.0 LOCKDOWN: Emoji Reactions hidden until stable */}
        {/* <ReactionPicker onReactionSelect={handleReactionSelect}>
          <Button
            variant="ghost"
            size="sm"
            disabled={isReacting}
            className="flex-1 gap-1.5 px-2"
          >
            <span>😊</span>
            <span className="hidden sm:inline">React</span>
          </Button>
        </ReactionPicker> */}

        {/* Comment Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onCommentClick) {
              onCommentClick();
            }
            feedAnalytics.comment({
              userId: currentUserId,
              postId: post.post_id,
              postType: post.post_type || 'post',
              context: { surface: 'home' },
            });
          }}
          className="flex-1 gap-1.5 px-2"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Comment</span>
          <span className="sm:hidden">{post.comments_count > 0 ? post.comments_count : ''}</span>
        </Button>

        {/* Reshare Button - Re-enabled for DNA Interconnection */}
        {!isRepost && !isOwnPost && (
          <Button
            variant="ghost"
            size="sm"
            onClick={openReshareDialog}
            disabled={isResharing}
            className={cn(
              'flex-1 gap-1.5 px-2',
              hasReshared && 'text-green-600 hover:text-green-700'
            )}
          >
            <Repeat2 className={cn('h-4 w-4', hasReshared && 'fill-current')} />
            <span className="hidden sm:inline">{hasReshared ? 'Reshared' : 'Reshare'}</span>
            <span className="sm:hidden">{reshareCount > 0 ? reshareCount : ''}</span>
          </Button>
        )}

        {/* Bookmark Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleBookmark()}
          disabled={isBookmarking}
          className={cn('gap-1.5 px-2', isBookmarked && 'text-primary')}
        >
          <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
          <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
        </Button>
      </div>

      {/* Threaded Comments Section */}
      {showComments && (
        <ThreadedComments postId={post.post_id} currentUserId={currentUserId} />
      )}

      {/* Reshare Dialog */}
      {feedItem && (
        <ReshareDialog
          open={isReshareDialogOpen}
          onOpenChange={closeReshareDialog}
          post={feedItem}
          currentUserId={currentUserId}
          onReshare={handleReshare}
          isLoading={isResharing}
        />
      )}

      {/* Share Dialog */}
      {profile && (
        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          post={post}
          onShare={sharePost}
          userProfile={{
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          }}
        />
      )}

      {/* Liked By Modal */}
      <LikedByModal
        isOpen={showLikedByModal}
        onClose={() => setShowLikedByModal(false)}
        likedBy={likedBy}
      />

      {/* Media Lightbox */}
      {(() => {
        const isVideo = post.image_url ? /\.(mp4|webm|mov|quicktime)$/i.test(post.image_url) : false;
        const all: string[] = [];
        if (post.image_url) all.push(post.image_url);
        if (!isVideo && Array.isArray(post.gallery_urls)) {
          for (const u of post.gallery_urls) {
            if (typeof u === 'string' && u && !all.includes(u)) all.push(u);
          }
        }
        const url = all[lightboxIndex] ?? all[0];
        if (!url) return null;
        return (
          <MediaLightbox
            open={showMediaLightbox}
            onOpenChange={setShowMediaLightbox}
            mediaUrl={url}
            alt={`Media from ${post.author_full_name}'s post`}
          />
        );
      })()}
    </Card>
  );
}
