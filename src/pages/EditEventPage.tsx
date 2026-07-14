/**
 * EditEventPage — a thin wrapper: resolve the slug, load the event, render
 * <EventForm level="full" />. All state, validation, and submission live in
 * the unified form (eventFormSchema / useEventForm / EventForm).
 */
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EventForm } from '@/components/events/EventForm';
import { ConveneShell } from '@/components/convene/ConveneShell';
import {
  eventRowToFormValues,
  eventRowStatus,
  type AuthorableEventRow,
} from '@/lib/events/eventFormSchema';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function EditEventPage() {
  const { id: slugOrId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: event, isLoading } = useQuery({
    queryKey: ['edit-event', slugOrId, user?.id],
    queryFn: async () => {
      if (!slugOrId || !user) return null;
      let query = supabase.from('events').select('*');
      query = isUUID(slugOrId) ? query.eq('id', slugOrId) : query.eq('slug', slugOrId);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slugOrId && !!user,
  });

  // Canonical URL: a UUID in the address bar becomes the slug.
  useEffect(() => {
    if (event?.slug && slugOrId && isUUID(slugOrId)) {
      navigate(`/dna/convene/events/${event.slug}/edit`, { replace: true });
    }
  }, [event, slugOrId, navigate]);

  // Only the organizer edits their event.
  useEffect(() => {
    if (event && user && event.organizer_id !== user.id) {
      toast({
        title: 'Access denied',
        description: 'Only the organizer can edit this event',
        variant: 'destructive',
      });
      navigate(`/dna/convene/events/${slugOrId}`);
    }
  }, [event, user, slugOrId, navigate, toast]);

  if (isLoading) {
    return (
      <ConveneShell>
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="py-12 text-center text-muted-foreground">Loading event…</div>
          </div>
        </div>
      </ConveneShell>
    );
  }

  if (!event) {
    return (
      <ConveneShell>
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="py-12 text-center">
              <h2 className="mb-2 text-2xl font-bold">Event not found</h2>
              <Button onClick={() => navigate('/dna/convene/events')}>Back to Events</Button>
            </div>
          </div>
        </div>
      </ConveneShell>
    );
  }

  const row = event as unknown as AuthorableEventRow;
  const status = eventRowStatus(row);

  return (
    // Mobile chrome comes from the shared ConveneShell.
    <ConveneShell>
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dna/convene/events/${slugOrId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Edit event</h1>
            <p className="text-sm text-muted-foreground">
              {status === 'draft' ? 'Still a draft — only you can see it' : 'Update your event'}
            </p>
          </div>
        </div>

        <Card className="p-6">
          <EventForm
            level="full"
            mode="edit"
            eventId={event.id}
            initialValues={eventRowToFormValues(row)}
            currentStatus={status}
            onSuccess={() => navigate(`/dna/convene/events/${event.slug || event.id}`)}
            onDeleted={() => navigate('/dna/convene/events')}
          />
        </Card>
      </div>
    </div>
    </ConveneShell>
  );
}
