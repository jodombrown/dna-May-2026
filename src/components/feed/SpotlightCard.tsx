/**
 * SpotlightCard — Featured member spotlight for the right sidebar
 * Rotates through suggested members with a warm, editorial treatment
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { CulturalPattern } from '@/components/shared/CulturalPattern';
import { Mpatapo } from '@/components/icons/adinkra';

export const SpotlightCard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: spotlight } = useQuery({
    queryKey: ['feed-spotlight-member', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get connected IDs to exclude
      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      const excludeIds = new Set<string>([user.id]);
      connections?.forEach((c) => {
        excludeIds.add(c.requester_id);
        excludeIds.add(c.recipient_id);
      });

      // Get a random interesting profile
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url, headline, current_city')
        .not('id', 'in', `(${[...excludeIds].join(',')})`)
        .not('headline', 'is', null)
        .not('avatar_url', 'is', null)
        .limit(5);

      if (!data || data.length === 0) return null;

      // Pick one randomly
      return data[Math.floor(Math.random() * data.length)];
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // Rotate every 30 min
  });

  if (!spotlight) return null;

  const displayName = spotlight.display_name || spotlight.username || 'Member';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative overflow-hidden bg-card rounded-dna-xl shadow-dna-1">
      {/* Heritage pattern header */}
      <div className="relative h-16 bg-gradient-to-br from-[hsl(var(--dna-emerald)/0.15)] to-[hsl(var(--dna-gold)/0.1)]">
        <CulturalPattern pattern="adinkra" opacity={0.06} />
        <div className="absolute top-2 left-3 flex items-center gap-1.5">
          <Mpatapo className="h-3 w-3 text-dna-gold" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70">Spotlight</span>
        </div>
      </div>

      <div className="px-3.5 pb-3.5 -mt-6">
        <Avatar
          className="h-12 w-12 border-[3px] border-card ring-2 ring-[hsl(var(--dna-emerald)/0.2)] cursor-pointer"
          onClick={() => navigate(`/dna/${spotlight.username || spotlight.id}`)}
        >
          <AvatarImage src={spotlight.avatar_url || ''} alt={displayName} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="mt-2">
          <p
            className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/dna/${spotlight.username || spotlight.id}`)}
          >
            {displayName}
          </p>
          {spotlight.headline && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
              {spotlight.headline}
            </p>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3 text-xs h-8 border-primary/30 text-primary hover:bg-primary/5"
          onClick={() => navigate(`/dna/${spotlight.username || spotlight.id}`)}
        >
          <UserPlus className="h-3 w-3 mr-1.5" />
          View Profile
        </Button>
      </div>
    </div>
  );
};
