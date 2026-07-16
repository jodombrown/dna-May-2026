/**
 * Centralized Realtime Channel Manager
 * 
 * CRITICAL: Prevents "subscribe can only be called a single time per channel instance" errors
 * 
 * Two patterns:
 * 1. SINGLETON channels: One subscription shared across all components (e.g., user profile)
 * 2. UNIQUE channels: Each component gets its own channel (e.g., notifications panel)
 * 
 * Usage:
 * 
 * Singleton (for globally shared data like current user profile):
 *   const cleanup = createSingletonChannel(
 *     `profiles:${userId}`,
 *     { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
 *     () => { queryClient.invalidateQueries(['profile', userId]) }
 *   );
 * 
 * Unique (for component-specific subscriptions):
 *   const cleanup = createUniqueChannel(
 *     `notifications:${userId}`,
 *     { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
 *     () => { queryClient.invalidateQueries(['notifications']) }
 *   );
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ChannelConfig = {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
};

type RealtimePayload = {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: string;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  errors: string[] | null;
};

type ChannelEntry = {
  channel: RealtimeChannel;
  refs: number;
};

// Registry for singleton channels (shared across components)
const singletonRegistry = new Map<string, ChannelEntry>();

/**
 * Creates a SINGLETON realtime channel with reference counting
 * Use this when multiple components need the SAME subscription (e.g., current user profile)
 * 
 * @param channelName - Unique name for this channel (e.g., 'profiles:user123')
 * @param config - Postgres changes configuration
 * @param onUpdate - Callback when data changes
 * @returns Cleanup function to call on unmount
 */
export function createSingletonChannel(
  channelName: string,
  config: ChannelConfig,
  onUpdate: (payload: RealtimePayload) => void
): () => void {
  let entry = singletonRegistry.get(channelName);

  if (!entry) {
    // First subscriber - create the channel and subscribe once
    const channel = supabase
      .channel(`realtime:singleton:${channelName}`)
      .on('postgres_changes' as any, config, onUpdate)
      .subscribe();

    entry = { channel, refs: 0 };
    singletonRegistry.set(channelName, entry);
  }

  // Increment reference count
  entry.refs += 1;

  // Return cleanup function
  return () => {
    const e = singletonRegistry.get(channelName);
    if (e) {
      e.refs -= 1;
      if (e.refs <= 0) {
        // Last subscriber - clean up the channel
        supabase.removeChannel(e.channel);
        singletonRegistry.delete(channelName);
      }
    }
  };
}

/**
 * Creates a UNIQUE realtime channel for this component instance
 * Use this when each component needs its OWN subscription (e.g., notification panels)
 * 
 * @param baseChannelName - Base name for channel (e.g., 'notifications:user123')
 * @param config - Postgres changes configuration
 * @param onUpdate - Callback when data changes
 * @returns Cleanup function to call on unmount
 */
export function createUniqueChannel(
  baseChannelName: string,
  config: ChannelConfig,
  onUpdate: (payload: RealtimePayload) => void
): () => void {
  // Generate unique instance ID to prevent collisions
  const instanceId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const uniqueChannelName = `realtime:unique:${baseChannelName}_${instanceId}`;

  const channel = supabase
    .channel(uniqueChannelName)
    .on('postgres_changes' as any, config, onUpdate)
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * DECISION GUIDE: Which pattern should I use?
 * 
 * Use SINGLETON when:
 * ✓ Multiple components display the SAME data (e.g., current user profile shown in header, sidebar, posts)
 * ✓ You want ONE database subscription shared across all instances
 * ✓ Example: useProfile (current user), useCurrentSpace (active space)
 * 
 * Use UNIQUE when:
 * ✓ Each component has its OWN callback/state (e.g., different notification dropdowns)
 * ✓ Same component mounted multiple times needs separate subscriptions
 * ✓ You're okay with multiple database subscriptions for the same data
 * ✓ Example: useUnifiedNotifications (different panels), useDiaNudges (dashboard vs nudge center)
 * 
 * When in doubt: Use UNIQUE (safer, prevents collisions)
 */
