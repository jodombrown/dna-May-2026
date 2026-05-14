import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/uploadMedia';

interface StoryImageUploadProps {
  currentImageUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}

export function StoryImageUpload({ currentImageUrl, onUpload, onRemove }: StoryImageUploadProps) {
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
        description: 'Please upload a JPG, PNG, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadMedia(file, user.id, 'story-hero-images');
      onUpload(url);
      toast({ description: 'Hero image uploaded successfully.' });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: "We couldn't upload that image. Try a smaller JPG or PNG.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (currentImageUrl) {
    return (
      <div className="space-y-2">
        <Label>Hero Image (optional)</Label>
        <div className="relative rounded-lg border border-border overflow-hidden">
          <img src={currentImageUrl} alt="Story hero" className="w-full h-40 object-cover" />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Change
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Hero Image (optional)</Label>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Uploading...</p>
            </>
          ) : (
            <>
              <ImagePlus className="h-8 w-8" />
              <p className="text-sm font-medium">Add Hero Image</p>
              <p className="text-xs">Landscape photos work best. JPG/PNG up to 5MB.</p>
            </>
          )}
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
