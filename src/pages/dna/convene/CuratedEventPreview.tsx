/**
 * DNA | CONVENE — Curated Event Preview
 *
 * Lightweight detail page for DNA-curated events.
 * Shows key info + prominent external source link + internal RSVP.
 * No organizer card, activity feed, attendees grid, or manage actions.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Video, Globe, ExternalLink, Share2, Heart, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Nkonsonkonson } from '@/components/icons/adinkra';

interface CuratedEventPreviewProps {
  event: Record<string, unknown>;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function CuratedEventPreview({ event }: CuratedEventPreviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const eventId = event.id as string;
  const title = event.title as string;
  const description = event.description as string | null;
  const coverImg = (event.cover_image_url || event.banner_url || event.image_url) as string | null;
  const startTime = event.start_time as string | null;
  const endTime = event.end_time as string | null;
  const locationName = event.location_name as string | null;
  const locationCity = event.location_city as string | null;
  const locationCountry = event.location_country as string | null;
  const eventFormat = event.format as string | null;
  const curatedSource = event.curated_source as string | null;
  const curatedSourceUrl = event.curated_source_url as string | null;
  const sourceDomain = curatedSourceUrl ? extractDomain(curatedSourceUrl) : curatedSource;

  const startDate = startTime ? new Date(startTime) : null;
  const endDate = endTime ? new Date(endTime) : null;

  const isVirtual = eventFormat === 'virtual';
  const isHybrid = eventFormat === 'hybrid';
  const locationParts = [locationName, locationCity, locationCountry].filter(Boolean);

  // Fetch user RSVP
  const { data: userRsvp } = useQuery({
    queryKey: ['user-rsvp', eventId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('event_attendees')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const currentRsvp = userRsvp?.status || null;

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async (status: 'going' | 'maybe' | 'not_going') => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('event_attendees')
        .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: 'event_id,user_id' });
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['user-rsvp', eventId, user?.id] });
      toast({
        title: 'RSVP Updated',
        description: `You've marked yourself as ${status === 'going' ? 'interested' : status === 'maybe' ? 'maybe' : 'not interested'}`,
      });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update RSVP', variant: 'destructive' });
    },
  });

  const handleRsvp = (status: 'going' | 'maybe' | 'not_going') => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please log in to RSVP', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    rsvpMutation.mutate(status);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied', description: 'Event link copied to clipboard' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Curated badge */}
      <div className="flex items-center gap-2">
        <Badge className="bg-[hsl(var(--module-connect))]/10 text-[hsl(var(--module-connect))] border-[hsl(var(--module-connect))]/20 hover:bg-[hsl(var(--module-connect))]/15">
          <Nkonsonkonson className="h-3 w-3 mr-1" />
          Curated by DNA
        </Badge>
      </div>

      {/* Cover image */}
      {coverImg && (
        <div className="rounded-lg overflow-hidden">
          <img
            src={coverImg}
            alt={title}
            className="w-full h-48 sm:h-64 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl sm:text-h1 font-serif text-foreground leading-tight">
        {title}
      </h1>

      {/* Date & Location */}
      <div className="space-y-3">
        {startDate && (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-11 h-11 border border-border rounded-lg bg-background flex flex-col items-center justify-center">
              <span className="text-[10px] font-semibold text-[hsl(var(--module-connect))] uppercase leading-none">
                {format(startDate, 'MMM').toUpperCase()}
              </span>
              <span className="text-lg font-bold leading-none mt-0.5">
                {format(startDate, 'd')}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">
                {format(startDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(startDate, 'h:mm a')}
                {endDate ? ` – ${format(endDate, 'h:mm a')}` : ''}
              </p>
            </div>
          </div>
        )}

        {(locationParts.length > 0 || isVirtual || isHybrid) && (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-11 h-11 border border-border rounded-lg bg-background flex items-center justify-center">
              {isVirtual ? <Video className="h-5 w-5 text-muted-foreground" /> :
               isHybrid ? <Globe className="h-5 w-5 text-muted-foreground" /> :
               <MapPin className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isVirtual ? 'Virtual Event' : isHybrid ? 'Hybrid Event' : locationParts[0]}
              </p>
              {locationParts.length > 1 && (
                <p className="text-sm text-muted-foreground">{locationParts.slice(1).join(', ')}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Source attribution + Register CTA */}
      {curatedSourceUrl && (
        <Card className="border-[hsl(var(--module-connect))]/20 bg-[hsl(var(--module-connect))]/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Register at the source</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                via {sourceDomain} <ExternalLink className="h-2.5 w-2.5" />
              </p>
            </div>
            <Button
              className="bg-[hsl(var(--module-connect))] hover:bg-[hsl(var(--module-connect))]/90 text-white shrink-0"
              onClick={() => window.open(curatedSourceUrl, '_blank', 'noopener,noreferrer')}
            >
              Register at Source
              <ExternalLink className="h-4 w-4 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Description */}
      {description && (
        <div className="prose prose-sm max-w-none text-foreground/90">
          <p className="whitespace-pre-wrap">{description}</p>
        </div>
      )}

      <Separator />

      {/* RSVP buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Track this event on DNA</h3>
        <div className="flex flex-wrap gap-2">
          {(['going', 'maybe', 'not_going'] as const).map((status) => {
            const labels = { going: 'Interested', maybe: 'Maybe', not_going: 'Not Interested' };
            const isActive = currentRsvp === status;
            return (
              <Button
                key={status}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-9',
                  isActive && status !== 'not_going' && 'bg-[hsl(var(--module-connect))] hover:bg-[hsl(var(--module-connect))]/90 text-white',
                )}
                onClick={() => handleRsvp(status)}
                disabled={rsvpMutation.isPending}
              >
                {status === 'going' && <Heart className={cn('h-3.5 w-3.5 mr-1', isActive && 'fill-current')} />}
                {labels[status]}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CuratedEventPreview;
