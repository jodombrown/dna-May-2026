/**
 * MediaLightbox - Full-screen carousel viewer for images, videos, audio, and PDFs.
 *
 * Features:
 * - Keyboard arrows (prev/next), Esc to close
 * - Touch swipe (page) and swipe-down (dismiss)
 * - Pinch / wheel / double-click zoom and drag-to-pan for images
 * - Inline native video controls (pause/resume, seek, mute toggle, fullscreen)
 * - Native audio controls
 * - Inline PDF preview with browser zoom (or fallback "Open file")
 * - Optional download gate: when canDownload is false the download button is
 *   hidden, browser PDF toolbar is suppressed, and pointer events for
 *   right-click save are blocked on images
 * - Optional reply action: when onReply is provided, a Reply button is shown
 *   that captures the current item index for anchored replies
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Reply,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types/groupMessaging';

interface MediaLightboxProps {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
  /** When false, the download button and inline browser save affordances are hidden. */
  canDownload?: boolean;
  /** When provided, a Reply button is rendered that calls back with the active item. */
  onReply?: (item: MediaItem, index: number) => void;
}

function isPdf(item: MediaItem): boolean {
  return item.mimeType === 'application/pdf' || /\.pdf$/i.test(item.name);
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface Transform {
  scale: number;
  tx: number;
  ty: number;
}

const RESET_TRANSFORM: Transform = { scale: 1, tx: 0, ty: 0 };

/** A self-contained zoom/pan wrapper for an image. */
function ZoomableImage({ src, alt, blockSave }: { src: string; alt: string; blockSave: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>(RESET_TRANSFORM);
  const dragRef = useRef<{ startX: number; startY: number; tx0: number; ty0: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);

  const clamp = (next: Transform): Transform => {
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale));
    if (scale === 1) return RESET_TRANSFORM;
    const el = containerRef.current;
    if (!el) return { ...next, scale };
    const w = el.clientWidth;
    const h = el.clientHeight;
    const maxX = ((scale - 1) * w) / 2;
    const maxY = ((scale - 1) * h) / 2;
    return {
      scale,
      tx: Math.max(-maxX, Math.min(maxX, next.tx)),
      ty: Math.max(-maxY, Math.min(maxY, next.ty)),
    };
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0025;
    setT((prev) => clamp({ ...prev, scale: prev.scale * (1 + delta) }));
  };

  const onDoubleClick = () => {
    setT((prev) => (prev.scale > 1 ? RESET_TRANSFORM : clamp({ ...prev, scale: 2 })));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (t.scale === 1) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx0: t.tx, ty0: t.ty };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setT((prev) =>
      clamp({ ...prev, tx: dragRef.current!.tx0 + dx, ty: dragRef.current!.ty0 + dy }),
    );
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    dragRef.current = null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { startDist: Math.hypot(dx, dy), startScale: t.scale };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchRef.current.startDist;
      setT((prev) => clamp({ ...prev, scale: pinchRef.current!.startScale * ratio }));
      e.preventDefault();
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
  };

  // Reset on src change
  useEffect(() => {
    setT(RESET_TRANSFORM);
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full select-none items-center justify-center overflow-hidden"
      onWheel={onWheel}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ cursor: t.scale > 1 ? 'grab' : 'zoom-in', touchAction: t.scale > 1 ? 'none' : 'auto' }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onContextMenu={(e) => {
          if (blockSave) e.preventDefault();
        }}
        className="max-h-full max-w-full object-contain transition-transform duration-100"
        style={{
          transform: `translate3d(${t.tx}px, ${t.ty}px, 0) scale(${t.scale})`,
        }}
      />
    </div>
  );
}

export function MediaLightbox({
  items,
  initialIndex,
  onClose,
  canDownload = true,
  onReply,
}: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const current = items[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, items.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't hijack swipe when more than one finger is down (pinch).
    if (e.touches.length !== 1) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = touchStartX - endX;
    const dy = endY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx > 0) goNext();
      else goPrev();
    } else if (dy > 100) {
      onClose();
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  if (!current) return null;

  const renderBody = () => {
    if (current.type === 'image') {
      return <ZoomableImage src={current.url} alt={current.name} blockSave={!canDownload} />;
    }
    if (current.type === 'video') {
      return (
        <video
          key={current.url}
          src={current.url}
          poster={current.posterUrl}
          controls
          autoPlay
          muted
          playsInline
          controlsList={canDownload ? undefined : 'nodownload noremoteplayback'}
          disablePictureInPicture={!canDownload}
          onContextMenu={(e) => {
            if (!canDownload) e.preventDefault();
          }}
          className="max-h-full max-w-full"
        />
      );
    }
    if (current.type === 'audio') {
      return (
        <div className="flex flex-col items-center gap-4 p-8 text-center text-white">
          <p className="text-sm font-medium">{current.name}</p>
          <audio
            src={current.url}
            controls
            autoPlay
            controlsList={canDownload ? undefined : 'nodownload'}
            className="w-[min(420px,90vw)]"
          />
        </div>
      );
    }
    if (isPdf(current)) {
      // #toolbar=0 hides Chrome's built-in download/print bar when downloads are gated.
      const pdfSrc = canDownload ? current.url : `${current.url}#toolbar=0`;
      return <iframe src={pdfSrc} title={current.name} className="h-full w-full bg-white" />;
    }
    // Generic doc fallback
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center text-white">
        <p className="text-sm font-medium">{current.name}</p>
        {canDownload ? (
          <Button asChild variant="secondary">
            <a href={current.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Open file
            </a>
          </Button>
        ) : (
          <p className="text-xs text-white/60">You don't have permission to open this file.</p>
        )}
      </div>
    );
  };

  const showZoomHint = current.type === 'image';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </Button>
        <span className="text-sm text-white/70">
          {currentIndex + 1} / {items.length}
        </span>
        <div className="flex items-center gap-1">
          {onReply && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReply(current, currentIndex)}
              className="text-white hover:bg-white/20"
              aria-label="Reply to this attachment"
            >
              <Reply className="h-5 w-5" />
            </Button>
          )}
          {canDownload ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              aria-label="Download"
            >
              <a href={current.url} target="_blank" rel="noopener noreferrer" download={current.name}>
                <Download className="h-5 w-5" />
              </a>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="cursor-not-allowed text-white/30"
              aria-label="Download not permitted"
              title="You don't have permission to download this file"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            className="absolute left-2 z-10 hidden text-white hover:bg-white/20 sm:flex"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        <div className="flex h-full w-full items-center justify-center">{renderBody()}</div>

        {currentIndex < items.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="absolute right-2 z-10 hidden text-white hover:bg-white/20 sm:flex"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Bottom info / hint */}
      <div className={cn('flex-shrink-0 px-4 py-3 text-center')}>
        <p className="truncate text-xs text-white/60">{current.name}</p>
        {showZoomHint && (
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-white/40">
            <ZoomIn className="h-3 w-3" /> Double-click, scroll, or pinch to zoom
            <ZoomOut className="h-3 w-3" />
          </p>
        )}
      </div>
    </div>
  );
}
