/**
 * DNA | FEED - Universal Feed Item Router
 * 
 * Routes each feed item to the appropriate card component based on its type.
 * This is the single entry point for rendering any feed content.
 */

import React, { useState } from 'react';
import { UniversalFeedItem as UniversalFeedItemType } from '@/types/feed';
import { PostCard } from '@/components/posts/PostCard';
import { EventCard } from './cards/EventCard';
import { SpaceCard } from './cards/SpaceCard';
import { NeedCard } from './cards/NeedCard';
import { StoryCard } from './cards/StoryCard';
import { OpportunityFeedCard } from './cards/OpportunityFeedCard';

interface UniversalFeedItemProps {
  item: UniversalFeedItemType;
  currentUserId: string;
  onUpdate: () => void;
}

export const UniversalFeedItemComponent: React.FC<UniversalFeedItemProps> = ({
  item,
  currentUserId,
  onUpdate,
}) => {
  const [showComments, setShowComments] = useState(false);

  // Defensive guards
  if (!item || !item.post_id || !item.author_id) {
    return null;
  }

  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  // Wrap every rendered card so the regression test (and analytics) can
  // count items uniformly across All / For You / Mine.
  const wrap = (children: React.ReactNode) => (
    <div data-testid="universal-feed-item" data-post-id={item.post_id} data-post-type={item.post_type}>
      {children}
    </div>
  );


  // Route based on canonical post_type. The post_type / story_type values
  // are passed through unchanged - never tab-overridden - so the same post
  // renders identically on All / For You / Mine.
  switch (item.post_type) {
    case 'story':
      return wrap(
        <StoryCard
          item={item}
          currentUserId={currentUserId}
          onUpdate={onUpdate}
          showComments={showComments}
          onCommentClick={handleCommentClick}
        />
      );

    case 'event':
      return wrap(
        <EventCard item={item} currentUserId={currentUserId} onUpdate={onUpdate} />
      );

    case 'space':
      return wrap(
        <SpaceCard item={item} currentUserId={currentUserId} onUpdate={onUpdate} />
      );

    case 'need':
      return wrap(
        <OpportunityFeedCard item={item} currentUserId={currentUserId} onUpdate={onUpdate} />
      );

    case 'reshare':
      return wrap(
        <PostCard
          post={{
            post_id: item.post_id,
            author_id: item.author_id,
            author_username: item.author_username,
            author_full_name: item.author_display_name,
            author_avatar_url: item.author_avatar_url || undefined,
            content: item.content,
            post_type: item.post_type as never,
            privacy_level: item.privacy_level as never,
            image_url: item.media_url || undefined,
            created_at: item.created_at,
            likes_count: item.like_count,
            comments_count: item.comment_count,
            user_has_liked: item.has_liked,
            is_connection: false,
            original_post_id: item.original_post_id || undefined,
            original_author_id: item.original_author_id || undefined,
            original_author_username: item.original_author_username || undefined,
            original_author_full_name: item.original_author_full_name || undefined,
            original_author_avatar_url: item.original_author_avatar_url || undefined,
            original_author_headline: item.original_author_headline || undefined,
            original_content: item.original_content || undefined,
            original_image_url: item.original_image_url || undefined,
            original_created_at: item.original_created_at || undefined,
            share_commentary: item.content || undefined,
          }}
          currentUserId={currentUserId}
          onUpdate={onUpdate}
          onCommentClick={handleCommentClick}
          showComments={showComments}
          feedItem={item}
          isReshare={true}
        />
      );

    case 'post':
    case 'community_post':
    default:
      return wrap(
        <PostCard
          post={{
            post_id: item.post_id,
            author_id: item.author_id,
            author_username: item.author_username || 'unknown',
            author_full_name: item.author_display_name || 'Unknown User',
            author_avatar_url: item.author_avatar_url || undefined,
            content: item.content || '',
            // Preserve the real post_type. PostCard's POST_TYPE_BADGES
            // allowlist controls badge rendering; unknown types render no
            // badge, which is the correct behavior.
            post_type: (item.post_type || 'post') as never,
            privacy_level: item.privacy_level as never,
            image_url: item.media_url || undefined,
            created_at: item.created_at,
            likes_count: item.like_count || 0,
            comments_count: item.comment_count || 0,
            user_has_liked: item.has_liked || false,
            is_connection: false,
            pinned_at: item.pinned_at,
            comments_disabled: item.comments_disabled,
            link_url: item.link_url || undefined,
            link_title: item.link_title || undefined,
            link_description: item.link_description || undefined,
            link_metadata: item.link_metadata || undefined,
          }}
          currentUserId={currentUserId}
          onUpdate={onUpdate}
          onCommentClick={handleCommentClick}
          showComments={showComments}
          feedItem={item}
        />
      );
  }
};

// Named export for backwards compatibility
export { UniversalFeedItemComponent as UniversalFeedItem };
