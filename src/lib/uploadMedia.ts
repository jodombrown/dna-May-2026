import { supabase } from "@/integrations/supabase/client";
import { compressAndTinify } from "@/lib/compressImage";

export type MediaClass = 'image' | 'video' | 'document';
export type Surface = 'post' | 'event' | 'story' | 'profile';

// The media matrix. A file is classified by its own MIME type against these
// three lists — the class is derived, never passed in, so a caller cannot
// mislabel a video as an image to sneak past a cap. Exported so the security
// suite can assert the live storage buckets' allowed_mime_types have not
// drifted from this one source of truth (a bucket edited by hand in the
// dashboard must fail CI).
export const IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heif',
];

export const VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
  'video/x-msvideo',
  'video/x-matroska',
];

export const DOC_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
];

const CAPS: Record<MediaClass, number> = {
  image: 25 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  document: 100 * 1024 * 1024,
};

// The accept matrix. Pickers consume this instead of restating the type lists —
// one source of truth so a picker can never drift from what uploadMedia accepts.
// profile is image-only on purpose: an avatar field that accepts a PDF is a bug,
// not generosity (BD303).
export const ACCEPT: Record<Surface, string> = {
  post:    [...IMAGE_TYPES, ...VIDEO_TYPES, ...DOC_TYPES].join(','),
  event:   [...IMAGE_TYPES, ...VIDEO_TYPES, ...DOC_TYPES].join(','),
  story:   [...IMAGE_TYPES, ...VIDEO_TYPES, ...DOC_TYPES].join(','),
  profile: IMAGE_TYPES.join(','),
};

const classify = (type: string): MediaClass | null => {
  if (IMAGE_TYPES.includes(type)) return 'image';
  if (VIDEO_TYPES.includes(type)) return 'video';
  if (DOC_TYPES.includes(type)) return 'document';
  return null;
};

export const uploadMedia = async (file: File, surface: Surface) => {
  // a. Classify by the file's own MIME type. No match means we don't accept it.
  const mediaClass = classify(file.type);
  if (!mediaClass) {
    throw new Error(`We can't accept ${file.type || 'that file type'} here yet.`);
  }

  // b. Session gate. Derive the storage folder from the live session, never from
  // a caller argument. RLS keys the path on auth.uid(); trusting a passed-in id
  // lets a stale/mismatched value write under someone else's prefix (or fail RLS
  // in a way indistinguishable from auth loss).
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user?.id;
  if (!uid) throw new Error('Your session has expired. Sign in again and retry the upload.');

  // d. Compress only real, canvas-safe images. HEIC/HEIF and GIFs are left
  // alone — the browser canvas path mangles HEIC and flattens GIF animation.
  let uploadFile = file;
  if (mediaClass === 'image' && file.type !== 'image/gif' && file.type !== 'image/heic') {
    try {
      uploadFile = await compressAndTinify(file, { maxDimension: 1920, maxSizeBytes: 5 * 1024 * 1024 });
    } catch {
      uploadFile = file;
    }
  }

  // c. Size gate: AFTER compression for images, BEFORE upload for video and
  // documents. Name the real numbers so the message is actionable (BD305).
  const cap = CAPS[mediaClass];
  if (uploadFile.size > cap) {
    const Class = mediaClass.charAt(0).toUpperCase() + mediaClass.slice(1);
    throw new Error(
      `That file is ${Math.round(uploadFile.size / 1048576)} MB. ${Class} files go up to ${Math.round(cap / 1048576)} MB here.`,
    );
  }

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
  // e. safeExt spans every class in the matrix: images, video and documents.
  const safeExt = [
    'jpg','jpeg','png','webp','gif','heic','heif',
    'mp4','webm','mov','m4v','avi','mkv',
    'pdf','ppt','pptx','doc','docx','xls','xlsx','csv','txt',
  ].includes(ext) ? ext : 'bin';
  const safeName = `${base}.${safeExt}`;

  // f. Path is scoped by uid and surface.
  const filePath = `${uid}/${surface}/${Date.now()}-${safeName}`;

  // g. One public bucket for all four surfaces in this pass.
  const bucket = 'dna-media-public';

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, uploadFile, {
    cacheControl: '3600',
    upsert: true,
    contentType: uploadFile.type || file.type || undefined,
  });

  // h. Keep the existing failure log unchanged.
  if (error) {
    console.error('[uploadMedia] upload FAILED bucket=%s path=%s uid=%s tokenLen=%s error=%o',
      bucket, filePath, uid, s.session?.access_token?.length ?? 0, error);
    throw error;
  }

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl.publicUrl;
};
