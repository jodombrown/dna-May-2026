import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Move, ZoomIn, ZoomOut } from "lucide-react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/utils/cropImage";
import { getErrorMessage } from '@/lib/errorLogger';

// Minimum image dimensions for profile photos
const MIN_IMAGE_SIZE = 200;

interface AvatarUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string;
  userId: string;
  onUploadComplete: (url: string) => void;
}

export function AvatarUploadModal({
  open,
  onOpenChange,
  currentAvatarUrl,
  userId,
  onUploadComplete
}: AvatarUploadModalProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type)) {
      toast({ title: "Error", description: "Please upload JPG, PNG, WebP, or HEIC", variant: "destructive" });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "Error", description: "Max 25MB", variant: "destructive" });
      return;
    }


    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Check minimum dimensions
        if (img.width < MIN_IMAGE_SIZE || img.height < MIN_IMAGE_SIZE) {
          toast({
            title: "Image too small",
            description: `Minimum ${MIN_IMAGE_SIZE}×${MIN_IMAGE_SIZE}px required. Your image is ${img.width}×${img.height}px.`,
            variant: "destructive"
          });
          return;
        }
        setImageSrc(reader.result as string);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Compress image to reduce file size for faster mobile loading
  const compressImage = async (blob: Blob, maxSizeKB: number = 300): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Target 400x400 for avatars - good quality, small size
        const targetSize = 400;
        canvas.width = targetSize;
        canvas.height = targetSize;
        
        ctx?.drawImage(img, 0, 0, targetSize, targetSize);
        
        // Convert to JPEG with quality compression
        canvas.toBlob(
          (compressedBlob) => {
            resolve(compressedBlob || blob);
          },
          'image/jpeg',
          0.85 // 85% quality - good balance
        );
      };
      
      img.src = URL.createObjectURL(blob);
    });
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // Compress the image for faster loading on mobile
      const compressedBlob = await compressImage(croppedBlob);
      const fileName = `${userId}/avatar-${Date.now()}.jpeg`;

      // Use profile-images bucket (standardized)
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, compressedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          avatar_position: { x: crop.x, y: crop.y, zoom }
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      onUploadComplete(publicUrl);
      toast({ title: "Success", description: "Avatar updated!" });
      onOpenChange(false);
      setImageSrc(null);
    } catch (error: unknown) {
      toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Profile Photo</DialogTitle>
        </DialogHeader>

        {!imageSrc ? (
          <div className="flex flex-col items-center py-12">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={handleFileSelect}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer flex flex-col items-center gap-4 p-8 border-2 border-dashed border-warm-neutral-300 rounded-lg hover:border-dna-emerald transition-colors w-full"
            >
              <Upload className="h-12 w-12 text-warm-neutral-400" />
              <div className="text-center">
                <p className="font-medium">Click to upload</p>
                <p className="text-sm text-warm-neutral-600 mt-1">
                  Min 200×200px • Max 5MB • JPG, PNG, WebP
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cropper */}
            <div className="relative h-80 sm:h-96 bg-warm-neutral-100 rounded-lg overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Instructions */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Move className="h-4 w-4 flex-shrink-0" />
              <span>Drag to reposition • Pinch or use slider to zoom</span>
            </div>

            {/* Zoom Controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                  min={1}
                  max={3}
                  step={0.1}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImageSrc(null)}>
                Choose Different
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-dna-emerald hover:bg-dna-forest"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Photo'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
