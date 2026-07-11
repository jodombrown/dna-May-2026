/**
 * DNA | FEED - Canonical row mapper
 *
 * Single source of truth for converting a row returned by the
 * `get_universal_feed` RPC into a `UniversalFeedItem`. Every feed surface
 * (All / For You / Mine / profile / space / event) MUST go through this
 * function so that the same post is shaped identically everywhere.
 *
 * If you find yourself adding a tab-specific override, stop. Either fix the
 * RPC or extend this mapper - never invent a new shape per call site.
 */

import type {
  FeedItemType,
  LinkedEntityType,
  UniversalFeedItem,
} from '@/types/feed';

/** Raw row shape from get_universal_feed (loose - matches what the RPC returns). */
export interface FeedRpcRow {
  id?: string;
  post_id?: string;
  author_id: string;
  author_username?: string | null;
  author_full_name?: string | null;
  author_display_name?: string | null;
  author_avatar_url?: string | null;
  content?: string | null;
  title?: string | null;
  subtitle?: string | null;
  image_url?: string | null;
  media_url?: string | null;
  gallery_urls?: string[] | null;
  slug?: string | null;
  post_type?: string | null;
  story_type?: string | null;
  privacy_level?: string | null;
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
  space_id?: string | null;
  space_title?: string | null;
  event_id?: string | null;
  event_title?: string | null;
  created_at: string;
  updated_at?: string | null;
  likes_count?: number | string | null;
  comments_count?: number | string | null;
  share_count?: number | string | null;
  reshare_count?: number | string | null;
  view_count?: number | string | null;
  bookmark_count?: number | string | null;
  user_has_liked?: boolean | null;
  user_has_bookmarked?: boolean | null;
  user_has_reshared?: boolean | null;
  pinned_at?: string | null;
  comments_disabled?: boolean | null;
  link_url?: string | null;
  link_title?: string | null;
  link_description?: string | null;
  link_metadata?: Record<string, unknown> | null;
  original_post_id?: string | null;
  original_author_id?: string | null;
  original_author_username?: string | null;
  original_author_full_name?: string | null;
  original_author_avatar_url?: string | null;
  original_author_headline?: string | null;
  original_content?: string | null;
  original_image_url?: string | null;
  original_created_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const mapFeedRow = (row: FeedRpcRow): UniversalFeedItem => {
  const linkMetadata = (row.link_metadata as UniversalFeedItem['link_metadata']) ?? null;
  const metadata = row.metadata ?? null;
  const facet = (key: string): string | null => {
    const v = metadata?.[key];
    return typeof v === 'string' && v.trim().length > 0 ? v : null;
  };

  return {
    post_id: (row.post_id ?? row.id ?? '') as string,
    author_id: row.author_id,
    author_username: row.author_username ?? 'unknown',
    author_display_name: row.author_display_name ?? row.author_full_name ?? 'Unknown User',
    author_avatar_url: row.author_avatar_url ?? null,
    content: row.content ?? '',
    title: row.title ?? null,
    subtitle: row.subtitle ?? null,
    media_url: row.media_url ?? row.image_url ?? null,
    post_type: (row.post_type ?? 'post') as FeedItemType,
    story_type: row.story_type ?? null,
    privacy_level: row.privacy_level ?? 'public',
    linked_entity_type: (row.linked_entity_type as LinkedEntityType | null) ?? null,
    linked_entity_id: row.linked_entity_id ?? null,
    space_id: row.space_id ?? null,
    space_title: row.space_title ?? null,
    event_id: row.event_id ?? null,
    event_title: row.event_title ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    slug: row.slug ?? null,
    like_count: toNumber(row.likes_count),
    comment_count: toNumber(row.comments_count),
    share_count: toNumber(row.share_count),
    reshare_count: toNumber(row.reshare_count),
    view_count: toNumber(row.view_count),
    bookmark_count: toNumber(row.bookmark_count),
    has_liked: !!row.user_has_liked,
    has_bookmarked: !!row.user_has_bookmarked,
    has_reshared: !!row.user_has_reshared,
    pinned_at: row.pinned_at ?? null,
    comments_disabled: !!row.comments_disabled,
    link_url: row.link_url ?? null,
    link_title: row.link_title ?? null,
    link_description: row.link_description ?? null,
    link_metadata: linkMetadata,
    original_post_id: row.original_post_id ?? null,
    original_author_id: row.original_author_id ?? null,
    original_author_username: row.original_author_username ?? null,
    original_author_full_name: row.original_author_full_name ?? null,
    original_author_avatar_url: row.original_author_avatar_url ?? null,
    original_author_headline: row.original_author_headline ?? null,
    original_content: row.original_content ?? null,
    original_image_url: row.original_image_url ?? null,
    original_created_at: row.original_created_at ?? null,
    gallery_urls: row.gallery_urls ?? null,
    metadata,
    // Connect facets — flattened so cards read them straight off the item.
    intent: facet('intent'),
    direction:
      metadata?.direction === 'offering'
        ? 'offering'
        : metadata?.direction === 'seeking'
          ? 'seeking'
          : null,
    sector: facet('sector'),
    where: facet('where'),
  };
};
