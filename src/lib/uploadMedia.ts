import { supabase } from "@/integrations/supabase/client";
import { compressAndTinify } from "@/lib/compressImage";


export const uploadMedia = async (
  file: File, 
  userId: string, 
  bucket: 'user-posts' | 'profile-pictures' | 'profile-images' | 'event-images' | 'story-hero-images' | 'post-media'
) => {
  // Sanitize filename to avoid storage InvalidKey errors (remove diacritics/spaces)
  const normalize = (str: string) =>
    str
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // strip diacritics
      .replace(/[^a-zA-Z0-9._-]/g, '-') // allow alnum, dot, underscore, hyphen
      .replace(/-+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '');

  const origName = file.name || 'upload';
  const parts = origName.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  const base = normalize(parts.join('.')) || 'file';
  const safeExt = ['jpg','jpeg','png','webp','gif','mp4','webm'].includes(ext) ? ext : 'bin';
  const safeName = `${base}.${safeExt}`;

  const filePath = `${userId}/${Date.now()}-${safeName}`;

  // Diagnostics: is there a session at the moment of upload, and is the
  // storage request carrying it? (RLS rejections are indistinguishable
  // from auth loss without this.)
  const { data: s } = await supabase.auth.getSession();
  console.log('[uploadMedia] bucket=%s path=%s hasSession=%s tokenLen=%s sub=%s',
    bucket, filePath, !!s.session, s.session?.access_token?.length ?? 0,
    s.session?.user?.id ?? 'NONE');

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    console.error('[uploadMedia] upload FAILED bucket=%s path=%s hasSession=%s tokenLen=%s sub=%s error=%o',
      bucket, filePath, !!s.session, s.session?.access_token?.length ?? 0,
      s.session?.user?.id ?? 'NONE', error);
    throw error;
  }

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl.publicUrl;
};