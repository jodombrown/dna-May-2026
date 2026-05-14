import React, { useState, useEffect } from 'react';
import { Globe, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoEmbedLightbox, isSupportedVideoUrl, getYouTubeThumbnail } from '@/components/feed/VideoEmbedLightbox';

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

interface LinkPreviewProps {
  preview: LinkPreviewData;
  isOwn: boolean;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({
  preview,
  isOwn,
}) => {
  const [videoLightboxOpen, setVideoLightboxOpen] = useState(false);
  const [showHeartbeat, setShowHeartbeat] = useState(true);

  // Stop heartbeat animation after 10 seconds (captures attention, then settles)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHeartbeat(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const isVideo = isSupportedVideoUrl(preview.url);
  const videoThumbnail = isVideo ? (preview.image || getYouTubeThumbnail(preview.url)) : null;

  // For video links, render as button that opens lightbox
  if (isVideo) {
    return (
      <>
        <button
          onClick={() => setVideoLightboxOpen(true)}
          className={cn(
            "block w-full text-left mt-2 rounded-lg border overflow-hidden transition-all hover:shadow-md",
            isOwn 
              ? "bg-primary-foreground/10 border-primary-foreground/20" 
              : "bg-background border-border"
          )}
        >
          {/* Video thumbnail with play overlay */}
          <div className="relative w-full h-32 overflow-hidden group">
            {videoThumbnail ? (
              <img 
                src={videoThumbnail} 
                alt={preview.title || 'Video preview'} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            {/* Play overlay - matching VideoLinkPreview style */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className={cn(
                "w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform",
                showHeartbeat && "animate-heartbeat"
              )}>
                <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className={cn(
              "flex items-center gap-1 text-xs mb-1",
              isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
            )}>
              <Globe className="h-3 w-3" />
              <span>{preview.siteName || getDomain(preview.url)}</span>
            </div>
            {preview.title && (
              <p className={cn(
                "text-sm font-medium line-clamp-2",
                isOwn ? "text-primary-foreground" : "text-foreground"
              )}>
                {preview.title}
              </p>
            )}
          </div>
        </button>
        <VideoEmbedLightbox
          open={videoLightboxOpen}
          onOpenChange={setVideoLightboxOpen}
          videoUrl={preview.url}
          title={preview.title || 'Video'}
        />
      </>
    );
  }

  // For non-video links, open externally
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block mt-2 rounded-lg border overflow-hidden transition-all hover:shadow-md",
        isOwn 
          ? "bg-primary-foreground/10 border-primary-foreground/20" 
          : "bg-background border-border"
      )}
    >
      {preview.image && (
        <div className="w-full h-32 overflow-hidden">
          <img 
            src={preview.image} 
            alt={preview.title || 'Link preview'} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-3">
        <div className={cn(
          "flex items-center gap-1 text-xs mb-1",
          isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
        )}>
          <Globe className="h-3 w-3" />
          <span>{preview.siteName || getDomain(preview.url)}</span>
        </div>
        {preview.title && (
          <p className={cn(
            "text-sm font-medium line-clamp-2",
            isOwn ? "text-primary-foreground" : "text-foreground"
          )}>
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className={cn(
            "text-xs line-clamp-2 mt-1",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
};
