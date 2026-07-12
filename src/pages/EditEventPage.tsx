import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EventFormFields, EventFormData } from '@/components/convene/EventFormFields';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  eventStateWrite,
  isEventStatus,
  isEventVisibility,
  type EventStatus,
  type EventVisibility,
} from '@/lib/events/state';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Helper to check if a string is a UUID
const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function EditEventPage() {
  const { id: slugOrId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedEventId, setResolvedEventId] = useState<string | null>(null);

  // Settings state (separate from the main form)
  const [settings, setSettings] = useState<{
    status: EventStatus;
    visibility: EventVisibility;
    requires_approval: boolean;
    allow_guests: boolean;
  }>({
    status: 'draft',
    visibility: 'public',
    requires_approval: false,
    allow_guests: false,
  });

  // First resolve slug to UUID if needed
  const { data: eventId, isLoading: isResolvingId } = useQuery({
    queryKey: ['resolve-event-id', slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;
      
      // If it's already a UUID, use it directly
      if (isUUID(slugOrId)) {
        return slugOrId;
      }
      
      // Otherwise, look up by slug
      const { data, error } = await supabase
        .from('events')
        .select('id, slug')
        .eq('slug', slugOrId)
        .maybeSingle();
      
      if (error || !data) return null;
      return data.id;
    },
    enabled: !!slugOrId,
  });

  // Redirect UUID URLs to slug URLs for SEO + update resolved ID
  useEffect(() => {
    if (eventId) {
      setResolvedEventId(eventId);
      
      // Fetch slug if we navigated with UUID
      const isUUIDUrl = slugOrId && isUUID(slugOrId);
      if (isUUIDUrl) {
        supabase
          .from('events')
          .select('slug')
          .eq('id', eventId)
          .single()
          .then(({ data }) => {
            if (data?.slug) {
              navigate(`/dna/convene/events/${data.slug}/edit`, { replace: true });
            }
          });
      }
    }
  }, [eventId, slugOrId, navigate]);

  // Fetch event details using the resolved UUID
  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event-details', resolvedEventId, user?.id],
    queryFn: async () => {
      if (!resolvedEventId || !user) return null;

      const { data, error } = await supabase.rpc('get_event_details', {
        p_event_id: resolvedEventId,
        p_user_id: user.id,
      });

      if (error) throw error;
      const details = data?.[0] || null;
      if (!details) return null;

      // get_event_details predates the (status, visibility) columns —
      // fetch them directly until the RPC is updated.
      const { data: stateRow } = await supabase
        .from('events')
        .select('status, visibility')
        .eq('id', resolvedEventId)
        .maybeSingle();

      return {
        ...details,
        status: stateRow?.status ?? null,
        visibility: stateRow?.visibility ?? null,
      };
    },
    enabled: !!resolvedEventId && !!user,
  });

  // Form data matching EventFormFields interface
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    subtitle: '',
    description: '',
    format: 'in_person',
    eventDate: '',
    eventTime: '',
    eventEndDate: '',
    eventEndTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: '',
    meetingUrl: '',
    coverImageUrl: '',
    dressCode: '',
    maxAttendees: undefined,
    tags: [],
    agenda: [],
  });

  // Populate form when event loads
  useEffect(() => {
    if (event) {
      // Check if user is organizer
      if (event.organizer_id !== user?.id) {
        toast({
          title: 'Access Denied',
          description: 'Only the organizer can edit this event',
          variant: 'destructive',
        });
        navigate(`/dna/convene/events/${slugOrId}`);
        return;
      }

      // Parse start datetime
      const startDate = parseISO(event.start_time);
      const endDate = parseISO(event.end_time);

      // Build location string from components
      const locationParts = [
        event.location_name,
        event.location_city,
        event.location_country
      ].filter(Boolean);

      setFormData({
        title: event.title || '',
        subtitle: '',
        description: event.description || '',
        format: (event.format as 'in_person' | 'virtual' | 'hybrid') || 'in_person',
        eventDate: format(startDate, 'yyyy-MM-dd'),
        eventTime: format(startDate, 'HH:mm'),
        eventEndDate: format(endDate, 'yyyy-MM-dd'),
        eventEndTime: format(endDate, 'HH:mm'),
        timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: locationParts.join(', '),
        meetingUrl: event.meeting_url || '',
        coverImageUrl: event.cover_image_url || '',
        maxAttendees: event.max_attendees || undefined,
        tags: [],
        agenda: [],
      });

      setSettings({
        status: isEventStatus(event.status)
          ? event.status
          : event.is_cancelled
            ? 'cancelled'
            : 'draft',
        visibility: isEventVisibility(event.visibility)
          ? event.visibility
          : event.is_public === false
            ? 'private'
            : 'public',
        requires_approval: event.requires_approval ?? false,
        allow_guests: event.allow_guests ?? false,
      });
    }
  }, [event, user, slugOrId, navigate, toast]);

  const handleFormChange = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateEventMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedEventId || !user) throw new Error('Not authenticated');

      // Validation
      if (!formData.title.trim()) {
        throw new Error('Event title is required');
      }

      if (!formData.description.trim() || formData.description.length < 50) {
        throw new Error('Description must be at least 50 characters');
      }

      if (!formData.eventDate || !formData.eventTime) {
        throw new Error('Start date and time are required');
      }

      if (!formData.eventEndDate || !formData.eventEndTime) {
        throw new Error('End date and time are required');
      }

      // Build timestamps
      const start_time = new Date(`${formData.eventDate}T${formData.eventTime}`).toISOString();
      const end_time = new Date(`${formData.eventEndDate}T${formData.eventEndTime}`).toISOString();

      if (new Date(end_time) <= new Date(start_time)) {
        throw new Error('End time must be after start time');
      }

      // Format validation
      if (formData.format === 'virtual' && !formData.meetingUrl) {
        throw new Error('Virtual events require a meeting URL');
      }

      if (formData.format === 'in_person' && !formData.location) {
        throw new Error('In-person events require a location');
      }

      if (formData.format === 'hybrid' && (!formData.meetingUrl || !formData.location)) {
        throw new Error('Hybrid events require both location and meeting URL');
      }

      // Use locationData if available, otherwise parse from string
      let locationName = null;
      let locationCity = null;
      let locationCountry = null;
      let locationLat = null;
      let locationLng = null;

      if (formData.locationData && formData.locationData.displayName) {
        locationName = formData.locationData.venueName || null;
        locationCity = formData.locationData.city || null;
        locationCountry = formData.locationData.country || null;
        locationLat = formData.locationData.lat || null;
        locationLng = formData.locationData.lng || null;
      } else if (formData.location) {
        const locationParts = formData.location.split(',').map(s => s.trim());
        locationName = locationParts[0] || null;
        locationCity = locationParts[1] || null;
        locationCountry = locationParts[2] || null;
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description,
          format: formData.format,
          location_name: locationName,
          location_city: locationCity,
          location_country: locationCountry,
          location_lat: locationLat,
          location_lng: locationLng,
          meeting_url: formData.meetingUrl || null,
          start_time,
          end_time,
          max_attendees: formData.maxAttendees || null,
          cover_image_url: formData.coverImageUrl || null,
          // (status, visibility) plus the transitional legacy mirror.
          // Cancelled/completed events keep their status — this page only
          // moves an event between draft and published.
          ...eventStateWrite(
            settings.status === 'draft' || settings.status === 'published'
              ? { status: settings.status, visibility: settings.visibility }
              : { visibility: settings.visibility }
          ),
          requires_approval: settings.requires_approval,
          allow_guests: settings.allow_guests,
          timezone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        .eq('id', resolvedEventId)
        .eq('organizer_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-details', resolvedEventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: 'Event updated!',
        description: 'Your changes have been saved',
      });
      navigate(`/dna/convene/events/${slugOrId}`);
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    setIsSubmitting(true);
    updateEventMutation.mutate();
  };

  if (isResolvingId || isLoadingEvent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 text-muted-foreground">
            Loading event...
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Event not found</h2>
            <Button onClick={() => navigate('/dna/convene/events')}>
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dna/convene/events/${slugOrId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Edit Event</h1>
            <p className="text-sm text-muted-foreground">
              Update your event details
            </p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || updateEventMutation.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Main Form - Same structure as composer */}
        <Card className="p-6">
          <EventFormFields
            formData={formData}
            onChange={handleFormChange}
          />

          {/* Settings Section - Separated with divider */}
          <div className="flex items-center gap-3 pt-6 mt-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Event Settings</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-4 mt-4">
            {settings.status === 'draft' || settings.status === 'published' ? (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="event-status" className="text-sm font-medium">Publish Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Drafts are only visible to you
                  </p>
                </div>
                <Select
                  value={settings.status}
                  onValueChange={(value) =>
                    setSettings(s => ({ ...s, status: value as EventStatus }))
                  }
                >
                  <SelectTrigger id="event-status" className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Save as draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Publish Status</Label>
                  <p className="text-xs text-muted-foreground">
                    This event is {settings.status} and can no longer be published from here
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="event-visibility" className="text-sm font-medium">Audience</Label>
                <p className="text-xs text-muted-foreground">
                  Who can discover and view this event
                </p>
              </div>
              <Select
                value={settings.visibility}
                onValueChange={(value) =>
                  setSettings(s => ({ ...s, visibility: value as EventVisibility }))
                }
              >
                <SelectTrigger id="event-visibility" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requires-approval" className="text-sm font-medium">Require Approval</Label>
                <p className="text-xs text-muted-foreground">
                  You'll approve each attendee before they can join
                </p>
              </div>
              <Switch
                id="requires-approval"
                checked={settings.requires_approval}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, requires_approval: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow-guests" className="text-sm font-medium">Allow Guests</Label>
                <p className="text-xs text-muted-foreground">
                  Attendees can bring guests
                </p>
              </div>
              <Switch
                id="allow-guests"
                checked={settings.allow_guests}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, allow_guests: checked }))}
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/dna/convene/events/${slugOrId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || updateEventMutation.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
