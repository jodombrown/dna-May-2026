import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
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
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
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
import { formatEventPlace, pickEventPlace } from '@/lib/events/formatPlace';
import { EventTime } from '@/components/events/EventTime';
import { isEventCompleted } from '@/lib/events/lifecycle';
import { eventStateWrite } from '@/lib/events/state';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EventCountdown } from '@/components/convene/EventCountdown';
import { AddToCalendarButton } from '@/components/convene/AddToCalendarButton';
// STUBBED: Phase 2 teardown. Restore in Phase 3 rebuild.
// import { EventSpacesSection } from '@/components/collaboration/EventSpacesSection';
import { EventActivityFeed } from '@/components/events/EventActivityFeed';
import { LocationMap } from '@/components/maps/LocationMap';
import EventThreadCTA from '@/components/convene/EventThreadCTA';
import { diaEventBus } from '@/services/dia/diaEventBus';
import { platformNotifications } from '@/services/platformNotificationGenerator';
import { DIADetailInsight } from '@/components/dia/DIADetailInsight';
import { ConversationPicker } from '@/components/messaging/ConversationPicker';
import type { EntityReferenceData } from '@/services/messageTypes';
import { StickyRSVPBar, tieredAttendeeText } from '@/components/convene/StickyRSVPBar';
import { ConveneShell } from '@/components/convene/ConveneShell';
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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const isLoggedIn = !!user;
  const { markStepComplete } = useProfileCompletion();

  // Auto-mark "Browse an event" profile step as complete
  useEffect(() => {
    if (isLoggedIn) markStepComplete('first_event');
  }, [isLoggedIn, markStepComplete]);
  
  // Animate the join banner in after a short delay for signed-out visitors.
  // Derived from `user` directly and reset the moment a user exists, so the
  // banner can never disagree with auth state or coexist with organizer CTAs.
  useEffect(() => {
    if (user) {
      setShowBanner(false);
      return;
    }
    const timer = setTimeout(() => setShowBanner(true), 500);
    return () => clearTimeout(timer);
  }, [user]);

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

  // Fetch event details.
  //  • signed OUT → the public projection (SECURITY DEFINER, granted to anon):
  //    organizer name/avatar, going_count, place with state — and DELIBERATELY
  //    no meeting_url, agenda, or organizer_id.
  //  • signed IN  → the table read; RLS returns the viewer's full entitlement
  //    (meeting_url, agenda and manage controls follow from it).
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['event-detail', slugOrId, isLoggedIn],
    queryFn: async () => {
      if (!isLoggedIn) {
        const { data, error } = await supabase.rpc('get_public_event', {
          p_slug_or_id: slugOrId!,
        });
        if (error) throw error;
        const row = data?.[0];
        if (!row) return null;

        if (slugOrId && isUUID(slugOrId) && row.slug) {
          navigate(`/dna/convene/events/${row.slug}`, { replace: true });
        }

        return {
          ...row,
          // The projection hands back flat organizer_* fields; the organizer
          // card wants an object. No organizer_id is exposed to strangers.
          organizer: row.organizer_name
            ? {
                id: '',
                username: row.organizer_username,
                full_name: row.organizer_name,
                avatar_url: row.organizer_avatar_url,
                headline: null,
              }
            : null,
          group: null,
        };
      }

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

  // The event's UUID, derived straight from the fetched row — never guessed
  // from the URL param (which may be a slug) and never staged through state,
  // so a cached load can't race ahead of it.
  const eventId = (event?.id as string | undefined) ?? null;


  // Fetch user's RSVP status
  const { data: userRsvp, error: rsvpError } = useQuery({
    queryKey: ['user-rsvp', eventId, user?.id],
    queryFn: async () => {
      if (!user || !eventId) return null;
      const { data, error } = await supabase
        .from('event_attendees')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user && !!eventId,
  });

  // Fetch attendees
  const { data: attendees = [], error: attendeesError } = useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: async () => {
      const { data: attendeeData, error } = await supabase
        .from('event_attendees')
        .select('status, created_at, user_id')
        .eq('event_id', eventId!)
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
    // Attendee rows join profiles, which anon cannot read; signed-out visitors
    // get their headcount from the projection's going_count instead.
    enabled: !!eventId && isLoggedIn,
  });

  // Fetch total registration count
  const { data: registrationCount = 0, error: registrationCountError } = useQuery({
    queryKey: ['event-registration-count', eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_attendees')
        .select('id', { count: 'exact' })
        .eq('event_id', eventId!)
        .in('status', ['going', 'maybe', 'pending', 'waitlist']);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId && isLoggedIn,
  });

  // These three reads fail silently in the UI (their defaults — no RSVP,
  // empty attendees, count 0 — are plausible values), so never swallow
  // their errors: log loudly so a wrong headcount is diagnosable.
  useEffect(() => {
    if (rsvpError) console.error('[EventDetail] RSVP status query failed:', rsvpError);
    if (attendeesError) console.error('[EventDetail] Attendees query failed:', attendeesError);
    if (registrationCountError) console.error('[EventDetail] Registration count query failed:', registrationCountError);
  }, [rsvpError, attendeesError, registrationCountError]);

  // Cancel event mutation
  const cancelEventMutation = useMutation({
    mutationFn: async () => {
      if (!user || !eventId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('events')
        .update({
          // status: 'cancelled' plus the transitional legacy mirror
          ...eventStateWrite({ status: 'cancelled' }),
          cancellation_reason: 'Cancelled by organizer',
        })
        .eq('id', eventId)
        .eq('organizer_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllEventCaches(queryClient, eventId ?? undefined);
      toast({ title: 'Event Cancelled', description: 'Your event has been cancelled. Attendees will be notified.' });
      setShowCancelDialog(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to cancel event', variant: 'destructive' });
    },
  });

  // Publish event mutation (draft → published)
  const publishEventMutation = useMutation({
    mutationFn: async () => {
      if (!user || !eventId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('events')
        .update({
          // status: 'published' plus the transitional legacy mirror
          ...eventStateWrite({ status: 'published' }),
        })
        .eq('id', eventId)
        .eq('organizer_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllEventCaches(queryClient, eventId ?? undefined);
      toast({ title: 'Event Published', description: 'Your event is now live and visible to attendees.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to publish event', description: error.message, variant: 'destructive' });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      if (!user || !eventId) throw new Error('Not authenticated');
      const { error } = await supabase.from('events').delete().eq('id', eventId).eq('organizer_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllEventCaches(queryClient, eventId ?? undefined);
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
      if (!user || !eventId) throw new Error('Not authenticated');
      const { error } = await supabase.from('event_reports').insert({
        event_id: eventId, reported_by: user.id, reason, description: details || null, status: 'pending',
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
      if (!user || !eventId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('event_attendees')
        .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: 'event_id,user_id' });
      if (error) throw error;

      if ((status === 'going' || status === 'maybe') && user?.id && eventId && event?.organizer_id) {
        diaEventBus.emit({
          type: 'event_rsvp',
          eventId,
          attendeeId: user.id,
          hostId: event.organizer_id as string,
        });
        platformNotifications.eventRsvp(
          event.organizer_id as string, user.id, eventId, (event?.title as string) || '', status
        ).catch(() => { /* non-critical */ });
      }
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['user-rsvp', eventId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-registration-count', eventId] });
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

  // Never redirect on an unresolved session: `loading` is true during the
  // initial session check, so `user` is null for a signed-in visitor on any
  // cold load or hard refresh. A bare `!user` redirect here would bounce
  // organizers to the public view — with replace, permanently. Wait it out
  // behind a neutral loader (no shell: the viewer is not yet known to be a
  // member, so no in-app chrome may flash).
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Signed out (session resolved) → the public event page, which carries
  // PublicSiteHeader instead of in-app chrome. Redirect on the route param,
  // NOT on the fetched-row eventId (null until the query lands, and may be a
  // slug anyway): /event/:slugOrId resolves either form via get_public_event.
  if (!user) {
    return <Navigate to={`/event/${slugOrId}`} replace />;
  }

  if (isLoading) {
    return (
      <ConveneShell>
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
      </ConveneShell>
    );
  }

  if (!event) {
    return (
      <ConveneShell>
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
      </ConveneShell>
    );
  }

  // ── Curated event → render lightweight preview ──
  if (event.is_curated) {
    return (
      <ConveneShell>
        <div className="min-h-screen bg-background">
          <CuratedEventPreview event={event} />
        </div>
      </ConveneShell>
    );
  }

  // Guard against undefined === undefined: a signed-out visitor has no user
  // and the projection carries no organizer_id, so both sides would be
  // undefined and wrongly read as "organizer".
  const isOrganizer = !!user && user.id === event.organizer_id;
  // Canonical event state. (status, visibility) is the source of truth;
  // the legacy cancelled/published boolean columns are trigger-derived
  // mirrors scheduled for DROP and must not be read here.
  const eventStatus = (event.status as string | undefined) ?? 'published';
  const eventVisibility = (event.visibility as string | undefined) ?? 'public';
  const isCancelled = eventStatus === 'cancelled';
  const isDraft = eventStatus === 'draft';
  // Completed is DERIVED from the clock — a status column holding a clock
  // fact needs a job to keep it honest, and no such job exists.
  const isCompleted = isEventCompleted({
    status: eventStatus,
    end_time: event.end_time as string | null,
    date_confirmed: event.date_confirmed as boolean | null,
  });
  const isPastEvent = isCompleted;
  const place = formatEventPlace(pickEventPlace(event), 'full');
  const eventTimeInput = {
    start_time: event.start_time as string | null,
    end_time: event.end_time as string | null,
    time_confirmed: event.time_confirmed as boolean | null | undefined,
    date_confirmed: event.date_confirmed as boolean | null | undefined,
    timezone: event.timezone as string | null,
  };
  const currentRsvp = userRsvp?.status || null;
  // Signed-in headcount comes from the live count query; signed-out from the
  // projection's going_count (attendee/registration queries are auth-gated).
  const goingCount = isLoggedIn ? registrationCount : Number((event.going_count as number | null) ?? 0);
  const organizer = event.organizer as { id: string; username: string | null; full_name: string; avatar_url: string | null; headline?: string | null } | null;
  const group = event.group as { id: string; name: string; slug: string; avatar_url: string | null; member_count: number } | null;
  const attendeeProfiles = attendees
    .filter((a: Record<string, unknown>) => a.profile)
    .map((a: Record<string, unknown>) => {
      const p = a.profile as { id: string; username: string | null; full_name: string; avatar_url: string | null };
      return p;
    });

  return (
    // Sub-page of the Convene hub: mobile chrome comes from the shared
    // ConveneShell. The MobileBottomNav is omitted because the StickyRSVPBar
    // is this page's fixed bottom bar — never two fixed bars. On md+ the
    // shell is a no-op and UnifiedHeader provides the desktop chrome.
    <ConveneShell showBottomNav={false}>
    <div className="min-h-screen bg-background pb-28 lg:pb-0">
      <div className="hidden md:block">
        <UnifiedHeader />
      </div>

      {/* ── Sticky Scroll Header (md+ — the mobile top row is the locked
             DnaMobileHeader rendered by the shell) ─────── */}
      <motion.div
        initial={false}
        animate={{ y: showStickyHeader ? 0 : -60, opacity: showStickyHeader ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="hidden md:block fixed top-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
        /* BD157 */
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
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
      {!user && showBanner && (
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
                <Link to="/auth?mode=signup">Join the Waitlist</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-6">
        {/* Back Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </button>

        {/* Draft banner — the anti-silent-failure control. A draft is invisible
            to everyone but the organizer; without this banner an organizer can
            share a link nobody else can open and never learn why. */}
        {isDraft && isOrganizer && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border-2 border-amber-500 bg-amber-500/10 p-4">
            <p className="flex-1 font-semibold text-amber-700 dark:text-amber-400">
              This event is a draft. Nobody can see it but you.
            </p>
            <Button
              className="shrink-0"
              onClick={() => publishEventMutation.mutate()}
              disabled={publishEventMutation.isPending}
            >
              {publishEventMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing...</>
                : 'Publish Event'}
            </Button>
          </div>
        )}

        {/* Hero Image — only render when there's a real cover to avoid an empty banner that reads as a duplicate header */}
        {(event.cover_image_url as string) && (
          <div ref={heroRef} className="relative overflow-hidden rounded-lg mb-6 sm:mb-8">
            <CulturalPattern pattern="kente" opacity={0.05} />
            <div className="aspect-[2.5/1] w-full overflow-hidden">
              <img src={event.cover_image_url as string} alt={event.title as string} className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Title + Badges + Actions */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="secondary" className="capitalize">{event.event_type as string}</Badge>
                <Badge variant="outline" className="capitalize">{(event.format as string).replace('_', ' ')}</Badge>
                {isCancelled && <Badge variant="destructive">Cancelled</Badge>}
                {isCompleted && <Badge variant="secondary">Completed</Badge>}
                {isDraft && isOrganizer && <Badge variant="outline">Draft</Badge>}
                {(eventVisibility === 'community' || eventVisibility === 'private') && (
                  <Badge variant="outline" className="capitalize">{eventVisibility}</Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">{event.title as string}</h1>
              <EventCountdown
                startTime={
                  (event.date_confirmed as boolean | null) === false
                    ? null
                    : (event.start_time as string | null)
                }
                endTime={event.end_time as string | null}
                className="mt-1"
              />
            </div>

            {/* Action buttons — condensed */}
            <div className="flex gap-2 flex-wrap items-center">
              <AddToCalendarButton event={{ id: event.id as string, title: event.title as string, description: event.description as string | undefined, start_time: event.start_time as string | null, end_time: event.end_time as string | null, time_confirmed: event.time_confirmed as boolean | null, date_confirmed: event.date_confirmed as boolean | null, ...pickEventPlace(event), meeting_url: event.meeting_url as string | undefined, format: (event.format as 'in_person' | 'virtual' | 'hybrid') || 'in_person' }} organizer={organizer} variant="outline" />
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
                  <Button onClick={() => navigate(`/dna/convene/events/${slugOrId}/manage`)}>
                    <Settings className="h-4 w-4 mr-2" /> Manage
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate(`/dna/convene/events/${slugOrId}/edit`)}>Edit Event</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/dna/convene/events/${slugOrId}/check-in`)}>
                        <QrCode className="mr-2 h-4 w-4" /> Check-in
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!isCancelled && !isCompleted && (
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
            {eventId && (
              <EventSocialProof
                eventId={eventId}
                attendees={attendeeProfiles}
                totalCount={goingCount}
              />
            )}

            {/* Details Card */}
            <Card>
              <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      <EventTime event={eventTimeInput} eventId={event.id as string} variant="date" />
                    </p>
                    <EventTime
                      event={eventTimeInput}
                      variant="clock"
                      className="block text-sm text-muted-foreground"
                    />
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
                        {place.venue && <p className="font-medium">{place.venue}</p>}
                        {place.street && <p className="text-sm text-muted-foreground">{place.street}</p>}
                        {place.locality && <p className="text-sm text-muted-foreground">{place.locality}</p>}
                      </>
                    )}
                  </div>
                </div>

                {event.max_attendees && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {/* Organizers see the true count/capacity; everyone else
                          gets the tiered copy so a young event doesn't read
                          as an empty room. */}
                      {isOrganizer
                        ? `${goingCount} / ${event.max_attendees as number} registered`
                        : tieredAttendeeText({
                            goingCount,
                            maxAttendees: event.max_attendees as number,
                            isAnonymous: !user,
                          })}
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
                <LocationMap
                  locationName={place.venue}
                  locationAddress={place.street}
                  locality={place.locality}
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
                  <AddToCalendarButton event={{ id: event.id as string, title: event.title as string, description: event.description as string | undefined, start_time: event.start_time as string | null, end_time: event.end_time as string | null, time_confirmed: event.time_confirmed as boolean | null, date_confirmed: event.date_confirmed as boolean | null, ...pickEventPlace(event), meeting_url: event.meeting_url as string | undefined, format: (event.format as 'in_person' | 'virtual' | 'hybrid') || 'in_person' }} organizer={organizer} variant="outline" size="default" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky RSVP Bar (Mobile) ───────────────── */}
      {eventId && (
        <StickyRSVPBar
          eventId={eventId}
          isPastEvent={isPastEvent}
          isCancelled={isCancelled}
          isOrganizer={isOrganizer}
          isAnonymous={!user}
          currentRsvp={currentRsvp}
          maxAttendees={event.max_attendees as number | null}
          attendeeCount={goingCount}
          isSubmitting={rsvpMutation.isPending}
          onRsvp={handleRsvp}
        />
      )}

      {/* Universal Composer */}

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
      <ResponsiveModal open={showReportDialog} onOpenChange={setShowReportDialog}>
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Report Event</ResponsiveModalTitle>
            <ResponsiveModalDescription>Help us understand what's wrong with this event.</ResponsiveModalDescription>
          </ResponsiveModalHeader>
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
          <ResponsiveModalFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button onClick={handleReportSubmit} disabled={reportEventMutation.isPending || !reportReason}>
              {reportEventMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Report'}
            </Button>
          </ResponsiveModalFooter>
        </ResponsiveModal>

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
    </ConveneShell>
  );
};
export default EventDetail;
