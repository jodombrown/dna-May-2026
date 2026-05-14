/**
 * DNA | Diaspora Footprint — Five C's Activity Bar
 * Shows activity counts across the Five C's as icon+count pills.
 * Only displays counts > 0.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Sankofa,
  Nkonsonkonson,
  FuntunfunefuDenkyemfunefu,
  Adinkrahene,
  Mpatapo,
} from '@/components/icons/adinkra';

interface DiasporaFootprintProps {
  userId: string;
}

interface FootprintCounts {
  connections: number;
  events: number;
  spaces: number;
  contributions: number;
  posts: number;
}

const FIVE_CS = [
  { key: 'connections' as const, label: 'Connect', icon: Sankofa },
  { key: 'events' as const, label: 'Convene', icon: Nkonsonkonson },
  { key: 'spaces' as const, label: 'Collaborate', icon: FuntunfunefuDenkyemfunefu },
  { key: 'contributions' as const, label: 'Contribute', icon: Adinkrahene },
  { key: 'posts' as const, label: 'Convey', icon: Mpatapo },
];

export const DiasporaFootprint: React.FC<DiasporaFootprintProps> = ({ userId }) => {
  const { data: counts } = useQuery({
    queryKey: ['diaspora-footprint', userId],
    queryFn: async (): Promise<FootprintCounts> => {
      const [connections, events, spaces, contributions, posts] = await Promise.all([
        supabase
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
          .eq('status', 'accepted')
          .then(r => r.count ?? 0),
        supabase
          .from('event_attendees')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .then(r => r.count ?? 0),
        supabase
          .from('space_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .then(r => r.count ?? 0),
        supabase
          .from('contribution_offers')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', userId)
          .then(r => r.count ?? 0),
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', userId)
          .eq('is_deleted', false)
          .then(r => r.count ?? 0),
      ]);

      return { connections, events, spaces, contributions, posts };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!counts) return null;

  const activePills = FIVE_CS.filter(c => (counts[c.key] ?? 0) > 0);
  if (activePills.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Diaspora Footprint</h3>
      <div className="flex flex-wrap gap-2">
        {activePills.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="flex flex-col items-center bg-muted rounded-lg px-3 py-2 min-w-[64px]"
          >
            <Icon className="w-4 h-4 text-dna-emerald mb-0.5" />
            <span className="font-semibold text-sm text-foreground">{counts[key]}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
