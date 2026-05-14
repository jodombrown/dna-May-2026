import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useMessageDraft - per-conversation composer draft persistence (localStorage).
 *
 * - Restores typed but unsent text when the user returns to a thread.
 * - Debounces writes so we don't hammer storage on every keystroke.
 * - `clear()` should be called after a successful send.
 */
const STORAGE_PREFIX = 'dna:msg-draft:';
const SAVE_DEBOUNCE_MS = 250;

export function useMessageDraft(conversationId: string | null | undefined) {
  const key = conversationId ? `${STORAGE_PREFIX}${conversationId}` : null;
  const [draft, setDraftState] = useState<string>('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore on mount / when conversation changes
  useEffect(() => {
    if (!key) {
      setDraftState('');
      return;
    }
    try {
      const stored = window.localStorage.getItem(key) ?? '';
      setDraftState(stored);
    } catch {
      setDraftState('');
    }
  }, [key]);

  const setDraft = useCallback(
    (value: string) => {
      setDraftState(value);
      if (!key) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        try {
          if (value.trim().length === 0) {
            window.localStorage.removeItem(key);
          } else {
            window.localStorage.setItem(key, value);
          }
        } catch {
          // storage full / disabled - non-fatal
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [key]
  );

  const clear = useCallback(() => {
    setDraftState('');
    if (!key) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { draft, setDraft, clear };
}
