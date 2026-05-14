import { useEffect, useMemo, useRef, useState } from 'react';
import type { MessageWithSender } from '@/services/messageTypes';

export type DateRangePreset = 'all' | 'today' | 'week' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  from?: string; // ISO date (yyyy-mm-dd) for custom
  to?: string;
}

interface PersistedState {
  query: string;
  activeIdx: number;
  range: DateRange;
  lastActiveMessageId?: string;
}

const KEY = (conversationId: string) => `dna:chat-search:${conversationId}`;

const readPersisted = (conversationId: string): PersistedState | null => {
  try {
    const raw = sessionStorage.getItem(KEY(conversationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (typeof parsed.query !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const startOfWeek = (d: Date) => {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day + 6) % 7; // Monday-start
  x.setDate(x.getDate() - diff);
  return x;
};

const inRange = (createdAt: string, range: DateRange): boolean => {
  if (range.preset === 'all') return true;
  const t = new Date(createdAt).getTime();
  const now = new Date();
  if (range.preset === 'today') return t >= startOfDay(now).getTime();
  if (range.preset === 'week') return t >= startOfWeek(now).getTime();
  if (range.preset === 'custom') {
    const fromOk = range.from ? t >= new Date(range.from + 'T00:00:00').getTime() : true;
    const toOk = range.to ? t <= new Date(range.to + 'T23:59:59').getTime() : true;
    return fromOk && toOk;
  }
  return true;
};

interface IndexEntry {
  id: string;
  haystack: string;
  createdAt: string;
}

/**
 * useChatSearch - Phase 9/10 in-thread search
 *
 * - Indexes messages once per conversation (text + attachment filename + link preview)
 * - Persists query, active match, range, and last active message id
 *   so reopening search restores the user's exact position
 * - Today / this week / custom date filters
 */
export function useChatSearch(conversationId: string, messages: MessageWithSender[]) {
  const persisted = useRef<PersistedState | null>(null);
  if (persisted.current === null) {
    persisted.current = readPersisted(conversationId);
  }

  const [query, setQuery] = useState<string>(persisted.current?.query ?? '');
  const [activeIdx, setActiveIdx] = useState<number>(persisted.current?.activeIdx ?? 0);
  const [range, setRange] = useState<DateRange>(persisted.current?.range ?? { preset: 'all' });
  const [lastActiveMessageId, setLastActiveMessageId] = useState<string | undefined>(
    persisted.current?.lastActiveMessageId,
  );

  // Re-hydrate when conversation changes
  useEffect(() => {
    const p = readPersisted(conversationId);
    setQuery(p?.query ?? '');
    setActiveIdx(p?.activeIdx ?? 0);
    setRange(p?.range ?? { preset: 'all' });
    setLastActiveMessageId(p?.lastActiveMessageId);
  }, [conversationId]);

  // Persist on change
  useEffect(() => {
    try {
      const payload: PersistedState = { query, activeIdx, range, lastActiveMessageId };
      if (!query && range.preset === 'all' && !lastActiveMessageId) {
        sessionStorage.removeItem(KEY(conversationId));
      } else {
        sessionStorage.setItem(KEY(conversationId), JSON.stringify(payload));
      }
    } catch {
      // Storage quota or privacy mode: ignore.
    }
  }, [conversationId, query, activeIdx, range, lastActiveMessageId]);

  const index = useMemo<IndexEntry[]>(() => {
    return messages.map((m) => {
      const parts: string[] = [];
      if (m.content) parts.push(m.content);
      const att = m.payload?.attachment;
      if (att?.filename) parts.push(att.filename);
      const link = m.payload?.linkPreview;
      if (link?.title) parts.push(link.title);
      if (link?.description) parts.push(link.description);
      return {
        id: m.message_id,
        createdAt: m.created_at,
        haystack: parts.join(' \n ').toLowerCase(),
      };
    });
  }, [messages]);

  const matches = useMemo<string[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q && range.preset === 'all') return [];
    const out: string[] = [];
    for (const entry of index) {
      if (q && !entry.haystack.includes(q)) continue;
      if (!inRange(entry.createdAt, range)) continue;
      out.push(entry.id);
    }
    return out;
  }, [index, query, range]);

  // Clamp active index when matches change
  useEffect(() => {
    if (matches.length === 0) {
      if (activeIdx !== 0) setActiveIdx(0);
      return;
    }
    if (activeIdx > matches.length - 1) setActiveIdx(matches.length - 1);
  }, [matches.length, activeIdx]);

  // Keep lastActiveMessageId aligned with the active match while user navigates
  useEffect(() => {
    const id = matches[activeIdx];
    if (id) setLastActiveMessageId(id);
  }, [activeIdx, matches]);

  /**
   * When search is reopened, jump to the previously focused match if it is
   * still present in the current matches list. Returns the index that was
   * restored, or -1 if no restoration happened.
   */
  const restoreActiveFromPersisted = (): number => {
    if (!lastActiveMessageId) return -1;
    const idx = matches.indexOf(lastActiveMessageId);
    if (idx >= 0 && idx !== activeIdx) {
      setActiveIdx(idx);
    }
    return idx;
  };

  /**
   * Clear query, range, and active match. By default the last-active message
   * id is preserved so the thread can scroll back to it after closing search.
   * Pass `{ keepLastActive: false }` to wipe everything.
   */
  const reset = (opts?: { keepLastActive?: boolean }) => {
    const keep = opts?.keepLastActive !== false;
    setQuery('');
    setActiveIdx(0);
    setRange({ preset: 'all' });
    if (!keep) setLastActiveMessageId(undefined);
    try {
      if (keep && lastActiveMessageId) {
        sessionStorage.setItem(
          KEY(conversationId),
          JSON.stringify({ query: '', activeIdx: 0, range: { preset: 'all' }, lastActiveMessageId }),
        );
      } else {
        sessionStorage.removeItem(KEY(conversationId));
      }
    } catch {
      // ignore
    }
  };

  return {
    query,
    setQuery,
    activeIdx,
    setActiveIdx,
    range,
    setRange,
    matches,
    reset,
    lastActiveMessageId,
    restoreActiveFromPersisted,
  };
}
