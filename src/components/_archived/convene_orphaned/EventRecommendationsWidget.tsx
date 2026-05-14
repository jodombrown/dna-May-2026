import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MapPin, ExternalLink, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Nkonsonkonson } from '@/components/icons/adinkra';

interface ScoredEvent {
  id: string;
  title: string;
  description?: string;
  event_type?: string;
  format?: string;
  location_name?: string;
  location_city?: string;
  start_time: string;
  organizer_id?: string;
  score: number;
  matchReason: string;
  attendingFriends?: number;
  // Legacy fields
  type?: string;
  location?: string;
  is_virtual?: boolean;
  date_time?: string;
  attendee_count?: number;
  created_by?: string;
}

export const EventRecommendationsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user's connections
  const { data: connections } = useQuery({
    queryKey: ['user-connections', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .eq('status', 'accepted');
      return data?.flatMap(c => [c.requester_id, c.recipient_id]).filter(id => id !== user!.id) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user's registrations
  const { data: registrations } = useQuery({
    queryKey: ['user-event-registrations', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', user!.id);
      return data?.map(r => r.event_id) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch and score events
  const { data: events, isLoading } = useQuery({
    queryKey: ['recommended-events', profile?.id, connections, registrations],
    queryFn: async () => {
      if (!profile) return [];

      // Fetch upcoming events (exclude already registered)
      const { data: upcomingEvents } = await supabase
        .from('events')
        .select('*')
        .eq('is_cancelled', false)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(20);

      if (!upcomingEvents) return [];

      // Filter out already registered events
      const candidates = upcomingEvents.filter(
        event => !(registrations || []).includes(event.id)
      );

      // Fetch event registrations for social proof
      const { data: allRegistrations } = await supabase
        .from('event_attendees')
        .select('event_id, user_id')
        .in('event_id', candidates.map(e => e.id));

      // Score each event with multi-dimensional algorithm
      const scored: ScoredEvent[] = candidates.map(event => {
        let score = 0;
        const reasons: string[] = [];

        const isVirtual = event.format === 'virtual' || event.format === 'hybrid';
        const location = event.location_name || event.location_city || '';

        // A. GEOGRAPHIC RELEVANCE (30 points max)
        const userCity = profile.location?.split(',')[0]?.trim().toLowerCase();
        const eventCity = event.location_city?.toLowerCase() || '';
        const userCountry = profile.location?.toLowerCase() || '';
        const eventCountry = event.location_country?.toLowerCase() || '';

        if (isVirtual) {
          score += 15;
          reasons.push('Virtual - join from anywhere');
        } else if (userCity && eventCity && userCity === eventCity) {
          score += 30;
          reasons.push('In your city');
        } else if (userCountry && eventCountry && userCountry.includes(eventCountry)) {
          score += 20;
        }

        // Check country of origin match
        if (profile.country_of_origin && eventCountry.includes(profile.country_of_origin.toLowerCase())) {
          score += 25;
          if (reasons.length === 0) {
            reasons.push(`In ${profile.country_of_origin}`);
          }
        }

        // B. AFRICA FOCUS ALIGNMENT (25 points max)
        const userAreas = (profile.africa_focus_areas || []) as string[];
        const eventDesc = (event.description || '').toLowerCase();
        const eventTitle = event.title.toLowerCase();
        
        // Check if event keywords match user's focus areas
        const focusMatches = userAreas.filter(area => 
          eventDesc.includes(area.toLowerCase()) || eventTitle.includes(area.toLowerCase())
        );
        if (focusMatches.length > 0) {
          score += 15;
          if (reasons.length === 0) {
            reasons.push(`Matches ${focusMatches[0]} interest`);
          }
        }

        // C. PROFESSIONAL RELEVANCE (20 points max)
        const userIntents = profile.intentions || [];
        const eventType = event.event_type || '';

        if (eventType === 'conference' && userIntents.includes('invest')) {
          score += 20;
          if (reasons.length === 0) {
            reasons.push('Perfect for investors');
          }
        } else if (eventType === 'workshop' && userIntents.includes('learn')) {
          score += 20;
          if (reasons.length === 0) {
            reasons.push('Great learning opportunity');
          }
        } else if (eventType === 'networking') {
          score += 10;
        }

        // Check skills overlap
        const userSkills = (profile.skills || []) as string[];
        const skillMatches = userSkills.filter(skill => 
          eventDesc.includes(skill.toLowerCase()) || eventTitle.includes(skill.toLowerCase())
        );
        if (skillMatches.length > 0) {
          score += 5;
        }

        // D. SOCIAL PROOF (15 points max)
        const eventRegs = allRegistrations?.filter(r => r.event_id === event.id) || [];
        const friendsAttending = eventRegs.filter(r => 
          (connections || []).includes(r.user_id)
        ).length;

        if (friendsAttending > 0) {
          score += Math.min(10, friendsAttending * 2);
          reasons.push(`${friendsAttending} friend${friendsAttending > 1 ? 's' : ''} attending`);
        }

        const attendeeCount = eventRegs.length || 0;
        if (attendeeCount > 50) {
          score += 5;
        }

        // E. TIMING OPTIMIZATION (10 points max)
        const daysUntil = differenceInDays(new Date(event.start_time), new Date());
        if (daysUntil <= 7) {
          score += 10;
        } else if (daysUntil <= 30) {
          score += 7;
        } else if (daysUntil <= 90) {
          score += 3;
        }

        return {
          ...event,
          score,
          matchReason: reasons[0] || 'Recommended for you',
          attendingFriends: friendsAttending,
          // Legacy compatibility
          date_time: event.start_time,
          type: event.event_type,
          location: location,
          is_virtual: isVirtual,
          attendee_count: attendeeCount,
          created_by: event.organizer_id
        };
      });

      // Apply diversity rules
      let diverse: ScoredEvent[] = [];
      const typeCounts: Record<string, number> = {};
      const hostCounts: Record<string, number> = {};
      let hasVirtual = false;

      for (const event of scored.sort((a, b) => b.score - a.score)) {
        const eventType = event.event_type || event.type || 'other';
        const typeCount = typeCounts[eventType] || 0;
        const hostCount = hostCounts[event.organizer_id || event.created_by || ''] || 0;

        // Ensure at least 1 virtual in top 3
        if (!hasVirtual && (event.format === 'virtual' || event.is_virtual)) {
          hasVirtual = true;
        }

        // Max 2 of same type, max 1 per host
        if (typeCount < 2 && hostCount < 1) {
          diverse.push(event);
          typeCounts[eventType] = typeCount + 1;
          hostCounts[event.organizer_id || event.created_by || ''] = hostCount + 1;
        }

        if (diverse.length >= 3) break;
      }

      // If no virtual in top 3, try to add one
      if (!hasVirtual && diverse.length < 3) {
        const virtualEvent = scored.find(e => (e.format === 'virtual' || e.is_virtual) && !diverse.includes(e));
        if (virtualEvent) {
          diverse[diverse.length - 1] = virtualEvent;
        }
      }

      return diverse;
    },
    enabled: !!profile && !!connections && !!registrations,
    staleTime: 12 * 60 * 60 * 1000, // Cache for 12 hours
  });

  if (isLoading || !events || events.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-copper-500" />
          Recommended Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => navigate('/dna/convene/events')}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm truncate">
                  {event.title}
                </h4>
                {event.score >= 75 && (
                  <Badge variant="default" className="shrink-0 text-xs">
                    <Nkonsonkonson className="h-3 w-3 mr-1" />
                    Hot match
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(event.date_time), 'MMM d, h:mm a')}
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {event.matchReason}
                </Badge>
                {event.attendingFriends && event.attendingFriends > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{event.attendingFriends} friend{event.attendingFriends > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            <Button size="sm" variant="outline">
              View
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/dna/convene/events')}
        >
          See all events
          <ExternalLink className="h-3 w-3 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};