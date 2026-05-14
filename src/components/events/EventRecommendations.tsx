import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Nkonsonkonson } from '@/components/icons/adinkra';

interface RecommendedEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  format: string;
  location_city?: string;
  location_country?: string;
  start_time: string;
  recommendation_score: number;
  recommendation_reason: string;
  friends_attending_count: number;
  total_attendees: number;
}

export const EventRecommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: recommendations = [], isLoading, error } = useQuery<RecommendedEvent[]>({
    queryKey: ['event-recommendations', user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-event-recommendations', {
          body: {}
        });

        if (error) {
          logger.warn('EventRecommendations', 'Edge function error:', error);
          return [];
        }

        return data?.recommendations || [];
      } catch (error) {
        logger.warn('EventRecommendations', 'Failed to fetch recommendations:', error);
        return [];
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
  });

  if (!user) return null;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Nkonsonkonson className="h-5 w-5 text-primary" />
            Recommended For You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load recommendations. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Nkonsonkonson className="h-5 w-5 text-primary" />
            Recommended For You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Nkonsonkonson className="h-5 w-5 text-primary" />
            Recommended For You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            No recommendations yet. Update your profile interests to get personalized event suggestions!
          </p>
          <Button variant="outline" onClick={() => navigate('/dna/profile')}>
            Update Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Nkonsonkonson className="h-6 w-6 text-primary" />
          Recommended For You
        </h2>
        <Badge variant="secondary" className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          AI-Powered
        </Badge>
      </div>

      <div className="grid gap-4">
        {recommendations.slice(0, 5).map((event) => (
          <Card 
            key={event.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/dna/convene/events/${(event as any).slug || event.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="capitalize">
                      {event.event_type}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {event.format.replace('_', ' ')}
                    </Badge>
                    {event.recommendation_score >= 80 && (
                      <Badge className="bg-primary/20 text-primary">
                        Top Match
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mb-1">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {event.recommendation_score}
                  </div>
                  <div className="text-xs text-muted-foreground">Match Score</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.start_time), 'MMM d, h:mm a')}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.format === 'virtual' 
                    ? 'Virtual' 
                    : `${event.location_city || 'TBA'}${event.location_country ? ', ' + event.location_country : ''}`
                  }
                </div>
                {event.friends_attending_count > 0 && (
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <Users className="h-4 w-4" />
                    {event.friends_attending_count} friend{event.friends_attending_count !== 1 ? 's' : ''} attending
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  Why we recommend this:
                </p>
                <p className="text-sm">{event.recommendation_reason}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recommendations.length > 5 && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/dna/convene/events')}
        >
          View All {recommendations.length} Recommendations
        </Button>
      )}
    </div>
  );
};
