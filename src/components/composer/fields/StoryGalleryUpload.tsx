import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/uploadMedia';

interface StoryGalleryUploadProps {
  galleryUrls: string[];
  onChange: (urls: string[]) => void;
}

export function StoryGalleryUpload({ galleryUrls, onChange }: StoryGalleryUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 25 * 1024 * 1024;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!validTypes.includes(file.type)) {
          toast({ title: 'Invalid file type', description: `${file.name} is not a supported image format`, variant: 'destructive' });
          continue;
        }
        if (file.size > maxSize) {
          toast({ title: 'File too large', description: `${file.name} is larger than 5MB`, variant: 'destructive' });
          continue;
        }

        const url = await uploadMedia(file, user.id, 'story-hero-images');
        newUrls.push(url);
      }

      if (newUrls.length > 0) {
        onChange([...galleryUrls, ...newUrls]);
        toast({ description: `${newUrls.length} image(s) added to gallery` });
      }
    } catch (error) {
      toast({ title: 'Upload failed', description: 'Some images could not be uploaded', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(galleryUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>Gallery Images (optional)</Label>

      {galleryUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {galleryUrls.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
              <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || galleryUrls.length >= 10}
        className="w-full"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4 mr-2" />
        )}
        {isUploading ? 'Uploading...' : `Add Gallery Images (${galleryUrls.length}/10)`}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
