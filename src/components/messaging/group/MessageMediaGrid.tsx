/**
 * MessageMediaGrid - Responsive grid layout for visual media in message bubbles.
 *
 * Includes both images and videos. Videos render as a poster (or first-frame) with a
 * play badge overlay. Tapping any tile opens the unified lightbox carousel.
 *
 * Layouts: 1 full-width, 2 side-by-side, 3 one-on-top, 4+ as 2x2 grid with +N overlay.
 */

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaLightbox } from './MediaLightbox';
import type { MediaItem } from '@/types/groupMessaging';

interface MessageMediaGridProps {
  /** All visual media (images + videos) for this message */
  media: MediaItem[];
  /** Optional supplementary items (PDFs, etc.) to include in the lightbox carousel */
  extraLightboxItems?: MediaItem[];
  isOwn: boolean;
  /** Whether the viewer is allowed to download attachments. */
  canDownload?: boolean;
  /** Callback when the viewer chooses to reply to a specific attachment. */
  onReplyToMedia?: (item: MediaItem, index: number) => void;
}

function Tile({
  item,
  className,
  onClick,
}: {
  item: MediaItem;
  className?: string;
  onClick: () => void;
}) {
  const isVideo = item.type === 'video';
  const previewSrc = item.posterUrl || item.url;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('relative block overflow-hidden', className)}
      aria-label={isVideo ? `Play ${item.name}` : `Open ${item.name}`}
    >
      {isVideo ? (
        item.posterUrl ? (
          <img
            src={previewSrc}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <video
            src={item.url}
            className="h-full w-full object-cover"
            preload="metadata"
            muted
            playsInline
          />
        )
      ) : (
        <img
          src={item.url}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      )}
      {isVideo && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="rounded-full bg-black/60 p-2">
            <Play className="h-5 w-5 text-white" />
          </span>
        </span>
      )}
    </button>
  );
}

export function MessageMediaGrid({
  media,
  extraLightboxItems = [],
  isOwn: _isOwn,
  canDownload = true,
  onReplyToMedia,
}: MessageMediaGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visuals = media.filter((m) => m.type === 'image' || m.type === 'video');
  if (visuals.length === 0) return null;

  // Lightbox sees visuals first, then extras (e.g., PDFs) so paging stays intuitive.
  const lightboxItems = [...visuals, ...extraLightboxItems];

  const open = (i: number) => setLightboxIndex(i);
  const count = visuals.length;

  return (
    <>
      <div
        className={cn(
          'mt-1 max-w-[280px] overflow-hidden rounded-lg',
          count === 2 && 'grid grid-cols-2 gap-0.5',
          count === 3 && 'grid grid-cols-2 gap-0.5',
          count >= 4 && 'grid grid-cols-2 gap-0.5',
        )}
      >
        {count === 1 && (
          <Tile item={visuals[0]} className="max-h-[240px] w-full" onClick={() => open(0)} />
        )}

        {count === 2 &&
          visuals.map((m, i) => (
            <Tile key={i} item={m} className="h-[120px] w-full" onClick={() => open(i)} />
          ))}

        {count === 3 && (
          <>
            <Tile item={visuals[0]} className="col-span-2 h-[160px] w-full" onClick={() => open(0)} />
            {visuals.slice(1).map((m, i) => (
              <Tile key={i + 1} item={m} className="h-[100px] w-full" onClick={() => open(i + 1)} />
            ))}
          </>
        )}

        {count >= 4 &&
          visuals.slice(0, 4).map((m, i) => (
            <div key={i} className="relative">
              <Tile item={m} className="h-[100px] w-full" onClick={() => open(i)} />
              {i === 3 && count > 4 && (
                <button
                  type="button"
                  onClick={() => open(3)}
                  aria-label={`View all ${count} items`}
                  className="absolute inset-0 flex items-center justify-center bg-black/50"
                >
                  <span className="text-lg font-semibold text-white">+{count - 4}</span>
                </button>
              )}
            </div>
          ))}
      </div>

      {lightboxIndex !== null && (
        <MediaLightbox
          items={lightboxItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          canDownload={canDownload}
          onReply={
            onReplyToMedia
              ? (item, idx) => {
                  onReplyToMedia(item, idx);
                  setLightboxIndex(null);
                }
              : undefined
          }
        />
      )}
    </>
  );
}
