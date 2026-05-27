import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from '@/lib/errorLogger';

interface AvatarUploaderProps {
  value?: string;
  onUploaded: (url: string) => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const AvatarUploader: React.FC<AvatarUploaderProps> = ({ value, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const onFile = async (file: File) => {
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload a JPG or PNG image.", 
        variant: "destructive" 
      });
      return;
    }
    
    // Check file size
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast({ 
        title: "Image too large", 
        description: `This image is ${sizeMB}MB. Please upload a JPG or PNG under 5MB.`, 
        variant: "destructive" 
      });
      return;
    }

    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) {
      toast({ title: "Not signed in", description: "Please sign in to upload." });
      return;
    }

    setUploading(true);
    try {
      const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      // Storage RLS requires the first folder segment to equal auth.uid().
      const path = `${uid}/${Date.now()}_${clean}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl;
      onUploaded(url);
      toast({ title: "Uploaded", description: "Profile photo updated." });
    } catch (err: unknown) {
      toast({ title: "Upload failed", description: getErrorMessage(err) || "Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <img
        src={value || "/placeholder.svg"}
        alt="Profile photo preview"
        className="w-20 h-20 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-border"
        loading="lazy"
      />
      <label className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-input bg-background text-sm font-medium cursor-pointer hover:bg-muted transition-colors min-h-[44px] w-full sm:w-auto">
        {uploading ? "Uploading..." : "Choose photo"}
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
          disabled={uploading}
        />
      </label>
    </div>
  );
};

export default AvatarUploader;
