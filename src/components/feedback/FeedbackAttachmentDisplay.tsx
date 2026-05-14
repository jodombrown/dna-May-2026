import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import { feedbackService } from '@/services/feedbackService';
import type { FeedbackAttachment } from '@/types/feedback';
import { cn } from '@/lib/utils';

interface FeedbackAttachmentDisplayProps {
  attachment: FeedbackAttachment;
}

export function FeedbackAttachmentDisplay({ attachment }: FeedbackAttachmentDisplayProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const loadUrl = async () => {
      setIsLoading(true);
      // Use file_url if available, otherwise try to get signed URL for storage_path
      const urlToUse = attachment.file_url || (attachment.storage_path 
        ? await feedbackService.getAttachmentUrl(attachment.storage_path) 
        : null);
      setUrl(urlToUse);
      setIsLoading(false);
    };
    loadUrl();
  }, [attachment.file_url, attachment.storage_path]);

  if (isLoading || !url) {
    return (
      <div className="animate-pulse bg-muted h-16 w-24 rounded flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Check both file_type (database column) and attachment_type for compatibility
  const attachmentType = attachment.file_type || attachment.attachment_type;
  
  if (attachmentType === 'image') {
    return (
      <>
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="block max-w-xs rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
        >
          <img
            src={url}
            alt={attachment.file_name || 'Image attachment'}
            className="max-h-48 object-cover"
          />
        </button>

        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-4xl p-0 bg-black/90">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-2 right-2 text-white hover:text-neutral-300 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={url}
              alt={attachment.file_name || 'Image attachment'}
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (attachmentType === 'voice') {
    return <VoicePlayer url={url} duration={attachment.duration_seconds || 0} />;
  }

  if (attachmentType === 'video') {
    return <VideoPlayer url={url} />;
  }

  return null;
}

// Voice player component
function VoicePlayer({ url, duration }: { url: string; duration: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 bg-muted px-3 py-2 rounded-lg max-w-xs">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlay}
        className="h-8 w-8 p-0 shrink-0"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}

// Video player component
function VideoPlayer({ url }: { url: string }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <>
      <div className="relative max-w-xs rounded-lg overflow-hidden bg-black">
        <video
          src={url}
          className="max-h-48 object-cover cursor-pointer"
          onClick={() => setIsLightboxOpen(true)}
        />
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
        >
          <Play className="h-10 w-10 text-white" />
        </button>
      </div>

      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/90">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-2 right-2 text-white hover:text-neutral-300 z-10"
          >
            <X className="h-6 w-6" />
          </button>
          <video
            src={url}
            controls
            autoPlay
            className="w-full max-h-[90vh]"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
