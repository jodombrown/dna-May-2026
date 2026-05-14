import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/uploadMedia';

interface EventCoverUploadProps {
  currentImageUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

/**
 * EventCoverUpload - Cover image upload for events.
 */
export function EventCoverUpload({ currentImageUrl, onUpload, onRemove }: EventCoverUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or WebP image',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be under 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadMedia(file, user.id, 'event-images');
      onUpload(url);
      toast({ description: 'Cover image uploaded!' });
    } catch (error) {
      toast({ title: 'Upload failed', description: 'Please try again', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (currentImageUrl) {
    return (
      <div className="relative mt-2">
        <img src={currentImageUrl} alt="Event cover" className="w-full h-40 object-cover rounded-lg border" />
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div
        className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </div>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 mx-auto text-amber-400 mb-2" />
            <p className="text-sm text-muted-foreground">Drop image here or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">Recommended: 16:9 ratio (1200×675)</p>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
