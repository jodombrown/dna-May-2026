export type ConveyItemType = 'story' | 'update' | 'impact';
export type ConveyItemStatus = 'draft' | 'published' | 'archived';
export type ConveyItemVisibility = 'public' | 'members_only' | 'space_members_only';

export interface ConveyItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  type: ConveyItemType;
  status: ConveyItemStatus;
  visibility: ConveyItemVisibility;
  body: string;
  content?: string; // Alias for body (from posts table)
  author_id: string;
  primary_space_id: string | null;
  primary_event_id: string | null;
  primary_need_id: string | null;
  primary_offer_id: string | null;
  primary_badge_id: string | null;
  focus_areas: string[] | null;
  region: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  // Additional fields from posts table
  image_url?: string | null;
  gallery_urls?: string[] | null;
  story_type?: string | null;
}

export interface ConveyItemWithDetails extends ConveyItem {
  author?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    region?: string | null;
  };
  primary_space?: {
    id: string;
    name: string;
    tagline: string | null;
    slug: string;
    region?: string | null;
  };
  primary_event?: {
    id: string;
    title: string;
    start_time: string;
    format: string;
  };
}

export interface ConveyFilters {
  type?: ConveyItemType;
  region?: string;
  focusAreas?: string[];
  onlyMySpaces?: boolean;
  /**
   * Restrict to a single author. Added at DR1 step 7 (BD139): three surfaces
   * promised "My Stories" and none delivered it, because the feed had no way to
   * filter to the signed-in member.
   */
  authorId?: string;
}

export interface ConveyItemTag {
  id: string;
  convey_item_id: string;
  tag: string;
  created_at: string;
}
