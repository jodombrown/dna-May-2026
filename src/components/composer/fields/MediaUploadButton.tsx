import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/uploadMedia';

interface MediaUploadButtonProps {
  label?: string;
  onUpload: (url: string) => void;
  currentMediaUrl?: string;
  onRemove?: () => void;
}

export function MediaUploadButton({
  label = 'Add Media',
  onUpload,
  currentMediaUrl,
  onRemove,
}: MediaUploadButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
    const isImage = validImageTypes.includes(file.type);
    const isVideo = validVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, WebP, GIF image or MP4, WebM video.',
        variant: 'destructive',
      });
      return;
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: isVideo ? 'Please upload a video smaller than 50MB.' : 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadMedia(file, user.id, 'post-media');
      onUpload(url);
      toast({ description: `${isVideo ? 'Video' : 'Image'} uploaded successfully.` });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: "We couldn't upload that file. Please try again.",
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (currentMediaUrl) {
    const isVideo =
      currentMediaUrl.includes('.mp4') ||
      currentMediaUrl.includes('.webm') ||
      currentMediaUrl.includes('.mov');
    return (
      <div className="space-y-2">
        <Label>Media</Label>
        <div className="relative rounded-lg border border-border overflow-hidden">
          {isVideo ? (
            <video src={currentMediaUrl} className="w-full h-20 sm:h-40 object-cover" controls />
          ) : (
            <img src={currentMediaUrl} alt="Post media" className="w-full h-20 sm:h-40 object-cover" />
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Change
            </Button>
            {onRemove && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <ImagePlus className="w-4 h-4 mr-2" />
            {label}
          </>
        )}
      </Button>
    </div>
  );
}
