/**
 * AudioBubble - Compact audio player for chat messages.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types/groupMessaging';

interface AudioBubbleProps {
  item: MediaItem;
  isOwn: boolean;
  /** When false, hides the native download control and blocks right-click save. */
  canDownload?: boolean;
}

function formatDuration(sec?: number): string | null {
  if (!sec || !Number.isFinite(sec)) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioBubble({ item, isOwn, canDownload = true }: AudioBubbleProps) {
  const duration = formatDuration(item.durationSec);
  return (
    <div
      className={cn(
        'mt-1 flex items-center gap-3 rounded-lg p-2 pr-3',
        isOwn ? 'bg-primary-foreground/10' : 'bg-background',
      )}
    >
      <audio
        src={item.url}
        controls
        preload="metadata"
        controlsList={canDownload ? undefined : 'nodownload noremoteplayback'}
        onContextMenu={(e) => {
          if (!canDownload) e.preventDefault();
        }}
        className="h-8 max-w-[220px]"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-xs font-medium',
            isOwn ? 'text-primary-foreground' : 'text-foreground',
          )}
        >
          {item.name}
        </p>
        {duration && (
          <p
            className={cn(
              'text-[10px]',
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
          >
            {duration}
          </p>
        )}
      </div>
    </div>
  );
}
