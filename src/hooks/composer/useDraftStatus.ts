/**
 * useDraftStatus — state machine + relative-time tick for the composer
 * draft indicator and toast affordances.
 *
 * Inputs come from UniversalComposer (mode, content signal, savedAt). The
 * hook does NOT read localStorage directly on every render: hydration + writes
 * stay in the composer; this hook only mirrors them into UI states.
 *
 * States: hidden → saving → saved → idle, per PRD §3.2.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComposerMode } from '@/hooks/useUniversalComposer';

export type DraftSaveStatus = 'hidden' | 'saving' | 'saved' | 'idle';

export interface DraftMetadata {
  mode: ComposerMode;
  savedAt: string; // ISO 8601
  ttlDays: number;
}

interface UseDraftStatusArgs {
  /** True when at least one user-meaningful field is non-empty. */
  hasContent: boolean;
  /** Increments on every keystroke / formData mutation. */
  contentVersion: number;
  /** Epoch ms of last successful localStorage write, or null. */
  savedAt: number | null;
  /** Debounce window of the underlying autosave, ms. */
  debounceMs?: number;
  /** Confirmation window during which "Saved" persists before going idle. */
  savedHoldMs?: number;
}

export interface UseDraftStatusResult {
  status: DraftSaveStatus;
  savedAt: number | null;
  relativeTime: string;
}

export function useDraftStatus({
  hasContent,
  contentVersion,
  savedAt,
  debounceMs = 600,
  savedHoldMs = 2000,
}: UseDraftStatusArgs): UseDraftStatusResult {
  const [status, setStatus] = useState<DraftSaveStatus>('hidden');
  const [tick, setTick] = useState(0);
  const lastVersionRef = useRef(contentVersion);
  const lastSavedAtRef = useRef<number | null>(savedAt);

  // Drive saving/saved transitions from version + savedAt changes.
  useEffect(() => {
    if (!hasContent) {
      setStatus('hidden');
      return;
    }
    if (contentVersion !== lastVersionRef.current) {
      lastVersionRef.current = contentVersion;
      setStatus('saving');
      const t = setTimeout(() => {
        // After debounce window the composer's debounced save will have fired
        // and bumped savedAt — that effect below will flip us to "saved".
      }, debounceMs);
      return () => clearTimeout(t);
    }
  }, [contentVersion, hasContent, debounceMs]);

  useEffect(() => {
    if (savedAt && savedAt !== lastSavedAtRef.current) {
      lastSavedAtRef.current = savedAt;
      setStatus('saved');
      const t = setTimeout(() => setStatus('idle'), savedHoldMs);
      return () => clearTimeout(t);
    }
    if (!savedAt && hasContent && status === 'hidden') {
      setStatus('saving');
    }
  }, [savedAt, hasContent, savedHoldMs, status]);

  // Tick once a minute so relative time stays fresh.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const relativeTime = useMemo(() => formatRelative(savedAt), [savedAt, tick]);

  return { status, savedAt, relativeTime };
}

export function formatRelative(savedAt: number | null): string {
  if (!savedAt) return '';
  const seconds = Math.floor((Date.now() - savedAt) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
