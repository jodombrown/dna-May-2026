/**
 * Publicly Accessible Event Page
 * Route: /event/:slugOrId
 * 
 * This page is accessible to ANYONE - no authentication required.
 * Shows event details and CTAs to sign up or RSVP.
 * Designed for sharing via email, text, social media.
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MapPin, Users, Clock, Share2, ExternalLink, Copy, Check, Video, Globe, Handshake, CalendarDays, UsersRound, Heart, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import UnifiedHeader from "@/components/UnifiedHeader";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from 'framer-motion';
import { config } from '@/lib/config';
import { formatEventPlace, pickEventPlace } from '@/lib/events/formatPlace';
import { EventTime } from '@/components/events/EventTime';
import { datesAnnounced } from '@/lib/events/eventTime';
import { isEventCompleted } from '@/lib/events/lifecycle';
import { realCuratedCover } from '@/lib/events/curated';
import { CuratedEventPreview } from '@/pages/dna/convene/CuratedEventPreview';
import { getEventSchema } from '@/components/seo/PageSEO';
import { Nkonsonkonson } from '@/components/icons/adinkra';

const PublicEventPage = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const isLoggedIn = !!user;

  // Animate banner in after a short delay for non-logged-in users
  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  // Fetch event data through the public projection — SECURITY DEFINER,
  // granted to anon. It resolves slug OR uuid itself and returns only the
  // columns a stranger is allowed to see (organizer name/avatar, going_count,
  // place with state) while withholding meeting_url, agenda, organizer_id, etc.
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['public-event', slugOrId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_event', {
        p_slug_or_id: slugOrId!,
      });
      if (error) throw error;
      const row = data?.[0];
      if (!row) throw new Error('Event not found');
      return row;
    },
    enabled: !!slugOrId,
  });

  // Fetch user's RSVP status if logged in
  const { data: userRsvp } = useQuery({
    queryKey: ['public-event-rsvp', event?.id, user?.id],
    queryFn: async () => {
      if (!user || !event?.id) return null;
      const { data } = await supabase
        .from('event_attendees')
        .select('status')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!event?.id,
  });

  // RSVP mutation for logged-in users
  const rsvpMutation = useMutation({
    mutationFn: async (status: 'going' | 'maybe' | 'not_going') => {
      if (!user || !event?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('event_attendees')
        .upsert({
          event_id: event.id,
          user_id: user.id,
          status,
        });
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['public-event-rsvp', event?.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['public-event', slugOrId] });
      toast({
        title: 'RSVP Updated!',
        description: `You're ${status === 'going' ? 'going to' : status === 'maybe' ? 'interested in' : 'not attending'} this event.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update RSVP. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCopyLink = async () => {
    const url = `${config.APP_URL}/event/${event?.slug || slugOrId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: 'Link copied!',
      description: 'Share this event with anyone',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    const url = `${config.APP_URL}/event/${event?.slug || slugOrId}`;
    const title = event?.title || 'Event on DNA';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: event?.short_description || event?.description?.slice(0, 100),
          url,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRsvpClick = (status: 'going' | 'maybe') => {
    if (!isLoggedIn) {
      // Store intent to return after auth
      sessionStorage.setItem('dna_event_after_auth', event?.id || '');
      navigate(`/auth?redirect=/event/${event?.slug || slugOrId}`);
      return;
    }
    rsvpMutation.mutate(status);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFormatIcon = (format: string) => {
    if (format === 'virtual') return <Video className="w-4 h-4" />;
    if (format === 'hybrid') return <Globe className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedHeader />
        <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This event doesn't exist, has been removed, or is no longer available.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/dna/convene/events')}>
              Browse Events
            </Button>
            {!isLoggedIn && (
              <Button variant="outline" onClick={() => navigate('/auth?mode=signup')}>
                Join Now
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const eventTitle = event.title || 'Event';
  const hostName = event.organizer_name || 'DNA Host';
  const hostAvatar = event.organizer_avatar_url;
  const goingCount = Number(event.going_count ?? 0);
  // Completed is DERIVED from the clock (status='completed' has never been
  // written); the badge and the RSVP gate both read the derivation.
  const isPastEvent = isEventCompleted(event);
  // Canonical event state — status is the source of truth; the legacy
  // cancelled boolean mirror is scheduled for DROP and must not be read.
  const isCancelled = event.status === 'cancelled';
  const isCompleted = isPastEvent;
  const currentRsvp = userRsvp?.status;

  // Date/time render through the one renderer: an unconfirmed hour never
  // prints, on this page or anywhere else.
  const timeInput = {
    start_time: event.start_time,
    end_time: event.end_time,
    time_confirmed: event.time_confirmed,
    date_confirmed: event.date_confirmed,
    timezone: event.timezone,
  };

  // Build location string
  const getLocationDisplay = () => {
    if (event.format === 'virtual') {
      return 'Online Event';
    }
    const place = formatEventPlace(pickEventPlace(event), 'full');
    return [place.venue, place.locality].filter(Boolean).join(', ') || null;
  };

  const locationDisplay = getLocationDisplay();

  // SEO description
  const seoDescription = event.short_description || event.description?.slice(0, 160) || `${eventTitle} hosted by ${hostName} on DNA`;

  // Generate Event structured data for Google rich results. An unconfirmed
  // hour is a fabrication in machine-readable form too — emit date-only.
  const timeUnconfirmed = event.time_confirmed === false;
  const datesUnannounced = !datesAnnounced(event);
  const eventStructuredData = getEventSchema({
    name: eventTitle,
    description: seoDescription,
    startDate: datesUnannounced
      ? undefined
      : timeUnconfirmed
        ? event.start_time.slice(0, 10)
        : event.start_time,
    endDate: datesUnannounced || !event.end_time
      ? undefined
      : timeUnconfirmed
        ? event.end_time.slice(0, 10)
        : event.end_time,
    location: locationDisplay || undefined,
    isVirtual: event.format === 'virtual',
    image: event.cover_image_url,
    organizer: hostName,
    url: `${config.APP_URL}/event/${event.slug || event.id}`,
  });

  const canonicalUrl = `${config.APP_URL}/event/${event.slug || event.id}`;
  const ogImage =
    (event.is_curated ? realCuratedCover(event) : event.cover_image_url) ||
    `${config.APP_URL}/og-image.png`;

  // SEO Meta Tags - Critical for link previews & Google rich results
  const helmet = (
      <Helmet>
        <title>{eventTitle} | African Diaspora Event | DNA</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`african diaspora event, ${event.event_type || 'community'}, ${event.location_city || 'global'}, african professionals, diaspora networking`} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${eventTitle} | DNA Event`} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Diaspora Network of Africa" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${eventTitle} | DNA Event`} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:site" content="@diasporanetwork" />

        {/* Event Schema structured data for Google rich results */}
        <script type="application/ld+json">
          {JSON.stringify(eventStructuredData)}
        </script>
      </Helmet>
  );

  // ── Curated event → the curated page (shared body) in public chrome ──
  if (event.is_curated) {
    return (
      <>
        {helmet}
        <div className="min-h-screen bg-background">
          <UnifiedHeader />
          <CuratedEventPreview event={event} showBack={false} />
        </div>
      </>
    );
  }

  return (
    <>
      {helmet}

      <div className="min-h-screen bg-background">
        <UnifiedHeader />

        {/* CTA Banner for non-logged-in users */}
        {!isLoggedIn && showBanner && (
          <div className="px-4 sm:px-0 pt-3">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-gradient-to-r from-dna-forest via-dna-emerald to-dna-forest sm:mx-auto sm:max-w-3xl rounded-lg shadow-md"
            >
              <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white min-w-0">
                  <Nkonsonkonson className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium truncate">
                    You're invited! Join DNA to attend this event
                  </span>
                </div>
                <Button
                  size="sm"
                  className="bg-white text-dna-forest hover:bg-white/90 shrink-0 h-7 text-xs px-3"
                  asChild
                >
                  <Link to="/auth?mode=signup">
                    Join Now
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        <div className="container max-w-3xl mx-auto px-4 pt-3 pb-6">

          {/* Cancellation banner — shown to everyone, carries the organizer's reason */}
          {isCancelled && (
            <div className="mb-4 rounded-lg border-2 border-destructive/50 bg-destructive/5 p-4">
              <p className="font-semibold text-destructive">This event has been cancelled</p>
              {event.cancellation_reason && (
                <p className="mt-1 text-sm text-muted-foreground">{event.cancellation_reason}</p>
              )}
            </div>
          )}

          {/* Cover Image */}
          {event.cover_image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 } as const}
              className="aspect-[2.5/1] w-full overflow-hidden rounded-lg mb-6"
            >
              <img
                src={event.cover_image_url}
                alt={eventTitle}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}

          {/* Event Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 } as const}
          >
          <Card className="overflow-hidden mb-4">
            <CardContent className="p-4 sm:p-6">
              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="secondary" className="capitalize">
                  {event.event_type || 'Event'}
                </Badge>
                <Badge variant="outline" className="capitalize flex items-center gap-1">
                  {getFormatIcon(event.format)}
                  {event.format?.replace('_', ' ') || 'In Person'}
                </Badge>
                {isPastEvent && <Badge variant="secondary">Past Event</Badge>}
                {isCancelled && <Badge variant="destructive">Cancelled</Badge>}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold mb-4">{eventTitle}</h1>

              {/* Date & Time — through the one renderer; no clock line when
                  the hour is unconfirmed */}
              <div className="flex items-start gap-3 mb-3">
                <Calendar className="w-5 h-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">
                    <EventTime event={timeInput} eventId={event.id} variant="date" />
                  </p>
                  <EventTime
                    event={timeInput}
                    variant="clock"
                    className="block text-sm text-muted-foreground"
                  />
                </div>
              </div>

              {/* Location */}
              {locationDisplay && (
                <div className="flex items-start gap-3 mb-3">
                  {getFormatIcon(event.format)}
                  <div>
                    <p className="font-medium">{locationDisplay}</p>
                  </div>
                </div>
              )}

              {/* Attendee Count */}
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {goingCount} {goingCount === 1 ? 'person' : 'people'} going
                  {event.max_attendees && ` · ${event.max_attendees - goingCount} spots left`}
                </p>
              </div>

              {/* Host Info */}
              <div className="flex items-center gap-3 py-3 border-t border-b mb-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={hostAvatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(hostName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Hosted by</p>
                  <p className="font-medium truncate">{hostName}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleNativeShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* RSVP Buttons — dead on a cancelled or completed event */}
              {!isPastEvent && !isCancelled && !isCompleted && (
                <div className="flex items-center gap-2">
                  {currentRsvp === 'going' ? (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => rsvpMutation.mutate('not_going')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      You're Going!
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1"
                      onClick={() => handleRsvpClick('going')}
                      disabled={rsvpMutation.isPending}
                    >
                      {isLoggedIn ? "I'm Going" : "Join DNA to Attend"}
                    </Button>
                  )}
                  
                  {isLoggedIn && currentRsvp !== 'going' && (
                    <Button
                      variant="outline"
                      onClick={() => handleRsvpClick('maybe')}
                      disabled={rsvpMutation.isPending}
                      className={currentRsvp === 'maybe' ? 'border-primary text-primary' : ''}
                    >
                      Maybe
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              {(isPastEvent || isCancelled || isCompleted) && (
                <div className="text-center py-2 text-muted-foreground">
                  {isCancelled ? 'This event has been cancelled' : 'This event has ended'}
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>

          {/* Event Description */}
          {(event.description || event.short_description) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 } as const}
            >
              <Card className="mb-4">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="font-semibold mb-3">About This Event</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <p className="whitespace-pre-wrap">
                      {event.description || event.short_description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* What is DNA? Section - for non-logged-in users */}
          {!isLoggedIn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 } as const}
            >
              <Card className="mb-4 border-dna-emerald/20 bg-gradient-to-br from-dna-emerald/5 to-transparent">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-dna-emerald/10 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-dna-emerald" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">What is DNA?</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        DNA (Diaspora Network of Africa) is the premier platform connecting the global African diaspora: 
                        200M+ professionals, entrepreneurs, and changemakers worldwide, with each other and with Africa. 
                        We bring together people who want to build meaningful connections, collaborate on impactful projects, 
                        and contribute to Africa's economic transformation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Why Join DNA? - Five C's Benefits Block for non-logged-in users */}
          {!isLoggedIn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 } as const}
            >
              <Card className="mb-4">
                <CardContent className="p-5 sm:p-6">
                  <h3 className="font-bold text-lg mb-4 text-center">Why Join DNA?</h3>
                  
                  {/* Four C's in quadrant layout */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { icon: Handshake, label: 'Connect', desc: 'Build your network', href: '/connect' },
                      { icon: CalendarDays, label: 'Convene', desc: 'Attend events', href: '/convene' },
                      { icon: UsersRound, label: 'Collaborate', desc: 'Join projects', href: '/collaborate' },
                      { icon: Heart, label: 'Contribute', desc: 'Make an impact', href: '/contribute' },
                    ].map((item, index) => (
                      <motion.a
                        key={item.label}
                        href={item.href}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: 0.5 + index * 0.1,
                          type: "spring",
                          stiffness: 400,
                          damping: 30
                        } as const}
                        className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-dna-emerald/10 flex items-center justify-center mb-2">
                          <item.icon className="w-5 h-5 text-dna-emerald" />
                        </div>
                        <span className="font-semibold text-sm">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.desc}</span>
                      </motion.a>
                    ))}
                  </div>
                  
                  {/* Convey centered below */}
                  <motion.a
                    href="/convey"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: 0.9,
                      type: "spring",
                      stiffness: 400,
                      damping: 30
                    } as const}
                    className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer mx-auto w-fit"
                  >
                    <div className="w-10 h-10 rounded-full bg-dna-emerald/10 flex items-center justify-center mb-2">
                      <MessageSquare className="w-5 h-5 text-dna-emerald" />
                    </div>
                    <span className="font-semibold text-sm">Convey</span>
                    <span className="text-xs text-muted-foreground">Share your story</span>
                  </motion.a>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* CTA Card for non-logged-in users */}
          {!isLoggedIn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 } as const}
            >
              <Card className="mt-4 bg-gradient-to-r from-dna-forest to-dna-emerald text-white overflow-hidden">
                <CardContent className="py-5 px-5">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div>
                      <h2 className="text-lg font-bold mb-1">
                        Join DNA to Attend This Event
                      </h2>
                      <p className="text-white/80 text-sm">
                        Connect with the global African diaspora. RSVP to events, meet incredible people, and grow your network.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        size="sm" 
                        className="bg-dna-copper hover:bg-dna-gold text-white"
                        asChild
                      >
                        <Link to="/auth?mode=signup">
                          Join Now
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="bg-white text-dna-forest hover:bg-white/90"
                        asChild
                      >
                        <Link to={`/auth?mode=signin&redirect=/event/${event.slug || event.id}`}>
                          Sign In
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Already logged in - Show quick link to full event page */}
          {isLoggedIn && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Want to see discussions and connect with attendees?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dna/convene/events/${event.slug || event.id}`)}
                  >
                    View Full Event <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <footer className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>DNA - Diaspora Network of Africa</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <Link to="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default PublicEventPage;
