import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ExternalLink,
  Users2,
  Loader2,
  Calendar,
  MapPin,
  Copy,
  Code2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useEventManagement } from '../EventManagementContext';
import { useToast } from '@/hooks/use-toast';
import { formatEventPlace } from '@/lib/events/formatPlace';
import { ROUTES } from '@/config/routes';
import { format } from 'date-fns';

interface OverlapCandidate {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  sharedConnectionCount: number;
}

const PromotionPanel: React.FC = () => {
  const { event } = useEventManagement();
  const { toast } = useToast();

  const publicUrl = `${window.location.origin}${ROUTES.publicEvent(event.slug || event.id)}`;
  const cardImage = event.cover_image_url || event.banner_url || event.image_url || null;
  const place = formatEventPlace(event, 'compact');
  const startTime = event.start_time ? new Date(event.start_time) : null;

  // Network share: members who share connections with people already going,
  // and aren't registered yet themselves. Same shape as the DIA event-overlap
  // card (connections ∩ registrants), scoped to this event's own attendees
  // rather than a single viewer's feed.
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['promotion-network-share', event.id],
    queryFn: async (): Promise<OverlapCandidate[]> => {
      const { data: attendees } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', event.id)
        .eq('status', 'going')
        .not('user_id', 'is', null);

      const attendeeIds = (attendees || []).map(a => a.user_id).filter(Boolean) as string[];
      if (attendeeIds.length === 0) return [];

      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, recipient_id')
        .eq('status', 'accepted')
        .or(`requester_id.in.(${attendeeIds.join(',')}),recipient_id.in.(${attendeeIds.join(',')})`)
        .limit(500);

      if (!connections || connections.length === 0) return [];

      const attendeeSet = new Set(attendeeIds);
      const overlapCounts = new Map<string, number>();
      for (const c of connections) {
        const other = attendeeSet.has(c.requester_id) ? c.recipient_id : c.requester_id;
        if (attendeeSet.has(other)) continue;
        overlapCounts.set(other, (overlapCounts.get(other) || 0) + 1);
      }

      const candidateIds = [...overlapCounts.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id]) => id);

      if (candidateIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', candidateIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return candidateIds
        .map(id => {
          const profile = profileMap.get(id);
          if (!profile) return null;
          return {
            id,
            full_name: profile.full_name,
            username: profile.username,
            avatar_url: profile.avatar_url,
            sharedConnectionCount: overlapCounts.get(id) || 0,
          };
        })
        .filter((c): c is OverlapCandidate => c !== null);
    },
    enabled: !!event.id,
  });

  // Attribution: where registrations came from, for this event only.
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['promotion-attribution', event.id],
    queryFn: async (): Promise<{ name: string; count: number }[]> => {
      const { data: attendees } = await supabase
        .from('event_attendees')
        .select('source, status')
        .eq('event_id', event.id)
        .in('status', ['going', 'maybe', 'pending', 'waitlist']);

      const counts: Record<string, number> = {};
      (attendees || []).forEach(a => {
        const source = a.source || 'Direct';
        counts[source] = (counts[source] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!event.id,
  });

  const totalRegistrations = (sources || []).reduce((sum, s) => sum + s.count, 0);

  const copyLink = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-bold">Promotion</h1>
        <p className="text-body text-muted-foreground">
          Share this event, see who to invite, and track where registrations come from
        </p>
      </div>

      {/* OG card preview */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Share Card</CardTitle>
            <CardDescription>
              How this event appears when the link is shared elsewhere
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={ROUTES.convene.eventEdit(event.id)}>Edit card</a>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm rounded-lg border overflow-hidden bg-card">
            <div className="aspect-video bg-muted flex items-center justify-center">
              {cardImage ? (
                <img src={cardImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <Calendar className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="p-4 space-y-1">
              <p className="text-meta text-muted-foreground uppercase truncate">
                {new URL(publicUrl).hostname}
              </p>
              <p className="text-h3 font-semibold truncate">{event.title}</p>
              <div className="flex flex-col gap-0.5 text-meta text-muted-foreground">
                {startTime && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(startTime, 'EEE, MMM d · h:mm a')}
                  </span>
                )}
                {place && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {place}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => copyLink(publicUrl, 'Event link')}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Network share */}
      <Card>
        <CardHeader>
          <CardTitle>Network Share</CardTitle>
          <CardDescription>
            People with connections already going, who aren't registered yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !suggestions || suggestions.length === 0 ? (
            <p className="text-body text-muted-foreground py-4 text-center">
              No suggestions yet
            </p>
          ) : (
            <div className="space-y-3">
              {suggestions.map(person => (
                <div key={person.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={person.avatar_url || ''} />
                      <AvatarFallback>{person.full_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-body font-medium truncate">{person.full_name}</p>
                      <p className="text-meta text-muted-foreground truncate">@{person.username}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    <Users2 className="h-3 w-3 mr-1" />
                    {person.sharedConnectionCount} in common
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attribution */}
      <Card>
        <CardHeader>
          <CardTitle>Attribution</CardTitle>
          <CardDescription>Where registrations came from</CardDescription>
        </CardHeader>
        <CardContent>
          {sourcesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !sources || sources.length === 0 ? (
            <p className="text-body text-muted-foreground py-4 text-center">
              No registrations yet
            </p>
          ) : (
            <div className="space-y-3">
              {sources.map(source => {
                const percent = totalRegistrations > 0
                  ? Math.round((source.count / totalRegistrations) * 100)
                  : 0;
                return (
                  <div key={source.name} className="space-y-1">
                    <div className="flex items-center justify-between text-body">
                      <span className="capitalize">{source.name}</span>
                      <span className="text-muted-foreground">{source.count} · {percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Embeddable widget — follow-up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Embeddable Widget
          </CardTitle>
          <CardDescription>
            Embed this event's card on an external site. Coming soon.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default PromotionPanel;
