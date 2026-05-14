import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Shared presence channel singleton.
 *
 * Multiple hooks (usePresenceHeartbeat, useUserPresence per row) need to read
 * from the same `presence:global` topic. Calling `supabase.channel('presence:global')`
 * returns the SAME instance each time, so a second `.subscribe()` throws
 * "subscribe can only be called a single time per channel instance".
 *
 * This singleton owns one channel + one subscribe call, ref-counts consumers,
 * and tears down only when the last consumer leaves.
 */

type Listener = () => void;

let channel: RealtimeChannel | null = null;
let refCount = 0;
let currentKey: string | null = null;
const listeners = new Set<Listener>();

function notifyAll() {
  for (const l of listeners) l();
}

export function getPresenceState(): Record<string, unknown[]> {
  if (!channel) return {};
  return channel.presenceState() as Record<string, unknown[]>;
}

export function subscribePresenceListener(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Acquire the shared presence channel for a user. Returns the channel and
 * a release function. The first acquire creates and subscribes; subsequent
 * acquires re-use it.
 */
export function acquirePresence(userKey: string): {
  channel: RealtimeChannel;
  release: () => void;
} {
  refCount += 1;

  if (!channel) {
    currentKey = userKey;
    channel = supabase.channel('presence:global', {
      config: { presence: { key: userKey } },
    });
    channel
      .on('presence', { event: 'sync' }, notifyAll)
      .on('presence', { event: 'join' }, notifyAll)
      .on('presence', { event: 'leave' }, notifyAll)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && channel) {
          await channel.track({ online_at: new Date().toISOString() });
          notifyAll();
        }
      });
  }

  const ch = channel;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0 && channel) {
      supabase.removeChannel(channel);
      channel = null;
      currentKey = null;
    }
  };

  return { channel: ch, release };
}

export function getCurrentPresenceKey(): string | null {
  return currentKey;
}
