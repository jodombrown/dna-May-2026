import { useState, useCallback, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BANNER_GRADIENTS, BannerGradientKey, DEFAULT_GRADIENT } from "@/lib/constants/bannerGradients";
import { Loader2, Upload, Check, Move, ZoomIn, ZoomOut, RotateCcw, User } from "lucide-react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/utils/cropImage";
import { getErrorMessage } from '@/lib/errorLogger';

export interface BannerSaveData {
  type: 'gradient' | 'solid' | 'image';
  gradient?: string;
  url?: string;
  overlay: boolean;
}

interface BannerUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentBanner: {
    type: 'gradient' | 'solid' | 'image';
    value: string;
    overlay: boolean;
  };
  onUploadComplete: (data: BannerSaveData) => void;
  userDisplayName?: string;
  userAvatarUrl?: string;
}

export function BannerUploadModal({
  open,
  onOpenChange,
  userId,
  currentBanner,
  onUploadComplete,
  userDisplayName,
  userAvatarUrl
}: BannerUploadModalProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'gradients' | 'upload'>('gradients');
  const [selectedGradient, setSelectedGradient] = useState<BannerGradientKey>('dna');
  const [overlay, setOverlay] = useState(false);

  // Image cropping state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Banner aspect ratio (3:1 for wide banners)
  const BANNER_ASPECT_RATIO = 3 / 1;
  const MIN_IMAGE_WIDTH = 1200;
  const MIN_IMAGE_HEIGHT = 400;

  // Reset state when modal opens or currentBanner changes
  useEffect(() => {
    if (open) {
      setSelectedTab(currentBanner.type === 'image' ? 'upload' : 'gradients');
      setSelectedGradient(
        currentBanner.type === 'gradient' 
          ? (currentBanner.value as BannerGradientKey) || 'dna'
          : 'dna'
      );
      setOverlay(currentBanner.overlay);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open, currentBanner]);

  const onCropComplete = useCallback((_croppedArea: { x: number; y: number; width: number; height: number }, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
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

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Max 10MB", variant: "destructive" });
      return;
    }

    // Load image for cropping
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Check minimum dimensions
        if (img.width < MIN_IMAGE_WIDTH || img.height < MIN_IMAGE_HEIGHT) {
          toast({
            title: "Image too small",
            description: `Minimum ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px required. Your image is ${img.width}×${img.height}px.`,
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

  const handleClearImage = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      let bannerData: { type: 'gradient' | 'image'; value: string; overlay: boolean } = {
        type: selectedTab === 'gradients' ? 'gradient' : 'image',
        value: selectedTab === 'gradients' ? selectedGradient : '',
        overlay
      };

      if (selectedTab === 'upload' && imageSrc && croppedAreaPixels) {
        // Generate cropped image
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        const fileName = `${userId}/banner-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from('banners')
          .upload(fileName, croppedBlob, {
            upsert: true,
            contentType: 'image/png'
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('banners')
          .getPublicUrl(fileName);

        bannerData.value = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          banner_url: bannerData.type === 'image' ? bannerData.value : null,
          banner_type: bannerData.type,
          banner_gradient: bannerData.type === 'gradient' ? bannerData.value : null,
          banner_overlay: overlay
        })
        .eq('id', userId);

      if (error) throw error;

      // Pass the saved data back to parent for immediate state update
      onUploadComplete({
        type: bannerData.type as 'gradient' | 'image',
        gradient: bannerData.type === 'gradient' ? bannerData.value : undefined,
        url: bannerData.type === 'image' ? bannerData.value : undefined,
        overlay
      });
      
      toast({ title: "Success", description: "Banner updated!" });
      handleClearImage();
      onOpenChange(false);
    } catch (error: unknown) {
      toast({ title: "Error", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Group gradients by category for better organization
  const groupedGradients = useMemo(() => {
    const groups: Record<string, [string, typeof BANNER_GRADIENTS[BannerGradientKey]][]> = {
      brand: [],
      african: [],
      classic: []
    };
    Object.entries(BANNER_GRADIENTS).forEach(([key, gradient]) => {
      const category = gradient.category || 'classic';
      if (!groups[category]) groups[category] = [];
      groups[category].push([key, gradient]);
    });
    return groups;
  }, []);

  // Get current preview style
  const previewStyle = useMemo(() => {
    if (selectedTab === 'upload' && imageSrc) {
      return { backgroundImage: `url(${imageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    return { background: BANNER_GRADIENTS[selectedGradient]?.css || BANNER_GRADIENTS.dna.css };
  }, [selectedTab, imageSrc, selectedGradient]);

  const handleResetToDefault = () => {
    setSelectedTab('gradients');
    setSelectedGradient(DEFAULT_GRADIENT);
    setOverlay(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    toast({ title: "Reset", description: "Banner reset to default DNA gradient" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Your Banner</DialogTitle>
        </DialogHeader>

        {/* Live Profile Card Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="relative rounded-xl overflow-hidden border border-border shadow-sm">
            {/* Banner Preview */}
            <div 
              className="h-28 sm:h-32 relative"
              style={previewStyle}
            >
              {overlay && (
                <div className="absolute inset-0 bg-black/40" />
              )}
            </div>
            {/* Profile Info Preview */}
            <div className="relative bg-card px-4 pb-4 pt-12">
              {/* Avatar */}
              <div className="absolute -top-10 left-4">
                <div className="h-20 w-20 rounded-full border-4 border-card bg-muted overflow-hidden">
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              {/* Name */}
              <div className="ml-24">
                <p className="font-semibold text-foreground">{userDisplayName || 'Your Name'}</p>
                <p className="text-sm text-muted-foreground">DNA Member</p>
              </div>
            </div>
          </div>
          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToDefault}
            className="text-muted-foreground hover:text-foreground self-start"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'gradients' | 'upload')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gradients">Gradient Templates</TabsTrigger>
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
          </TabsList>

          <TabsContent value="gradients" className="space-y-6">
            {/* African Cultural Gradients */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-dna-emerald">African Cultural Themes</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {groupedGradients.african?.map(([key, gradient]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedGradient(key as BannerGradientKey)}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedGradient === key 
                        ? 'border-dna-emerald ring-2 ring-dna-emerald/20' 
                        : 'border-warm-neutral-200 hover:border-warm-neutral-300'
                    }`}
                    style={{ background: gradient.css }}
                  >
                    {selectedGradient === key && (
                      <div className="absolute top-1 right-1 bg-white rounded-full p-0.5">
                        <Check className="h-3 w-3 text-dna-emerald" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">
                      {gradient.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand & Classic Gradients */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Classic Themes</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...groupedGradients.brand || [], ...groupedGradients.classic || []].map(([key, gradient]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedGradient(key as BannerGradientKey)}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedGradient === key 
                        ? 'border-dna-emerald ring-2 ring-dna-emerald/20' 
                        : 'border-warm-neutral-200 hover:border-warm-neutral-300'
                    }`}
                    style={{ background: gradient.css }}
                  >
                    {selectedGradient === key && (
                      <div className="absolute top-1 right-1 bg-white rounded-full p-0.5">
                        <Check className="h-3 w-3 text-dna-emerald" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">
                      {gradient.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            {!imageSrc ? (
              <div className="flex flex-col items-center py-12">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="banner-upload"
                />
                <label
                  htmlFor="banner-upload"
                  className="cursor-pointer flex flex-col items-center gap-4 p-8 border-2 border-dashed border-warm-neutral-300 rounded-lg hover:border-dna-emerald transition-colors w-full"
                >
                  <Upload className="h-12 w-12 text-warm-neutral-400" />
                  <div className="text-center">
                    <p className="font-medium">Click to upload</p>
                    <p className="text-sm text-warm-neutral-600 mt-1">
                      Min 1200×400px • Max 10MB • JPG, PNG, WebP
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cropper */}
                <div className="relative h-64 sm:h-80 bg-warm-neutral-100 rounded-lg overflow-hidden">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={BANNER_ASPECT_RATIO}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    objectFit="horizontal-cover"
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

                {/* Change Image Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearImage}
                  className="w-full"
                >
                  Choose Different Image
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between p-4 bg-warm-neutral-50 rounded-lg">
          <div>
            <Label htmlFor="overlay" className="font-medium">Add Dark Overlay</Label>
            <p className="text-sm text-warm-neutral-600">Better text contrast</p>
          </div>
          <Switch id="overlay" checked={overlay} onCheckedChange={setOverlay} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={uploading || (selectedTab === 'upload' && !imageSrc)}
            className="bg-dna-emerald hover:bg-dna-forest"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Banner'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
