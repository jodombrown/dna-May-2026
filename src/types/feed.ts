/**
 * DNA | FEED - Unified Feed Type System
 * 
 * Defines the canonical types for the DNA universal feed.
 * All content types (posts, events, spaces, needs, stories) flow through this system.
 */

export type FeedItemType = 
  | 'post' 
  | 'reshare' 
  | 'event' 
  | 'space' 
  | 'need' 
  | 'story' 
  | 'community_post';

export type LinkedEntityType = 
  | 'event' 
  | 'space' 
  | 'need' 
  | 'story' 
  | 'community_post';

export type FeedTab = 'all' | 'for_you' | 'network' | 'my_posts' | 'bookmarks';
export type RankingMode = 'latest' | 'top';

/**
 * Normalized feed item returned from the universal feed query.
 * This is the canonical shape that all feed cards receive.
 */
export interface UniversalFeedItem {
  post_id: string;
  author_id: string;
  author_username: string;
  author_display_name: string;
  author_avatar_url: string | null;
  content: string;
  title: string | null;
  subtitle: string | null;
  media_url: string | null;
  post_type: FeedItemType;
  story_type: string | null;
  privacy_level: string;
  linked_entity_type: LinkedEntityType | null;
  linked_entity_id: string | null;
  space_id: string | null;
  space_title: string | null;
  event_id: string | null;
  event_title: string | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  reshare_count: number;
  view_count: number;
  bookmark_count: number;
  has_liked: boolean;
  has_bookmarked: boolean;
  has_reshared: boolean;
  // Pin and comment settings
  pinned_at: string | null;
  comments_disabled: boolean;
  // Video/Link metadata
  link_url: string | null;
  link_title: string | null;
  link_description: string | null;
  link_metadata: {
    embed_type?: string;
    provider_name?: string;
    thumbnail_url?: string;
    is_video?: boolean;
  } | null;
  // Original post data for reshares
  original_post_id: string | null;
  original_author_id: string | null;
  original_author_username: string | null;
  original_author_full_name: string | null;
  original_author_avatar_url: string | null;
  original_author_headline: string | null;
  original_content: string | null;
  original_image_url: string | null;
  original_created_at: string | null;
  // Gallery
  gallery_urls?: string[] | null;
}

/**
 * Filters for the universal feed query
 */
export interface FeedFilters {
  viewerId: string;
  tab?: FeedTab;
  authorId?: string;
  spaceId?: string;
  eventId?: string;
  hashtag?: string;
  postType?: FeedItemType;
  limit?: number;
  offset?: number;
  cursor?: string;
  rankingMode?: RankingMode;
}

/**
 * Author info extracted from feed item
 */
export interface FeedAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Context info (space or event) extracted from feed item
 */
export interface FeedContext {
  type: 'space' | 'event' | null;
  id: string | null;
  title: string | null;
}

/**
 * Props for UniversalFeed component
 */
export interface UniversalFeedProps {
  viewerId: string;
  tab?: FeedTab;
  authorId?: string;
  spaceId?: string;
  eventId?: string;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}
