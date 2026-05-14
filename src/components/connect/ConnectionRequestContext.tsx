/**
 * DNA | CONNECT — Connection Request Shared Context
 * Shows "You both attended Lagos Tech Week" or "Both in FinTech" on pending requests.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sankofa } from '@/components/icons/adinkra';

interface ConnectionRequestContextProps {
  currentUserId: string;
  requesterId: string;
}

export function ConnectionRequestContext({ currentUserId, requesterId }: ConnectionRequestContextProps) {
  const { data: context } = useQuery({
    queryKey: ['connection-request-context', currentUserId, requesterId],
    queryFn: async (): Promise<string | null> => {
      // 1. Check shared events (highest priority)
      const [{ data: myEvents }, { data: theirEvents }] = await Promise.all([
        supabase
          .from('event_attendees')
          .select('event_id, events!inner(title)')
          .eq('user_id', currentUserId)
          .eq('status', 'going')
          .limit(20),
        supabase
          .from('event_attendees')
          .select('event_id, events!inner(title)')
          .eq('user_id', requesterId)
          .eq('status', 'going')
          .limit(20),
      ]);

      if (myEvents && theirEvents) {
        const myEventIds = new Set(myEvents.map(e => e.event_id));
        const shared = theirEvents.find(e => myEventIds.has(e.event_id));
        if (shared) {
          const title = (shared.events as unknown as { title: string })?.title;
          if (title) return `You both attended **${title}**`;
        }
      }

      // 2. Check shared spaces
      const [{ data: mySpaces }, { data: theirSpaces }] = await Promise.all([
        supabase
          .from('collaboration_memberships')
          .select('space_id, collaboration_spaces!inner(title)')
          .eq('user_id', currentUserId)
          .eq('status', 'active')
          .limit(20),
        supabase
          .from('collaboration_memberships')
          .select('space_id, collaboration_spaces!inner(title)')
          .eq('user_id', requesterId)
          .eq('status', 'active')
          .limit(20),
      ]);

      if (mySpaces && theirSpaces) {
        const mySpaceIds = new Set(mySpaces.map(s => s.space_id));
        const shared = theirSpaces.find(s => mySpaceIds.has(s.space_id));
        if (shared) {
          const title = (shared.collaboration_spaces as unknown as { title: string })?.title;
          if (title) return `Both members of **${title}**`;
        }
      }

      // 3. Check shared industry/role
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, industry, professional_role')
        .in('id', [currentUserId, requesterId]);

      if (profiles && profiles.length === 2) {
        const [a, b] = profiles;
        if (a.industry && b.industry && a.industry === b.industry) {
          return `Both in **${a.industry}**`;
        }
      }

      // 4. Mutual connections count
      try {
        const { data: count } = await supabase.rpc('get_mutual_connection_count', {
          user_a: currentUserId,
          user_b: requesterId,
        });
        if (typeof count === 'number' && count > 0) {
          return `**${count} mutual connection${count > 1 ? 's' : ''}**`;
        }
      } catch {
        // RPC may not exist
      }

      return null;
    },
    enabled: !!currentUserId && !!requesterId,
    staleTime: 5 * 60_000,
  });

  if (!context) return null;

  // Parse bold markers
  const parts = context.split(/\*\*(.*?)\*\*/);

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
      <Sankofa className="h-3 w-3 text-primary flex-shrink-0" />
      <span>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <span key={i} className="font-medium text-foreground">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    </div>
  );
}
