/**
 * Centralized image helper (Phase 2A).
 *
 * All Supabase Storage URLs should flow through `getOptimizedImageUrl` so
 * mobile clients never decode 2000px source files for a 40px avatar slot.
 *
 * Two call signatures are supported:
 *
 *   1. Bucket + path (use at upload sites that have just stored a file):
 *        getOptimizedImageUrl({ bucket, path }, 'avatar-md')
 *
 *   2. Existing public URL (use in render code where the DB row already
 *      contains a full URL such as profile.avatar_url):
 *        withImageTransform(profile.avatar_url, 'avatar-md')
 *
 * Implementation note: Supabase Storage image transforms are applied via
 * URL query params (`width`, `quality`, `resize`). The transforms feature
 * must be enabled on the project + bucket. If a URL is not a Supabase
 * Storage public URL (e.g. an external CDN, gravatar, etc.) the helper
 * passes it through unchanged.
 */
import { supabase } from '@/integrations/supabase/client';

export type ImageSize =
  | 'avatar-sm' // 64px - comments, message bubbles
  | 'avatar-md' // 128px - feed posts, connection cards
  | 'avatar-lg' // 256px - profile detail
  | 'cover-card' // 480px - event/opportunity/space cards
  | 'cover-hero' // 1080px - detail page heroes
  | 'thumb' // 240px - story thumbs, inline images
  | 'original'; // bypass - downloads/exports only

const SIZE_MAP: Record<
  Exclude<ImageSize, 'original'>,
  { width: number; quality: number }
> = {
  'avatar-sm': { width: 64, quality: 75 },
  'avatar-md': { width: 128, quality: 75 },
  'avatar-lg': { width: 256, quality: 80 },
  'cover-card': { width: 480, quality: 75 },
  'cover-hero': { width: 1080, quality: 80 },
  thumb: { width: 240, quality: 75 },
};

function applyTransform(rawUrl: string, size: ImageSize): string {
  if (size === 'original' || !rawUrl) return rawUrl;
  // Only transform Supabase Storage URLs. Pass through external URLs.
  if (!rawUrl.includes('/storage/v1/object/public/')) return rawUrl;

  try {
    const url = new URL(rawUrl);
    const { width, quality } = SIZE_MAP[size];
    // Supabase Storage exposes the transform endpoint at /render/image/public/
    url.pathname = url.pathname.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', String(quality));
    url.searchParams.set('resize', 'contain');
    return url.toString();
  } catch {
    return rawUrl;
  }
}

interface BucketRef {
  bucket: string;
  path: string;
}

export function getOptimizedImageUrl(
  refOrUrl: BucketRef | string | null | undefined,
  size: ImageSize = 'avatar-md'
): string {
  if (!refOrUrl) return '';
  if (typeof refOrUrl === 'string') return applyTransform(refOrUrl, size);
  const { data } = supabase.storage.from(refOrUrl.bucket).getPublicUrl(refOrUrl.path);
  return applyTransform(data.publicUrl, size);
}

/** Convenience alias for clarity at render sites that already hold a URL. */
export const withImageTransform = (
  url: string | null | undefined,
  size: ImageSize = 'avatar-md'
): string => getOptimizedImageUrl(url, size);
