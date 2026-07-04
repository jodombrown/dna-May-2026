import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CulturalPattern } from '@/components/shared/CulturalPattern';
import { CuratedEventPreview } from '@/pages/dna/convene/CuratedEventPreview';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Users, ExternalLink, Share2, Clock, MoreHorizontal, XCircle, Trash2, Flag, QrCode, Loader2, Settings, MessageSquare, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { invalidateAllEventCaches } from '@/lib/eventCacheInvalidation';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Nkonsonkonson } from '@/components/icons/adinkra';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUniversalComposer } from '@/hooks/useUniversalComposer';
import { UniversalComposer } from '@/components/composer/UniversalComposer';
import { formatDistanceToNow, format } from 'date-fns';
import { EventCountdown } from '@/components/convene/EventCountdown';
import { AddToCalendarButton } from '@/components/convene/AddToCalendarButton';
// STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
// import { EventSpacesSection } from '@/components/collaboration/EventSpacesSection';
import { EventActivityFeed } from '@/components/events/EventActivityFeed';
import { EventLocationMap } from '@/components/convene/EventLocationMap';
import EventThreadCTA from '@/components/convene/EventThreadCTA';
import { diaEventBus } from '@/services/dia/diaEventBus';
import { platformNotifications } from '@/services/platformNotificationGenerator';
import { DIADetailInsight } from '@/components/dia/DIADetailInsight';
import { ConversationPicker } from '@/components/messaging/ConversationPicker';
import type { EntityReferenceData } from '@/services/messageTypes';
import { StickyRSVPBar } from '@/components/convene/StickyRSVPBar';
import { EventSocialProof } from '@/components/convene/EventSocialProof';
import { EventOrganizerCard } from '@/components/convene/EventOrganizerCard';
import { cn } from '@/lib/utils';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'misleading_information', label: 'Misleading Information' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
] as const;

