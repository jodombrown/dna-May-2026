import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { uploadMedia } from '@/lib/uploadMedia';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, X } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange: (url: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatarUrl, onAvatarChange }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large", 
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to Supabase Storage
      const url = await uploadMedia(file, user.id, 'profile-images');
      
      onAvatarChange(url);
      
      toast({
        title: "Upload successful",
        description: "Your profile picture has been uploaded.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });

      // Reset preview on error
      setPreviewUrl(currentAvatarUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = () => {
    setPreviewUrl(null);
    onAvatarChange('');
  };

  return (
    <div className="space-y-3">
      <Label>Profile Image</Label>
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center border-2 border-neutral-200">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-neutral-400 text-sm text-center">
                <Upload className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">No image</span>
              </div>
            )}
          </div>
          
          {previewUrl && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
              onClick={removeAvatar}
              disabled={uploading}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileUpload}
            className="hidden"
            id="avatar-upload"
            disabled={uploading}
          />
          <Label htmlFor="avatar-upload" className="cursor-pointer">
            <div className={`px-4 py-2 bg-dna-mint text-dna-forest rounded-lg hover:bg-dna-mint/80 transition-colors flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </div>
          </Label>
          <p className="text-xs text-neutral-500">
            JPEG, PNG, WebP, or GIF. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvatarUpload;