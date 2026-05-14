import { useEffect, useRef, useState } from 'react';
import type { ConversationListItem } from '@/types/messaging';

interface Props {
  conversations: ConversationListItem[];
}

/**
 * Screen-reader live region announcing newly arrived inbox messages.
 *
 * Watches the unified inbox for items whose `last_message_at` advances and
 * emits a polite announcement. Visually hidden.
 */
export function InboxLiveRegion({ conversations }: Props) {
  const seen = useRef<Map<string, string>>(new Map());
  const mounted = useRef(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!mounted.current) {
      // Seed without announcing on first paint
      conversations.forEach((c) => {
        if (c.last_message_at) seen.current.set(c.conversation_id, c.last_message_at);
      });
      mounted.current = true;
      return;
    }
    for (const c of conversations) {
      const last = c.last_message_at;
      if (!last) continue;
      const prev = seen.current.get(c.conversation_id);
      if (prev !== last && (!prev || new Date(last) > new Date(prev))) {
        seen.current.set(c.conversation_id, last);
        const sender =
          (c.is_group ? c.group_title : c.other_user_full_name) || 'Someone';
        const preview = (c.last_message_preview || c.last_message_content || '').slice(0, 80);
        setMessage(`New message from ${sender}${preview ? `: ${preview}` : ''}`);
      }
    }
  }, [conversations]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
