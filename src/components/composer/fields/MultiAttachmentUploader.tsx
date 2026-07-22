/**
 * MultiAttachmentUploader
 *
 * Composer-side multi-file attachment manager:
 *  - Multi-file image/video upload with per-file XHR progress + cancel/retry
 *  - Inline per-file validation messages (type, size, max count)
 *  - Full keyboard accessibility on the preview grid (Tab, Enter, Esc,
 *    Alt+ArrowLeft/Right to reorder)
 *  - Drag-and-drop reordering of done/uploading/errored tiles
 *  - Pending and errored uploads persist in IndexedDB across reloads so the
 *    user can resume / retry without re-picking files
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  FileVideo,
  ImagePlus,
  Loader2,
  RotateCw,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  deletePendingAttachment,
  listPendingAttachments,
  savePendingAttachment,
} from '@/lib/composerAttachmentStore';

const BUCKET = 'post-media';
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov'];
const DEFAULT_MAX_FILES = 6;

type AttachmentStatus = 'uploading' | 'done' | 'error' | 'cancelled';

export interface UploaderAttachment {
  id: string;
  name: string;
  kind: 'image' | 'video';
  previewUrl: string;
  url?: string;
  progress: number;
  status: AttachmentStatus;
  error?: string;
  size: number;
  _xhr?: XMLHttpRequest;
  _file?: File;
}

interface RejectedFile {
  id: string;
  name: string;
  reason: string;
}

interface MultiAttachmentUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

function detectKind(type: string, name: string): 'image' | 'video' | null {
  if (IMAGE_TYPES.includes(type)) return 'image';
  if (VIDEO_TYPES.includes(type)) return 'video';
  const lower = name.toLowerCase();
  if (/\.(jpe?g|png|webp|gif)$/.test(lower)) return 'image';
  if (/\.(mp4|webm|mov)$/.test(lower)) return 'video';
  return null;
}

function sanitize(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '') || 'file';
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export interface MultiAttachmentUploaderHandle {
  addFiles: (files: File[]) => void;
}

export const MultiAttachmentUploader = forwardRef<
  MultiAttachmentUploaderHandle,
  MultiAttachmentUploaderProps
>(function MultiAttachmentUploader({
  value,
  onChange,
  maxFiles = DEFAULT_MAX_FILES,
}, ref) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tileRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hydratedRef = useRef(false);

  const [items, setItems] = useState<UploaderAttachment[]>(() =>
    value.map((url) => {
      const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
      return {
        id: crypto.randomUUID(),
        name: url.split('/').pop() || 'attachment',
        kind: isVideo ? 'video' : 'image',
        previewUrl: url,
        url,
        progress: 1,
        status: 'done' as AttachmentStatus,
        size: 0,
      };
    }),
  );
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const syncOut = useCallback((next: UploaderAttachment[]) => {
    const urls = next.filter((a) => a.status === 'done' && a.url).map((a) => a.url!);
    onChange(urls);
  }, [onChange]);

  const persistItem = useCallback(async (it: UploaderAttachment, order: number) => {
    if (!user) return;
    if (it.status === 'done') return;
    if (!it._file) return;
    await savePendingAttachment({
      id: it.id,
      userId: user.id,
      name: it.name,
      kind: it.kind,
      size: it.size,
      status: it.status === 'uploading' ? 'cancelled' : it.status,
      error: it.error,
      order,
      file: it._file,
    });
  }, [user]);

  const updateItem = useCallback((id: string, patch: Partial<UploaderAttachment>) => {
    setItems((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      syncOut(next);
      const target = next.find((a) => a.id === id);
      const order = next.findIndex((a) => a.id === id);
      if (target) {
        if (target.status === 'done') {
          void deletePendingAttachment(id);
        } else if (target._file) {
          void persistItem(target, order);
        }
      }
      return next;
    });
  }, [syncOut, persistItem]);

  const startUpload = useCallback(async (item: UploaderAttachment) => {
    if (!user || !item._file) return;
    const file = item._file;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm'].includes(ext) ? ext : 'bin';
    const baseParts = file.name.split('.');
    if (baseParts.length > 1) baseParts.pop();
    const base = sanitize(baseParts.join('.'));
    const path = `${user.id}/${Date.now()}-${base}.${safeExt}`;

    try {
      const { data: signed, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);
      if (error || !signed) throw error || new Error('No signed URL');

      const xhr = new XMLHttpRequest();
      updateItem(item.id, { _xhr: xhr, status: 'uploading', progress: 0, error: undefined });

      xhr.open('PUT', signed.signedUrl, true);
      xhr.setRequestHeader('x-upsert', 'true');
      if (file.type) xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        updateItem(item.id, { progress: e.loaded / e.total });
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
          updateItem(item.id, {
            status: 'done',
            progress: 1,
            url: pub.publicUrl,
            previewUrl: pub.publicUrl,
            _xhr: undefined,
          });
        } else {
          updateItem(item.id, {
            status: 'error',
            error: `Upload failed (${xhr.status})`,
            _xhr: undefined,
          });
        }
      };
      xhr.onerror = () => {
        updateItem(item.id, { status: 'error', error: 'Network error', _xhr: undefined });
      };
      xhr.onabort = () => {
        updateItem(item.id, { status: 'cancelled', _xhr: undefined });
      };
      xhr.send(file);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      updateItem(item.id, { status: 'error', error: msg, _xhr: undefined });
    }
  }, [user, updateItem]);

  // Hydrate pending/errored items from IndexedDB on first mount.
  useEffect(() => {
    if (!user || hydratedRef.current) return;
    hydratedRef.current = true;
    void (async () => {
      const rows = await listPendingAttachments(user.id);
      if (rows.length === 0) return;
      const restored: UploaderAttachment[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        kind: r.kind,
        previewUrl: URL.createObjectURL(r.file),
        progress: 0,
        status: r.status === 'uploading' ? 'cancelled' : r.status,
        error: r.error || (r.status === 'uploading' ? 'Upload was interrupted' : undefined),
        size: r.size,
        _file: r.file,
      }));
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...restored.filter((r) => !seen.has(r.id))];
        return merged;
      });
    })();
  }, [user]);

  type ValidationResult =
    | { ok: true; kind: 'image' | 'video' }
    | { ok: false; reason: string };
  const validateFile = (file: File, slotsLeft: number): ValidationResult => {
    if (slotsLeft <= 0) {
      return { ok: false, reason: `Limit reached - up to ${maxFiles} files per post.` };
    }
    const kind = detectKind(file.type, file.name);
    if (!kind) {
      return { ok: false, reason: 'Unsupported format. Use JPG, PNG, WebP, GIF, MP4, WebM or MOV.' };
    }
    const max = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > max) {
      return {
        ok: false,
        reason: kind === 'video'
          ? `Video is ${formatBytes(file.size)} - max 50 MB.`
          : `Image is ${formatBytes(file.size)} - max 25 MB.`,
      };
    }
    return { ok: true, kind };
  };

  const addFiles = useCallback((files: File[]) => {
    if (!user) {
      setRejected([{ id: crypto.randomUUID(), name: '', reason: 'Please sign in to attach files.' }]);
      return;
    }
    const accepted: UploaderAttachment[] = [];
    const newRejected: RejectedFile[] = [];
    let slotsLeft = maxFiles - itemsRef.current.length;
    for (const file of files) {
      const v = validateFile(file, slotsLeft);
      if (v.ok === false) {
        newRejected.push({ id: crypto.randomUUID(), name: file.name, reason: v.reason });
        continue;
      }
      slotsLeft -= 1;
      accepted.push({
        id: crypto.randomUUID(),
        name: file.name,
        kind: v.kind,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: 'uploading',
        size: file.size,
        _file: file,
      });
    }
    if (newRejected.length) setRejected((prev) => [...newRejected, ...prev].slice(0, 6));
    if (accepted.length === 0) return;
    setItems((prev) => {
      const next = [...prev, ...accepted];
      accepted.forEach((it, i) => { void persistItem(it, prev.length + i); });
      return next;
    });
    accepted.forEach((it) => { void startUpload(it); });
  }, [user, maxFiles, startUpload, persistItem]);

  const handleCancel = useCallback((id: string) => {
    const it = itemsRef.current.find((a) => a.id === id);
    if (it?._xhr) it._xhr.abort();
  }, []);

  const handleRetry = useCallback((id: string) => {
    const it = itemsRef.current.find((a) => a.id === id);
    if (!it) return;
    if (!it._file) {
      updateItem(id, { status: 'error', error: 'Original file no longer available - remove and re-add.' });
      return;
    }
    updateItem(id, { status: 'uploading', progress: 0, error: undefined });
    void startUpload(it);
  }, [startUpload, updateItem]);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?._xhr) target._xhr.abort();
      if (target?.previewUrl?.startsWith('blob:')) {
        try { URL.revokeObjectURL(target.previewUrl); } catch { /* noop */ }
      }
      const next = prev.filter((a) => a.id !== id);
      syncOut(next);
      return next;
    });
    void deletePendingAttachment(id);
  }, [syncOut]);

  const move = useCallback((id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const [it] = next.splice(idx, 1);
      next.splice(target, 0, it);
      syncOut(next);
      // Re-persist pending items at their new order
      next.forEach((entry, order) => {
        if (entry.status !== 'done' && entry._file) void persistItem(entry, order);
      });
      // Restore focus to the moved tile
      requestAnimationFrame(() => {
        tileRefs.current[id]?.focus();
      });
      return next;
    });
  }, [syncOut, persistItem]);

  const reorderTo = useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setItems((prev) => {
      const from = prev.findIndex((a) => a.id === sourceId);
      const to = prev.findIndex((a) => a.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = prev.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      syncOut(next);
      next.forEach((entry, order) => {
        if (entry.status !== 'done' && entry._file) void persistItem(entry, order);
      });
      return next;
    });
  }, [syncOut, persistItem]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useImperativeHandle(ref, () => ({ addFiles }), [addFiles]);

  const accepted = useMemo(() => [...IMAGE_TYPES, ...VIDEO_TYPES].join(','), []);
  const slotsLeft = Math.max(0, maxFiles - items.length);

  const handleTileKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, a: UploaderAttachment) => {
    if (e.key === 'Escape') {
      // Dismiss any open status overlay by treating as cancel-of-cancellation:
      // for error/cancelled states, blur the tile so overlay focus is released.
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
      return;
    }
    if ((e.altKey || e.metaKey) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      move(a.id, e.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleRemove(a.id);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (a.status === 'error' || a.status === 'cancelled') handleRetry(a.id);
      else handleRemove(a.id);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accepted}
        multiple
        onChange={onPick}
        className="hidden"
      />

      {items.length > 0 && (
        <div
          className="grid grid-cols-3 gap-2"
          role="list"
          aria-label="Attachment previews"
        >
          {items.map((a, idx) => (
            <div
              key={a.id}
              role="listitem"
              tabIndex={0}
              ref={(el) => { tileRefs.current[a.id] = el; }}
              draggable
              onDragStart={(e) => {
                setDragId(a.id);
                e.dataTransfer.effectAllowed = 'move';
                try { e.dataTransfer.setData('text/plain', a.id); } catch { /* noop */ }
              }}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) reorderTo(dragId, a.id);
                setDragId(null);
              }}
              onDragEnd={() => setDragId(null)}
              onKeyDown={(e) => handleTileKeyDown(e, a)}
              aria-label={`Attachment ${idx + 1} of ${items.length}: ${a.name}. ${a.status}. Press Alt + arrow keys to reorder, Enter to ${a.status === 'error' || a.status === 'cancelled' ? 'retry' : 'remove'}, Delete to remove.`}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-grab',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-dna-emerald focus-visible:ring-offset-1',
                a.status === 'error' ? 'border-destructive' : 'border-border',
                dragId === a.id && 'opacity-50',
              )}
            >
              {a.kind === 'image' ? (
                <img src={a.previewUrl} alt={a.name} className="h-full w-full object-cover pointer-events-none" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-dna-stone/30 pointer-events-none">
                  <FileVideo className="h-8 w-8 text-dna-forest/60" />
                </div>
              )}

              {a.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                  <Loader2 className="h-5 w-5 animate-spin mb-1" />
                  <span className="text-[11px] tabular-nums">{Math.round(a.progress * 100)}%</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-1 h-6 px-2 text-[11px]"
                    onClick={() => handleCancel(a.id)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {a.status === 'error' && (
                <div className="absolute inset-0 bg-destructive/70 flex flex-col items-center justify-center text-white p-2 text-center">
                  <span className="text-[11px] mb-1 line-clamp-2">{a.error || 'Upload failed'}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => handleRetry(a.id)}
                    aria-label={`Retry uploading ${a.name}`}
                  >
                    <RotateCw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                </div>
              )}
              {a.status === 'cancelled' && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                  <span className="text-[11px] mb-1">{a.error || 'Cancelled'}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => handleRetry(a.id)}
                    aria-label={`Retry uploading ${a.name}`}
                  >
                    <RotateCw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                </div>
              )}

              {a.status === 'uploading' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                  <div
                    className="h-full bg-dna-emerald transition-[width] duration-150"
                    style={{ width: `${Math.round(a.progress * 100)}%` }}
                  />
                </div>
              )}

              {/* Reorder buttons - keyboard reachable via Tab */}
              <div className="absolute top-1 left-1 flex gap-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); move(a.id, -1); }}
                  disabled={idx === 0}
                  aria-label={`Move ${a.name} earlier`}
                  tabIndex={-1}
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); move(a.id, 1); }}
                  disabled={idx === items.length - 1}
                  aria-label={`Move ${a.name} later`}
                  tabIndex={-1}
                >
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>

              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={(e) => { e.stopPropagation(); handleRemove(a.id); }}
                aria-label={`Remove ${a.name}`}
                tabIndex={-1}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {slotsLeft > 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-dna-emerald hover:bg-dna-emerald/5 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-dna-emerald focus:outline-none focus-visible:ring-2 focus-visible:ring-dna-emerald"
              aria-label="Add more attachments"
            >
              <Upload className="h-5 w-5" />
              <span className="text-[11px]">Add more</span>
            </button>
          )}
        </div>
      )}

      {items.length === 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="w-4 h-4 mr-2" />
          Add attachments
        </Button>
      )}

      {rejected.length > 0 && (
        <ul
          aria-live="polite"
          className="space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-2"
        >
          {rejected.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-2 text-[11px] text-destructive">
              <span className="flex-1">
                {r.name && <span className="font-medium">{r.name}: </span>}
                {r.reason}
              </span>
              <button
                type="button"
                onClick={() => setRejected((prev) => prev.filter((x) => x.id !== r.id))}
                className="text-destructive/70 hover:text-destructive"
                aria-label="Dismiss error"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted-foreground">
        Up to {maxFiles} files. Images auto-optimize up to 25 MB, videos &lt;= 50 MB. Drag tiles or use Alt + arrow keys to reorder.
      </p>
    </div>
  );
});
