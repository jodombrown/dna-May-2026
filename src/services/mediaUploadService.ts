/**
 * Media Upload Service for Messaging
 *
 * Handles file uploads to the message-media Supabase Storage bucket.
 * Supports images, video, audio, and a wide range of document types,
 * with per-type size caps and parallel uploads.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { MediaItem } from '@/types/groupMessaging';

// Per-type size caps (bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25 MB

// Maximum attachments per message
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/x-m4a',
];

const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/csv',
  'text/markdown',
];

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOC_TYPES,
];

function sanitizeFilename(name: string): string {
  return (
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '') || 'file'
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export type MediaKind = 'image' | 'video' | 'audio' | 'document';

export interface UploadProgress {
  status: 'validating' | 'uploading' | 'complete' | 'error';
  progress: number; // 0-100
  error?: string;
}

export const mediaUploadService = {
  isImage(file: Pick<File, 'type'>): boolean {
    return ALLOWED_IMAGE_TYPES.includes(file.type);
  },
  isVideo(file: Pick<File, 'type'>): boolean {
    return ALLOWED_VIDEO_TYPES.includes(file.type);
  },
  isAudio(file: Pick<File, 'type'>): boolean {
    return ALLOWED_AUDIO_TYPES.includes(file.type);
  },
  isDocument(file: Pick<File, 'type'>): boolean {
    return ALLOWED_DOC_TYPES.includes(file.type);
  },

  getMediaKind(file: Pick<File, 'type'>): MediaKind {
    if (this.isImage(file)) return 'image';
    if (this.isVideo(file)) return 'video';
    if (this.isAudio(file)) return 'audio';
    return 'document';
  },

  /**
   * Validate a file before upload. Returns null when valid, or an error message.
   */
  validateFile(file: File): string | null {
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return 'File type not supported. Try images, video, audio, PDFs, Office docs, CSV, TXT, or ZIP.';
    }
    const kind = this.getMediaKind(file);
    const cap =
      kind === 'image'
        ? MAX_IMAGE_SIZE
        : kind === 'video'
          ? MAX_VIDEO_SIZE
          : kind === 'audio'
            ? MAX_AUDIO_SIZE
            : MAX_DOC_SIZE;
    if (file.size > cap) {
      return `File too large. Max for ${kind} is ${formatBytes(cap)}.`;
    }
    return null;
  },

  /**
   * Generate a poster (data URL) from the first frame of a video file.
   * Best-effort: returns null on failure or unsupported environments.
   */
  async generateVideoPoster(file: File): Promise<{ poster: string; durationSec: number; width: number; height: number } | null> {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.src = URL.createObjectURL(file);

        const cleanup = () => {
          URL.revokeObjectURL(video.src);
        };

        video.onloadedmetadata = () => {
          // Seek a touch in to avoid black frames
          try {
            video.currentTime = Math.min(0.1, (video.duration || 0) / 2);
          } catch {
            // ignore
          }
        };

        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            const w = video.videoWidth || 320;
            const h = video.videoHeight || 240;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              cleanup();
              resolve(null);
              return;
            }
            ctx.drawImage(video, 0, 0, w, h);
            const poster = canvas.toDataURL('image/jpeg', 0.7);
            const out = {
              poster,
              durationSec: video.duration || 0,
              width: w,
              height: h,
            };
            cleanup();
            resolve(out);
          } catch {
            cleanup();
            resolve(null);
          }
        };

        video.onerror = () => {
          cleanup();
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  },

  /**
   * Read audio duration via metadata.
   */
  async getAudioDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      try {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = URL.createObjectURL(file);
        const cleanup = () => URL.revokeObjectURL(audio.src);
        audio.onloadedmetadata = () => {
          const d = audio.duration;
          cleanup();
          resolve(Number.isFinite(d) ? d : null);
        };
        audio.onerror = () => {
          cleanup();
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  },

  /**
   * Upload a file to message-media bucket
   */
  async uploadMessageMedia(
    file: File,
    conversationId: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<MediaItem> {
    onProgress?.({ status: 'validating', progress: 0 });
    const validationError = this.validateFile(file);
    if (validationError) {
      onProgress?.({ status: 'error', progress: 0, error: validationError });
      throw new Error(validationError);
    }

    onProgress?.({ status: 'uploading', progress: 10 });

    const safeName = sanitizeFilename(file.name);
    const ext = safeName.split('.').pop() || 'bin';
    const baseName = safeName.replace(`.${ext}`, '');
    const filePath = `${conversationId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${baseName}.${ext}`;

    // Best-effort enrichment for video / audio
    const kind = this.getMediaKind(file);
    let durationSec: number | undefined;
    let width: number | undefined;
    let height: number | undefined;
    let posterUrl: string | undefined;

    if (kind === 'video') {
      const meta = await this.generateVideoPoster(file);
      if (meta) {
        posterUrl = meta.poster;
        durationSec = meta.durationSec;
        width = meta.width;
        height = meta.height;
      }
    } else if (kind === 'audio') {
      const d = await this.getAudioDuration(file);
      if (d != null) durationSec = d;
    }

    onProgress?.({ status: 'uploading', progress: 40 });

    const { data, error } = await supabase.storage
      .from('message-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      logger.error('mediaUploadService', 'Upload failed', error);
      onProgress?.({ status: 'error', progress: 0, error: error.message });
      throw error;
    }

    onProgress?.({ status: 'uploading', progress: 85 });

    const { data: urlData } = supabase.storage
      .from('message-media')
      .getPublicUrl(data.path);

    onProgress?.({ status: 'complete', progress: 100 });

    const mediaItem: MediaItem = {
      url: urlData.publicUrl,
      type: kind,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      ...(width != null ? { width } : {}),
      ...(height != null ? { height } : {}),
      ...(durationSec != null ? { durationSec } : {}),
      ...(posterUrl ? { posterUrl } : {}),
    };

    return mediaItem;
  },

  /**
   * Upload multiple files in parallel.
   */
  async uploadMultiple(
    files: File[],
    conversationId: string,
    onProgress?: (index: number, progress: UploadProgress) => void,
  ): Promise<MediaItem[]> {
    return Promise.all(
      files.map((file, i) =>
        this.uploadMessageMedia(file, conversationId, (p) => onProgress?.(i, p)),
      ),
    );
  },
};
