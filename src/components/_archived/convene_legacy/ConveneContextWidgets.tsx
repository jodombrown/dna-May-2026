import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useUniversalComposer } from '@/hooks/useUniversalComposer';
import { UniversalComposer } from '@/components/composer/UniversalComposer';
import { Nkonsonkonson } from '@/components/icons/adinkra';

export function ConveneContextWidgets() {
  const navigate = useNavigate();
  const composer = useUniversalComposer();

  // Get next event (hosting or attending)
  const { data: nextEvent } = useQuery({
    queryKey: ['next-event-widget'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get next event user is hosting
      const { data: hostingEvent } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1)
        .single();

      if (hostingEvent) return { ...hostingEvent, role: 'hosting' };

      // Get next event user is attending
      const { data: attendingEvents } = await supabase
        .from('event_attendees')
        .select('event_id, events(*)')
        .eq('user_id', user.id)
        .eq('status', 'going')
        .gte('events.start_time', new Date().toISOString())
        .order('events.start_time', { ascending: true })
        .limit(1);

      if (attendingEvents && attendingEvents.length > 0) {
        return { ...attendingEvents[0].events, role: 'attending' };
      }

      return null;
    }
  });

  // Get connection strength insight
  const { data: connectionInsight } = useQuery({
    queryKey: ['connection-insight-widget'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Count recent events attended
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentAttendance, count } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'going')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Count active connections
      const { count: connectionCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact' })
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted');

      return {
        eventsThisMonth: count || 0,
        totalConnections: connectionCount || 0
      };
    }
  });

  return (
    <div className="space-y-4">
      {/* Next Event Card */}
      {nextEvent && (
        <Card className="p-4 bg-gradient-to-br from-dna-emerald/10 to-dna-forest/5 border-dna-emerald/20">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-dna-emerald" />
              <span className="text-sm font-medium text-foreground">
                {nextEvent.role === 'hosting' ? 'You\'re hosting' : 'Coming up next'}
              </span>
            </div>
          </div>
          <h4 className="font-semibold mb-1 line-clamp-2">{nextEvent.title}</h4>
          <p className="text-sm text-muted-foreground mb-3">
            {format(new Date(nextEvent.start_time), 'MMM d, h:mm a')}
          </p>
          <Button
            size="sm"
            className="w-full"
            onClick={() => navigate(`/dna/convene/events/${nextEvent.id}`)}
          >
            View Details
            <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        </Card>
      )}

      {/* Connection Strength Insight */}
      {connectionInsight && connectionInsight.eventsThisMonth > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-dna-copper" />
            <span className="text-sm font-medium">Your Convene Momentum</span>
          </div>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Events this month</span>
              <span className="font-semibold">{connectionInsight.eventsThisMonth}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network size</span>
              <span className="font-semibold">{connectionInsight.totalConnections}</span>
            </div>
          </div>
          {connectionInsight.eventsThisMonth >= 3 && (
            <div className="bg-dna-copper/10 rounded-lg p-2 text-xs text-center">
              🎯 You're building strong convening habits!
            </div>
          )}
        </Card>
      )}

      {/* Convene → Collaborate Nudge */}
      {connectionInsight && connectionInsight.eventsThisMonth >= 2 && (
        <Card className="p-4 bg-gradient-to-br from-dna-copper/10 to-dna-rust/5 border-dna-copper/20">
          <div className="flex items-center gap-2 mb-3">
            <Nkonsonkonson className="w-4 h-4 text-dna-copper" />
            <span className="text-sm font-medium">Ready for the next step?</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            You've attended {connectionInsight.eventsThisMonth} events this month. Turn conversations into collaborations.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate('/dna/collaborate')}
          >
            Start a Project Space
          </Button>
        </Card>
      )}

      {/* Quick Host Widget */}
      <Card className="p-4 border-dashed">
        <h4 className="font-semibold mb-2 text-sm">See a gap?</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Host the gathering your community needs.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => composer.open('event')}
        >
          <Calendar className="w-3 h-3 mr-2" />
          Host an Event
        </Button>
      </Card>
      <UniversalComposer
        isOpen={composer.isOpen}
        mode={composer.mode}
        context={composer.context}
        isSubmitting={composer.isSubmitting}
        onClose={composer.close}
        onModeChange={composer.switchMode}
        successData={composer.successData}
        onSubmit={composer.submit}
        onDismissSuccess={composer.dismissSuccess}
      />
    </div>
  );
}