const EventDetail = () => {
  const { id: slugOrId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [resolvedEventId, setResolvedEventId] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const isLoggedIn = !!user;
  const { markStepComplete } = useProfileCompletion();

  // Auto-mark "Browse an event" profile step as complete
  useEffect(() => {
    if (isLoggedIn) markStepComplete('first_event');
  }, [isLoggedIn, markStepComplete]);
  
  // Animate banner in after a short delay for non-logged-in users
  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  // Sticky header on scroll past hero
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  
  // Use resolved event ID for composer (once we know it)
  const id = resolvedEventId || slugOrId;
  const composer = useUniversalComposer({ eventId: id });

  // Cancel/Delete dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Share in Chat state
  const [showShareInChat, setShowShareInChat] = useState(false);

  // Report modal states
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState('');

  // Check if param is UUID or slug
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // Fetch event details - support both UUID and slug lookups
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['event-detail', slugOrId],
    queryFn: async () => {
      let event = null;
      
      if (slugOrId && isUUID(slugOrId)) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', slugOrId)
          .maybeSingle();
        if (!error) event = data;
      }
      
      if (!event && slugOrId) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slugOrId)
          .maybeSingle();
        if (!error) event = data;
      }

      if (!event) return null;
      
      setResolvedEventId(event.id);
      
      if (slugOrId && isUUID(slugOrId) && event.slug) {
        navigate(`/dna/convene/events/${event.slug}`, { replace: true });
      }
      
      const eventRow: Record<string, unknown> = event;
      
      // Fetch organizer profile
      const { data: organizer } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, headline')
        .eq('id', event.organizer_id)
        .maybeSingle();
      
      // Fetch group info if event is group-hosted
      let group = null;
      if (event.group_id) {
        const { data: groupData } = await supabase
          .from('groups')
          .select('id, name, slug, description, avatar_url, member_count')
          .eq('id', event.group_id)
          .maybeSingle();
        group = groupData;
      }
      
      return {
        ...eventRow,
        organizer,
        group
      };
    },
    enabled: !!slugOrId,
  });

  const event = eventData as Record<string, unknown> | null;

  // Fetch user's RSVP status
  const { data: userRsvp } = useQuery({
    queryKey: ['user-rsvp', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('event_attendees')
        .select('status')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  // Fetch attendees
  const { data: attendees = [] } = useQuery({
    queryKey: ['event-attendees', id],
    queryFn: async () => {
      const { data: attendeeData, error } = await supabase
        .from('event_attendees')
        .select('status, created_at, user_id')
        .eq('event_id', id!)
        .eq('status', 'going')
        .limit(10);

      if (error) throw error;
      if (!attendeeData || attendeeData.length === 0) return [];
      
      const userIds = attendeeData.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return attendeeData.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id) || null,
      }));
    },
    enabled: !!id,
  });

  // Fetch total registration count
  const { data: registrationCount = 0 } = useQuery({
    queryKey: ['event-registration-count', id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_attendees')
        .select('id', { count: 'exact' })
        .eq('event_id', id!)
        .in('status', ['going', 'maybe', 'pending', 'waitlist']);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  // Cancel event mutation
  const cancelEventMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('events')
        .update({ is_cancelled: true, cancellation_reason: 'Cancelled by organizer' })
        .eq('id', id)
        .eq('organizer_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllEventCaches(queryClient, id);
      toast({ title: 'Event Cancelled', description: 'Your event has been cancelled. Attendees will be notified.' });
      setShowCancelDialog(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to cancel event', variant: 'destructive' });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Not authenticated');
      const { error } = await supabase.from('events').delete().eq('id', id).eq('organizer_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllEventCaches(queryClient, id);
      toast({ title: 'Event Deleted', description: 'Your event has been permanently deleted.' });
      navigate('/dna/convene/events');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete event', variant: 'destructive' });
    },
  });

  // Report event mutation
  const reportEventMutation = useMutation({
    mutationFn: async ({ reason, details }: { reason: string; details: string }) => {
      if (!user || !id) throw new Error('Not authenticated');
      const { error } = await supabase.from('event_reports').insert({
        event_id: id, reported_by: user.id, reason, description: details || null, status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Report Submitted', description: 'Thank you for helping keep DNA safe.' });
      setShowReportDialog(false);
      setReportReason('');
      setReportDetails('');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to submit report', variant: 'destructive' });
    },
  });

  const handleReportSubmit = () => {
    if (!reportReason) {
      toast({ title: 'Error', description: 'Please select a reason for your report', variant: 'destructive' });
      return;
    }
    reportEventMutation.mutate({ reason: reportReason, details: reportDetails });
  };

  const canDeleteEvent = registrationCount === 0;

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async (status: 'going' | 'maybe' | 'not_going') => {
      if (!user || !id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('event_attendees')
        .upsert({ event_id: id, user_id: user.id, status }, { onConflict: 'event_id,user_id' });
      if (error) throw error;

      if ((status === 'going' || status === 'maybe') && user?.id && id && event?.organizer_id) {
        diaEventBus.emit({
          type: 'event_rsvp',
          eventId: id,
          attendeeId: user.id,
          hostId: event.organizer_id as string,
        });
        platformNotifications.eventRsvp(
          event.organizer_id as string, user.id, id, (event?.title as string) || '', status
        ).catch(() => { /* non-critical */ });
      }
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['user-rsvp', id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees', id] });
      queryClient.invalidateQueries({ queryKey: ['event-registration-count', id] });
      toast({
        title: 'RSVP Updated',
        description: `You've marked yourself as ${status === 'going' ? 'going' : status === 'maybe' ? 'maybe' : 'not going'}`,
      });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update RSVP', variant: 'destructive' });
    },
  });

  const handleRsvp = (status: 'going' | 'maybe' | 'not_going') => {
    if (!user) {
      toast({ title: 'Authentication Required', description: 'Please log in to RSVP to events', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    rsvpMutation.mutate(status);
  };

  const handleShareEvent = async () => {
    const url = window.location.href;
    const title = (event?.title as string) || 'Event';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied', description: 'Event link copied to clipboard' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Event not found</p>
              <Button variant="link" onClick={() => navigate('/dna/convene/events')} className="mt-4">Back to events</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Curated event → render lightweight preview ──
  if (event.is_curated) {
    return (
      <div className="min-h-screen bg-background">
        <CuratedEventPreview event={event} />
      </div>
    );
  }

  const isOrganizer = user?.id === event.organizer_id;
  const isPastEvent = event.end_time ? new Date(event.end_time as string) < new Date() : false;
  const currentRsvp = userRsvp?.status || null;
  const organizer = event.organizer as { id: string; username: string | null; full_name: string; avatar_url: string | null; headline?: string | null } | null;
  const group = event.group as { id: string; name: string; slug: string; avatar_url: string | null; member_count: number } | null;
  const attendeeProfiles = attendees
    .filter((a: Record<string, unknown>) => a.profile)
    .map((a: Record<string, unknown>) => {
      const p = a.profile as { id: string; username: string | null; full_name: string; avatar_url: string | null };
      return p;
    });

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <UnifiedHeader />

      {/* ── Sticky Scroll Header ─────────────────────── */}
      <motion.div
        initial={false}
        animate={{ y: showStickyHeader ? 0 : -60, opacity: showStickyHeader ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="fixed top-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
      >
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold truncate">{event.title as string}</h2>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={handleShareEvent}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
      
      {/* Sticky CTA Banner for non-logged-in users */}
      {!isLoggedIn && showBanner && (
        <div className="sticky top-0 z-40 px-4 sm:px-0 pt-2">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-gradient-to-r from-[hsl(var(--module-convene))] via-[hsl(var(--module-convene))]/90 to-[hsl(var(--module-convene))] sm:mx-auto sm:max-w-3xl rounded-lg shadow-md"
          >
            <div className="px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white min-w-0">
                <Nkonsonkonson className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium truncate">
                  You're invited! Join DNA to attend this event
                </span>
              </div>
              <Button size="sm" className="bg-white text-foreground hover:bg-white/90 shrink-0 h-7 text-xs px-3" asChild>
                <Link to="/auth?mode=signup">Sign Up</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </button>

        {/* Hero Image */}
        <div ref={heroRef} className="relative overflow-hidden rounded-lg mb-8">
          <CulturalPattern pattern="kente" opacity={0.05} />
          {(event.cover_image_url as string) ? (
            <div className="aspect-[2.5/1] w-full overflow-hidden">
              <img src={event.cover_image_url as string} alt={event.title as string} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-[3/1] w-full bg-[hsl(var(--module-convene-light))]" />
          )}
        </div>

        {/* Title + Badges + Actions */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="secondary" className="capitalize">{event.event_type as string}</Badge>
                <Badge variant="outline" className="capitalize">{(event.format as string).replace('_', ' ')}</Badge>
                {isPastEvent && <Badge variant="secondary">Past Event</Badge>}
                {event.is_cancelled && <Badge variant="destructive">Cancelled</Badge>}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">{event.title as string}</h1>
              <EventCountdown startTime={event.start_time as string} endTime={event.end_time as string} className="mt-1" />
            </div>

            {/* Action buttons — condensed */}
            <div className="flex gap-2 flex-wrap items-center">
              <AddToCalendarButton event={{ id: event.id as string, title: event.title as string, description: event.description as string | undefined, start_time: event.start_time as string, end_time: event.end_time as string, location_name: event.location_name as string | undefined, location_address: event.location_address as string | undefined, location_city: event.location_city as string | undefined, location_country: event.location_country as string | undefined, meeting_url: event.meeting_url as string | undefined, format: (event.format as 'in_person' | 'virtual' | 'hybrid') || 'in_person' }} organizer={organizer} variant="outline" />
              <Button variant="outline" size="icon" onClick={handleShareEvent}>
                <Share2 className="h-4 w-4" />
              </Button>
              {isLoggedIn && (
                <Button variant="outline" size="sm" onClick={() => setShowShareInChat(true)}>
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Share in Chat</span>
                </Button>
              )}
              {isOrganizer ? (
                <>
                  <Button onClick={() => navigate(`/dna/convene/events/${id}/manage`)}>
                    <Settings className="h-4 w-4 mr-2" /> Manage
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate(`/dna/convene/events/${id}/edit`)}>Edit Event</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/dna/convene/events/${id}/check-in`)}>
                        <QrCode className="mr-2 h-4 w-4" /> Check-in
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!event.is_cancelled && (
                        <DropdownMenuItem onClick={() => setShowCancelDialog(true)} className="text-amber-600 focus:text-amber-600">
                          <XCircle className="mr-2 h-4 w-4" /> Cancel Event
                        </DropdownMenuItem>
                      )}
                      {canDeleteEvent ? (
                        <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                        </DropdownMenuItem>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5 text-sm opacity-50">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                            </div>
                          </TooltipTrigger>
                          <TooltipContent><p>Cannot delete events with registrations.</p></TooltipContent>
                        </Tooltip>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-destructive focus:text-destructive">
                      <Flag className="mr-2 h-4 w-4" /> Report Event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* ── Main Content ───────────────────────────── */}
          <div className="space-y-6">
            {/* Organizer Card — enhanced */}
            {organizer && (
              <EventOrganizerCard organizer={organizer} groupHost={group} />
            )}

            {/* Social Proof */}
            {id && (
              <EventSocialProof
                eventId={id}
                attendees={attendeeProfiles}
                totalCount={registrationCount}
              />
            )}

            {/* Details Card */}
            <Card>
              <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{format(new Date(event.start_time as string), 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.start_time as string), 'h:mm a')} - {format(new Date(event.end_time as string), 'h:mm a')} {event.timezone as string}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    {event.format === 'virtual' ? (
                      <>
                        <p className="font-medium">Online Event</p>
                        {event.meeting_url && (
                          <a href={event.meeting_url as string} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1">
                            Join meeting <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{event.location_name as string}</p>
                        {event.location_address && <p className="text-sm text-muted-foreground">{event.location_address as string}</p>}
                        <p className="text-sm text-muted-foreground">{event.location_city as string}, {event.location_country as string}</p>
                      </>
                    )}
                  </div>
                </div>

                {event.max_attendees && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {registrationCount} / {event.max_attendees as number} registered
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs: Description + Activity */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="description">
                <Card>
                  <CardHeader><CardTitle>About This Event</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{event.description as string}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="activity">
                <EventActivityFeed eventId={(event.id as string)} eventTitle={(event.title as string)} canPost={!!userRsvp} />
              </TabsContent>
            </Tabs>

            {/* Attendees */}
            {attendees.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Attendees ({registrationCount})</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {attendees.map((attendee: Record<string, unknown>) => {
                      const profile = attendee.profile as { id: string; username: string; full_name: string; avatar_url: string | null } | null;
                      if (!profile) return null;
                      return (
                        <div key={profile.id} className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => navigate(`/dna/${profile.username}`)}>
                          <Avatar>
                            <AvatarImage src={profile.avatar_url || ''} />
                            <AvatarFallback>{profile.full_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{profile.full_name}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Sidebar ────────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* RSVP Card — desktop only */}
              {!isPastEvent && !isOrganizer && (
                <Card>
                  <CardHeader><CardTitle>RSVP</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full" variant={currentRsvp === 'going' ? 'default' : 'outline'}
                      onClick={() => handleRsvp('going')} disabled={rsvpMutation.isPending}>Going</Button>
                    <Button className="w-full" variant={currentRsvp === 'maybe' ? 'default' : 'outline'}
                      onClick={() => handleRsvp('maybe')} disabled={rsvpMutation.isPending}>Maybe</Button>
                    <Button className="w-full" variant={currentRsvp === 'not_going' ? 'default' : 'outline'}
                      onClick={() => handleRsvp('not_going')} disabled={rsvpMutation.isPending}>Can't Go</Button>
                  </CardContent>
                </Card>
              )}

              {(event.format === 'in_person' || event.format === 'hybrid') && (
                <EventLocationMap
                  locationName={event.location_name as string}
                  locationAddress={event.location_address as string}
                  city={event.location_city as string}
                  country={event.location_country as string}
                  lat={event.location_lat as number}
                  lng={event.location_lng as number}
                />
              )}

              <DIADetailInsight surface="event_detail" entityId={event.id as string} />

              <EventThreadCTA
                eventId={event.id as string}
                eventTitle={event.title as string}
                isRegistered={!!currentRsvp && currentRsvp !== 'not_going'}
                isPastEvent={isPastEvent}
                isOrganizer={isOrganizer}
              />

              {/* STUBBED: Phase 2 teardown. EventSpacesSection removed while
                  COLLABORATE is being rebuilt. Restore in Phase 3. */}

              <Card>
                <CardContent className="pt-6">
                  <AddToCalendarButton event={{ id: event.id as string, title: event.title as string, description: event.description as string | undefined, start_time: event.start_time as string, end_time: event.end_time as string, location_name: event.location_name as string | undefined, location_address: event.location_address as string | undefined, location_city: event.location_city as string | undefined, location_country: event.location_country as string | undefined, meeting_url: event.meeting_url as string | undefined, format: (event.format as 'in_person' | 'virtual' | 'hybrid') || 'in_person' }} organizer={organizer} variant="outline" size="default" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky RSVP Bar (Mobile) ───────────────── */}
      {id && (
        <StickyRSVPBar
          eventId={id}
          isPastEvent={isPastEvent}
          isCancelled={!!event.is_cancelled}
          isOrganizer={isOrganizer}
          currentRsvp={currentRsvp}
          maxAttendees={event.max_attendees as number | null}
          attendeeCount={registrationCount}
          isSubmitting={rsvpMutation.isPending}
          onRsvp={handleRsvp}
        />
      )}

      {/* Universal Composer */}
      <UniversalComposer
        isOpen={composer.isOpen} mode={composer.mode} context={composer.context}
        isSubmitting={composer.isSubmitting} onClose={composer.close} onModeChange={composer.switchMode}
        successData={composer.successData} onSubmit={composer.submit} onDismissSuccess={composer.dismissSuccess}
      />

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Event</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? Attendees will be notified. The event will remain visible but marked as cancelled.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Event</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelEventMutation.mutate()} disabled={cancelEventMutation.isPending}>
              {cancelEventMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelling...</> : 'Cancel Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEventMutation.mutate()} className="bg-destructive hover:bg-destructive/90" disabled={deleteEventMutation.isPending}>
              {deleteEventMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Event</DialogTitle>
            <DialogDescription>Help us understand what's wrong with this event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-reason">Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger id="report-reason"><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-details">Additional Details (Optional)</Label>
              <Textarea id="report-details" placeholder="Provide any additional context..." value={reportDetails} onChange={e => setReportDetails(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button onClick={handleReportSubmit} disabled={reportEventMutation.isPending || !reportReason}>
              {reportEventMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share in Chat */}
      {event && (
        <ConversationPicker
          open={showShareInChat}
          onOpenChange={setShowShareInChat}
          entityReference={{
            entityType: 'event',
            entityId: event.id as string,
            entityTitle: event.title as string,
            entityPreview: (event.description as string)?.slice(0, 100),
            entityImage: event.cover_image_url as string,
          }}
        />
      )}
    </div>
  );
};
export default EventDetail;
