import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SpaceFile {
  id: string;
  space_id: string;
  file_name: string;
  /** Storage object path inside the space-attachments bucket (NOT a URL) —
   *  the bucket's SELECT/DELETE policies join space_attachments.file_url to
   *  storage.objects.name, so this must stay a bare `${spaceId}/${name}` path. */
  file_url: string;
  file_size: number;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
}

const FILE_COLUMNS =
  'id, space_id, file_name, file_url, file_size, file_type, uploaded_by, created_at';
const BUCKET = 'space-attachments';

/** App-layer Free-tier cap per file (no DB/storage enforcement this cycle). */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Free-tier soft ceiling on a space's total stored bytes — flagged, not enforced. */
export const SPACE_STORAGE_SOFT_CAP_BYTES = 250 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Storage object names reject many special characters; keep the tail so the
 *  extension survives even for very long names. */
function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').slice(-100) || 'file';
}

function showError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
}

export function useSpaceFiles(spaceId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['space-files', spaceId];

  const filesQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<SpaceFile[]> => {
      const { data, error } = await supabase
        .from('space_attachments')
        .select(FILE_COLUMNS)
        .eq('space_id', spaceId!)
        .eq('attached_to_type', 'space')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SpaceFile[];
    },
    enabled: !!spaceId,
  });

  const files = filesQuery.data ?? [];
  const totalBytes = files.reduce((sum, f) => sum + (f.file_size ?? 0), 0);
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  // The bucket is private, so image previews need signed URLs; one batch call
  // covers every image in the list and is refreshed before the URLs lapse.
  const imagePaths = files
    .filter((f) => f.file_type?.startsWith('image/'))
    .map((f) => f.file_url);
  const thumbsQuery = useQuery({
    queryKey: ['space-file-thumbs', spaceId, imagePaths],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(imagePaths, 3600);
      if (error) throw error;
      return Object.fromEntries(
        (data ?? [])
          .filter((d) => d.path && d.signedUrl)
          .map((d) => [d.path as string, d.signedUrl]),
      );
    },
    enabled: imagePaths.length > 0,
    staleTime: 55 * 60 * 1000,
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(
          `"${file.name}" is ${formatBytes(file.size)} — files can be up to 25 MB on the Free plan.`,
        );
      }
      // First path segment must be the space id: the bucket's INSERT policy
      // checks it, and the metadata row's file_url must match the object name.
      const path = `${spaceId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('space_attachments').insert({
        space_id: spaceId!,
        attached_to_type: 'space',
        attached_to_id: spaceId!,
        file_name: file.name,
        file_url: path,
        file_size: file.size,
        file_type: file.type || null,
        uploaded_by: user!.id,
      });
      if (insertError) {
        // An object without a metadata row is unreadable — clear the orphan (best effort).
        await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
        throw insertError;
      }
    },
    onSuccess: invalidate,
    onError: showError,
  });

  const deleteFile = useMutation({
    mutationFn: async (file: SpaceFile) => {
      // RLS silently deletes zero rows when the caller lacks rights, so
      // surface that as an explicit error instead of a phantom success.
      const { data, error } = await supabase
        .from('space_attachments')
        .delete()
        .eq('id', file.id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Only the uploader or a space lead can delete this file.');
      }
      // Row first, object second: a row-less object is unreadable anyway, and
      // an object-delete failure must not resurrect the row. Best effort.
      await supabase.storage.from(BUCKET).remove([file.file_url]).catch(() => undefined);
    },
    onSuccess: () => {
      invalidate();
      toast.success('File deleted.');
    },
    onError: showError,
  });

  /** Download via a short-lived signed URL — the bucket is private. */
  const openFile = async (file: SpaceFile) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.file_url, 60);
    if (error || !data?.signedUrl) {
      showError(error ?? new Error('Could not create a download link. Please try again.'));
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return {
    files,
    totalBytes,
    thumbnails: thumbsQuery.data ?? {},
    isLoading: filesQuery.isLoading,
    isError: filesQuery.isError,
    uploadFile,
    deleteFile,
    openFile,
  };
}
