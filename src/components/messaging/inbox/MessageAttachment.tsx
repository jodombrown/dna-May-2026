import React, { useState, useEffect } from 'react';
import { FileText, Download, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageLightbox } from './ImageLightbox';
import { VideoEmbedLightbox, isSupportedVideoUrl, getYouTubeThumbnail } from '@/components/feed/VideoEmbedLightbox';

interface AttachmentData {
  type: 'image' | 'file' | 'video' | 'voice';
  url: string;
  filename?: string;
  filesize?: number;
  mimetype?: string;
  thumbnail_url?: string;
  duration?: number;
}

interface MessageAttachmentProps {
  attachment: AttachmentData;
  isOwn: boolean;
  /** Phase 11 - search highlight integration */
  searchQuery?: string;
}

const renderHighlighted = (text: string, query?: string): React.ReactNode => {
  const q = (query ?? '').trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) { out.push(text.slice(i)); break; }
    if (idx > i) out.push(text.slice(i, idx));
    out.push(
      <mark key={`hl-${key++}`} className="bg-primary/25 text-foreground rounded-sm px-0.5">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    );
    i = idx + needle.length;
  }
  return <>{out}</>;
};

export const MessageAttachment: React.FC<MessageAttachmentProps> = ({
  attachment,
  isOwn,
  searchQuery,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoLightboxOpen, setVideoLightboxOpen] = useState(false);
  const [showHeartbeat, setShowHeartbeat] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Stop heartbeat animation after 10 seconds (captures attention, then settles)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHeartbeat(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Preload image for faster lightbox
  useEffect(() => {
    if (attachment.type === 'image' && attachment.url) {
      const img = new Image();
      img.src = attachment.url;
      img.onload = () => setImageLoaded(true);
    }
  }, [attachment.type, attachment.url]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check if this is a video link
  const isVideo = attachment.type === 'video' || 
    (attachment.type === 'file' && attachment.url && isSupportedVideoUrl(attachment.url));

  if (isVideo) {
    const thumbnailUrl = attachment.thumbnail_url || getYouTubeThumbnail(attachment.url);
    
    return (
      <>
        <button
          onClick={() => setVideoLightboxOpen(true)}
          className={cn(
            "relative block mt-2 rounded-lg overflow-hidden max-w-[280px] cursor-pointer group",
            showHeartbeat && "animate-image-heartbeat"
          )}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-auto object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {/* Play overlay - matching VideoLinkPreview style */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors rounded-lg">
            <div className={cn(
              "w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform",
              showHeartbeat && "animate-heartbeat"
            )}>
              <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        </button>
        <VideoEmbedLightbox
          open={videoLightboxOpen}
          onOpenChange={setVideoLightboxOpen}
          videoUrl={attachment.url}
          title={attachment.filename || 'Video'}
        />
      </>
    );
  }

  if (attachment.type === 'image') {
    return (
      <>
        <button 
          onClick={() => setLightboxOpen(true)}
          className={cn(
            "block mt-2 rounded-lg overflow-hidden max-w-[280px] cursor-pointer",
            showHeartbeat && "animate-image-heartbeat"
          )}
        >
          <img 
            src={attachment.url} 
            alt={attachment.filename || 'Image'} 
            className="w-full h-auto object-cover rounded-lg hover:opacity-90 transition-opacity"
            loading="eager"
          />
        </button>
        <ImageLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={attachment.url}
          filename={attachment.filename}
        />
      </>
    );
  }

  // File attachment
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 mt-2 p-3 rounded-lg border transition-colors",
        isOwn 
          ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" 
          : "bg-background border-border hover:bg-muted"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg",
        isOwn ? "bg-primary-foreground/20" : "bg-muted"
      )}>
        <FileText className={cn(
          "h-5 w-5",
          isOwn ? "text-primary-foreground" : "text-muted-foreground"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isOwn ? "text-primary-foreground" : "text-foreground"
        )}>
          {renderHighlighted(attachment.filename || 'File', searchQuery)}
        </p>
        {attachment.filesize && (
          <p className={cn(
            "text-xs",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {formatFileSize(attachment.filesize)}
          </p>
        )}
      </div>
      <Download className={cn(
        "h-4 w-4 flex-shrink-0",
        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
      )} />
    </a>
  );
};