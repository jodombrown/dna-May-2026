export type PostType = 'update' | 'article' | 'question' | 'celebration' | 'text' | 'image' | 'video' | 'link' | 'poll' | 'opportunity' | 'spotlight';
export type PrivacyLevel = 'public' | 'connections';

export interface Post {
  id: string;
  author_id: string;
  content: string;
  post_type: PostType;
  privacy_level: PrivacyLevel;
  image_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface PostWithAuthor {
  post_id: string;
  author_id: string;
  author_username: string;
  author_full_name: string;
  author_avatar_url?: string;
  author_headline?: string;
  content: string;
  post_type: PostType;
  privacy_level: PrivacyLevel;
  image_url?: string;
  gallery_urls?: string[] | null;
  link_url?: string;
  link_title?: string;
  link_description?: string;
  created_at: string;
  edited_at?: string | null;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  is_connection: boolean;
  // Pin and comment settings
  pinned_at?: string | null;
  comments_disabled?: boolean;
  // Link/Video metadata
  link_metadata?: {
    embed_type?: string;
    provider_name?: string;
    thumbnail_url?: string;
    is_video?: boolean;
  };
  // Repost/share fields
  original_post_id?: string;
  shared_by?: string;
  share_commentary?: string;
  // Original post data (when this is a repost)
  original_author_id?: string;
  original_author_username?: string;
  original_author_full_name?: string;
  original_author_avatar_url?: string;
  original_author_headline?: string;
  original_content?: string;
  original_image_url?: string;
  original_created_at?: string;
  slug?: string | null;
}

export interface PostComment {
  comment_id: string;
  author_id: string;
  author_username: string;
  author_full_name: string;
  author_avatar_url?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PostLiker {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  liked_at: string;
}

export interface CreatePostInput {
  content: string;
  post_type: PostType;
  privacy_level: PrivacyLevel;
  image_url?: string;
  link_url?: string;
  link_title?: string;
  link_description?: string;
}
