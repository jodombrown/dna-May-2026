/**
 * MediaGalleryDrawer - Browse all shared media in a conversation
 * 
 * Tabs: Photos & Videos | Files
 * Uses ResponsiveModal for mobile drawer / desktop dialog.
 */

import React, { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Image, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { groupMessageService } from '@/services/groupMessageService';
import { MediaLightbox } from './MediaLightbox';
import type { MediaItem } from '@/types/groupMessaging';

interface MediaGalleryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
}

export function MediaGalleryDrawer({ open, onOpenChange, conversationId }: MediaGalleryDrawerProps) {
  const [lightboxImages, setLightboxImages] = useState<MediaItem[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Fetch all messages to extract media
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['group-messages-media', conversationId],
    queryFn: () => groupMessageService.getMessages(conversationId, 200),
    enabled: open && !!conversationId,
  });

  // Extract media from all messages
  const allMedia = messages.flatMap(m => m.media_urls || []);
  const images = allMedia.filter(m => m.type === 'image');
  const documents = allMedia.filter(m => m.type === 'document');

  const openLightbox = (index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <>
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Shared Media</ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="px-4 pb-4">
          <Tabs defaultValue="photos">
            <TabsList className="w-full">
              <TabsTrigger value="photos" className="flex-1 gap-1">
                <Image className="h-3.5 w-3.5" />
                Photos
              </TabsTrigger>
              <TabsTrigger value="files" className="flex-1 gap-1">
                <FileText className="h-3.5 w-3.5" />
                Files
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="mt-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <Image className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm">No shared photos yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 max-h-[400px] overflow-y-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(i)}
                      className="aspect-square overflow-hidden rounded-md"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm">No shared files yet</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {documents.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(doc.size)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ResponsiveModal>

      {lightboxImages && (
        <MediaLightbox
          items={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </>
  );
}
