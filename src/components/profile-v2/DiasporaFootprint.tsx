/**
 * DNA | Diaspora Footprint - Five C's Activity Bar
 * Shows activity counts across the Five C's as clickable icon+count pills.
 * Only displays counts > 0.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Sankofa,
  Nkonsonkonson,
  FuntunfunefuDenkyemfunefu,
  Adinkrahene,
  Mpatapo,
} from '@/components/icons/adinkra';

interface DiasporaFootprintProps {
  userId: string;
  isOwner?: boolean;
  username?: string;
}

interface FootprintCounts {
  connections: number;
  events: number;
  spaces: number;
  contributions: number;
  posts: number;
}

type FiveCKey = keyof FootprintCounts;

const FIVE_CS: { key: FiveCKey; label: string; icon: React.ElementType }[] = [
  { key: 'connections', label: 'Connect', icon: Sankofa },
  { key: 'events', label: 'Convene', icon: Nkonsonkonson },
  { key: 'spaces', label: 'Collaborate', icon: FuntunfunefuDenkyemfunefu },
  { key: 'contributions', label: 'Contribute', icon: Adinkrahene },
  { key: 'posts', label: 'Convey', icon: Mpatapo },
];

const routeFor = (key: FiveCKey, isOwner: boolean, username?: string): string => {
  switch (key) {
    case 'connections':
      return isOwner ? '/dna/connect/network?tab=connections' : '/dna/connect/discover';
    case 'events':
      return isOwner ? '/dna/convene/my-events' : '/dna/convene';
    case 'spaces':
      return isOwner ? '/dna/collaborate/my-spaces' : '/dna/collaborate';
    case 'contributions':
      return isOwner ? '/dna/contribute/my-contributions' : '/dna/contribute';
    case 'posts':
      return isOwner
        ? '/dna/convey'
        : `/dna/feed${username ? `?author=${encodeURIComponent(username)}` : ''}`;
  }
};

export const DiasporaFootprint: React.FC<DiasporaFootprintProps> = ({
  userId,
  isOwner = false,
  username,
}) => {
  const navigate = useNavigate();

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
          <button
            key={key}
            type="button"
            onClick={() => navigate(routeFor(key, isOwner, username))}
            aria-label={`${counts[key]} ${label}. Open details.`}
            className={cn(
              'flex flex-col items-center bg-muted rounded-lg px-3 py-2 min-w-[64px] min-h-[44px]',
              'hover:bg-secondary transition-colors cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <Icon className="w-4 h-4 text-dna-emerald mb-0.5" />
            <span className="font-semibold text-sm text-foreground">{counts[key]}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
