/**
 * DNA | CONVENE — Event Organizer Card
 * Enhanced organizer section with bio, event count, and follow CTA.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, ChevronRight } from 'lucide-react';

interface OrganizerProfile {
  id: string;
  username: string | null;
  full_name: string;
  avatar_url: string | null;
  headline?: string | null;
}

interface EventOrganizerCardProps {
  organizer: OrganizerProfile;
  groupHost?: {
    id: string;
    name: string;
    slug: string;
    avatar_url: string | null;
    member_count: number;
  } | null;
}

export function EventOrganizerCard({ organizer, groupHost }: EventOrganizerCardProps) {
  const navigate = useNavigate();

  // Fetch organizer's event count
  const { data: eventCount = 0 } = useQuery({
    queryKey: ['organizer-event-count', organizer.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', organizer.id)
        .eq('status', 'published');
      return count || 0;
    },
    staleTime: 300_000,
  });

  if (groupHost) {
    return (
      <Card className="border-l-4 border-l-[hsl(var(--module-convene))]">
        <CardContent className="p-4">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate(`/dna/convene/groups/${groupHost.slug}`)}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={groupHost.avatar_url || undefined} />
              <AvatarFallback>{groupHost.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Hosted by</p>
              <p className="font-semibold group-hover:text-primary transition-colors truncate">
                {groupHost.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {groupHost.member_count} members
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-[hsl(var(--module-convene))]">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => organizer.username && navigate(`/dna/${organizer.username}`)}
          >
            <AvatarImage src={organizer.avatar_url || undefined} />
            <AvatarFallback>{organizer.full_name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Hosted by</p>
            <p
              className="font-semibold cursor-pointer hover:text-primary transition-colors truncate"
              onClick={() => organizer.username && navigate(`/dna/${organizer.username}`)}
            >
              {organizer.full_name}
            </p>
            {organizer.headline && (
              <p className="text-sm text-muted-foreground line-clamp-1">{organizer.headline}</p>
            )}
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{eventCount} event{eventCount !== 1 ? 's' : ''} hosted</span>
            </div>
          </div>
        </div>
        {eventCount > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs"
            onClick={() => navigate(`/dna/${organizer.username}?tab=events`)}
          >
            View all events by {organizer.full_name?.split(' ')[0]}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
