import { useEffect } from 'react';
import type { ConversationListItem } from '@/types/messaging';

interface Options {
  conversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onArchive?: (id: string) => void;
  onMute?: (id: string) => void;
  onFocusSearch?: () => void;
  enabled?: boolean;
}

/**
 * LinkedIn-style inbox keyboard shortcuts.
 * j/k: next/prev conversation
 * Enter: open selected
 * e: archive selected
 * m: toggle mute on selected
 * /: focus search field
 *
 * Disabled while typing in inputs/textareas/contenteditable.
 */
export function useInboxKeyboardShortcuts({
  conversations,
  selectedId,
  onSelect,
  onArchive,
  onMute,
  onFocusSearch,
  enabled = true,
}: Options) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable;

      // Slash should still focus search even if not typing
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      if (isTyping) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const list = conversations;
      const idx = list.findIndex((c) => c.conversation_id === selectedId);

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = list[Math.min(list.length - 1, idx + 1)];
        if (next) onSelect(next.conversation_id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = list[Math.max(0, idx - 1)];
        if (prev) onSelect(prev.conversation_id);
      } else if (e.key === 'Enter' && selectedId) {
        e.preventDefault();
        onSelect(selectedId);
      } else if (e.key === 'e' && selectedId) {
        e.preventDefault();
        onArchive?.(selectedId);
      } else if (e.key === 'm' && selectedId) {
        e.preventDefault();
        onMute?.(selectedId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [conversations, selectedId, onSelect, onArchive, onMute, onFocusSearch, enabled]);
}
