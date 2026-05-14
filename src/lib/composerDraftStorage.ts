/**
 * Composer local draft storage
 *
 * Persists per-mode partial form data in localStorage so a refresh, accidental
 * tab close, or navigation away does not destroy in-progress posts/events.
 *
 * Keyed by user + mode. Drafts older than DRAFT_TTL_MS are ignored on read
 * and lazily cleaned up. The composer is the sole writer; mode handlers
 * clear the relevant key after a successful submit.
 */

import type { ComposerMode, ComposerFormData } from '@/hooks/useUniversalComposer';

const STORAGE_PREFIX = 'dna.composer.draft.v1';
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface StoredDraft {
  savedAt: number;
  data: ComposerFormData;
}

function key(userId: string, mode: ComposerMode): string {
  return `${STORAGE_PREFIX}.${userId}.${mode}`;
}

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

/**
 * True when the form has any user-supplied content worth saving.
 * Avoids littering storage with empty objects from default values.
 */
function hasMeaningfulContent(data: ComposerFormData): boolean {
  if (data.content && data.content.trim().length > 0) return true;
  if (data.title && data.title.trim().length > 0) return true;
  if (data.subtitle && data.subtitle.trim().length > 0) return true;
  if (data.mediaUrl) return true;
  if (data.heroImage) return true;
  if (data.galleryUrls && data.galleryUrls.length > 0) return true;
  if (data.eventDate || data.eventTime || data.location || data.meetingUrl) return true;
  if (data.agenda && data.agenda.length > 0) return true;
  if (data.tags && data.tags.length > 0) return true;
  return false;
}

export function saveDraft(
  userId: string,
  mode: ComposerMode,
  data: ComposerFormData,
): void {
  if (!isStorageAvailable() || !userId) return;
  try {
    if (!hasMeaningfulContent(data)) {
      window.localStorage.removeItem(key(userId, mode));
      return;
    }
    const payload: StoredDraft = { savedAt: Date.now(), data };
    window.localStorage.setItem(key(userId, mode), JSON.stringify(payload));
  } catch {
    // Quota exceeded or serialization failure - silently ignore
  }
}

export function loadDraft(
  userId: string,
  mode: ComposerMode,
): ComposerFormData | null {
  return loadDraftWithMeta(userId, mode)?.data ?? null;
}

export interface LoadedDraft {
  data: ComposerFormData;
  savedAt: number;
}

export function loadDraftWithMeta(
  userId: string,
  mode: ComposerMode,
): LoadedDraft | null {
  if (!isStorageAvailable() || !userId) return null;
  try {
    const raw = window.localStorage.getItem(key(userId, mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(key(userId, mode));
      return null;
    }
    if (!hasMeaningfulContent(parsed.data)) return null;
    return { data: parsed.data, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function clearDraft(userId: string, mode: ComposerMode): void {
  if (!isStorageAvailable() || !userId) return;
  try {
    window.localStorage.removeItem(key(userId, mode));
  } catch {
    // Ignore
  }
}

export function clearAllDrafts(userId: string): void {
  if (!isStorageAvailable() || !userId) return;
  try {
    const prefix = `${STORAGE_PREFIX}.${userId}.`;
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    for (const k of toRemove) window.localStorage.removeItem(k);
  } catch {
    // Ignore
  }
}
