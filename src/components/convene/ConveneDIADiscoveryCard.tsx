/**
 * DNA | DIA Discovery Card for CONVENE
 *
 * Inline discovery card shown between category chips and Featured Events.
 * Priority-ordered: first matching condition wins. One card at a time.
 * Uses existing DIA dismiss system (7-day cooldown via localStorage).
 *
 * Priority order:
 * 1. city-nudge        — user has no current_city on profile
 * 2. low-content       — selected city has < 3 events
 * 3. network-activity  — connections attending events this week
 * 4. sector-match      — user has sectors in profile
 * 5. welcome           — account created < 7 days ago
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isDismissed, dismissDIACard } from '@/services/diaCardService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, MapPin, Calendar, Users, Target, Heart } from 'lucide-react';
import { Nkonsonkonson } from '@/components/icons/adinkra';

// ── Types ──────────────────────────────────────────

interface ConveneDIADiscoveryCardProps {
  selectedCity: string | null;
  eventCount: number;
  onOpenComposer: () => void;
  onSetCategory?: (category: string) => void;
  className?: string;
}

type DiscoveryCardType =
  | 'city-nudge'
  | 'low-content'
  | 'network-activity'
  | 'sector-match'
  | 'welcome';

interface DiscoveryCardContent {
  cardTypeId: DiscoveryCardType;
  headline: string;
  body: string;
  ctaLabel: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  action: () => void;
}

const ACCENT = '#C4942A';

// ── Profile data shape ─────────────────────────────

interface DiscoveryProfile {
  current_city: string | null;
  sectors: string[] | null;
  created_at: string;
}

// ── Component ──────────────────────────────────────

export function ConveneDIADiscoveryCard({
  selectedCity,
  eventCount,
  onOpenComposer,
  onSetCategory,
  className,
}: ConveneDIADiscoveryCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tracks dismissals to trigger re-render when a card is dismissed
  const [dismissVersion, setDismissVersion] = useState(0);

  // ── Profile query ──────────────────────────────────
  const { data: profile } = useQuery({
    queryKey: ['dia-discovery-profile', user?.id],
    queryFn: async (): Promise<DiscoveryProfile | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('current_city, sectors, created_at')
        .eq('id', user.id)
        .single();
      if (error || !data) return null;
      return {
        current_city: data.current_city as string | null,
        sectors: data.sectors as string[] | null,
        created_at: data.created_at as string,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // ── Network activity query ─────────────────────────
  // Count of unique connections attending events within the next 7 days
  const { data: networkActivityCount = 0 } = useQuery({
    queryKey: ['dia-discovery-network', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .limit(100);

      if (!connections || connections.length === 0) return 0;

      const connectionIds = connections.map((c: { requester_id: string; recipient_id: string }) =>
        c.requester_id === user.id ? c.recipient_id : c.requester_id
      );

      // Get confirmed registrations from connections
      const { data: regs } = await supabase
        .from('event_registrations')
        .select('user_id, event_id')
        .in('user_id', connectionIds)
        .eq('status', 'confirmed');

      if (!regs || regs.length === 0) return 0;

      // Filter to events happening this week
      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const eventIds = [...new Set(regs.map((r: { event_id: string }) => r.event_id))];
      const { data: events } = await supabase
        .from('events')
        .select('id')
        .in('id', eventIds)
        .gte('start_time', now.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .eq('status', 'published');

      if (!events || events.length === 0) return 0;

      const thisWeekEventIds = new Set(events.map((e: { id: string }) => e.id));
      const attendingConnectionIds = new Set(
        regs
          .filter((r: { event_id: string }) => thisWeekEventIds.has(r.event_id))
          .map((r: { user_id: string }) => r.user_id)
      );

      return attendingConnectionIds.size;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // ── Dismiss handler ────────────────────────────────

  const getDismissKey = useCallback(
    (cardTypeId: DiscoveryCardType): string =>
      `convene-discovery-${cardTypeId}-${user?.id || ''}`,
    [user?.id]
  );

  const handleDismiss = useCallback(
    (cardTypeId: DiscoveryCardType) => {
      dismissDIACard(getDismissKey(cardTypeId));
      setDismissVersion((v) => v + 1);
    },
    [getDismissKey]
  );

  // ── Card selection (priority order, first match wins) ──

  const cardContent = useMemo((): DiscoveryCardContent | null => {
    if (!profile || !user?.id) return null;
    // dismissVersion is in deps to recalculate after dismissals
    void dismissVersion;

    // 1. City nudge — no current_city on profile
    const cityNudgeId: DiscoveryCardType = 'city-nudge';
    if (!profile.current_city && !isDismissed(getDismissKey(cityNudgeId))) {
      return {
        cardTypeId: cityNudgeId,
        headline: 'Discover events near you',
        body: 'Set your city in your profile to see events in your area.',
        ctaLabel: 'Update Profile',
        icon: MapPin,
        action: () => navigate('/dna/settings/profile'),
      };
    }

    // 2. Low content — selected city has < 3 events
    const lowContentId: DiscoveryCardType = 'low-content';
    const displayCity = selectedCity || profile.current_city;
    if (displayCity && eventCount < 3 && !isDismissed(getDismissKey(lowContentId))) {
      return {
        cardTypeId: lowContentId,
        headline: `Events in ${displayCity} are just getting started`,
        body: `Be the first to bring the diaspora together in ${displayCity}!`,
        ctaLabel: 'Host an Event',
        icon: Calendar,
        action: onOpenComposer,
      };
    }

    // 3. Network activity — connections attending events this week
    const networkId: DiscoveryCardType = 'network-activity';
    if (networkActivityCount >= 1 && !isDismissed(getDismissKey(networkId))) {
      return {
        cardTypeId: networkId,
        headline: `${networkActivityCount} ${networkActivityCount === 1 ? 'connection is' : 'connections are'} going to events this week`,
        body: 'See what your network is up to.',
        ctaLabel: 'View Events',
        icon: Users,
        action: () => {
          const section = document.getElementById('convene-upcoming-events');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        },
      };
    }

    // 4. Sector match — user has sectors in profile
    const sectorId: DiscoveryCardType = 'sector-match';
    if (
      profile.sectors &&
      profile.sectors.length > 0 &&
      !isDismissed(getDismissKey(sectorId))
    ) {
      const primarySector = profile.sectors[0];
      return {
        cardTypeId: sectorId,
        headline: `Events in ${primarySector} trending in your network`,
        body: 'Discover events that match your expertise.',
        ctaLabel: `Browse ${primarySector}`,
        icon: Target,
        action: () => onSetCategory?.(primarySector.toLowerCase()),
      };
    }

    // 5. Welcome — account created < 7 days ago
    const welcomeId: DiscoveryCardType = 'welcome';
    const createdAt = new Date(profile.created_at);
    const daysSinceCreation =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7 && !isDismissed(getDismissKey(welcomeId))) {
      return {
        cardTypeId: welcomeId,
        headline: 'Welcome to CONVENE',
        body: 'Discover, attend, and host events that connect the diaspora.',
        ctaLabel: 'Explore Events',
        icon: Heart,
        action: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      };
    }

    return null;
  }, [
    profile,
    user?.id,
    selectedCity,
    eventCount,
    networkActivityCount,
    getDismissKey,
    dismissVersion,
    navigate,
    onOpenComposer,
    onSetCategory,
  ]);

  // ── Render ─────────────────────────────────────────

  if (!cardContent) return null;

  const CardIcon = cardContent.icon;

  return (
    <div className={cn('w-full', className)}>
      <div
        className="relative overflow-hidden rounded-xl border border-border/50 bg-card px-4 py-4"
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: ACCENT,
          backgroundColor: `${ACCENT}08`,
        }}
      >
        {/* Dismiss button — 44px touch target */}
        <button
          onClick={() => handleDismiss(cardContent.cardTypeId)}
          className="absolute top-1 right-1 p-3 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          aria-label="Dismiss"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: DIA module badge */}
        <div className="flex items-center gap-2 mb-2 pr-12">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full"
            style={{ backgroundColor: `${ACCENT}20` }}
          >
            <Nkonsonkonson className="w-3 h-3" style={{ color: ACCENT }} />
          </div>
          <span
            className="text-[10px] font-bold tracking-widest"
            style={{ color: ACCENT }}
          >
            DIA &bull; CONVENE
          </span>
        </div>

        {/* Icon + Headline */}
        <div className="flex items-start gap-2 mb-1.5">
          <CardIcon
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: ACCENT }}
          />
          <h4 className="font-semibold text-sm text-foreground leading-tight">
            {cardContent.headline}
          </h4>
        </div>

        {/* Body */}
        <p className="text-sm text-muted-foreground leading-relaxed ml-6">
          {cardContent.body}
        </p>

        {/* CTA — pill shape, 44px touch target */}
        <div className="flex items-center mt-3 ml-6">
          <Button
            size="sm"
            className="text-xs rounded-full px-4 text-white"
            style={{ backgroundColor: ACCENT, minHeight: 44 }}
            onClick={cardContent.action}
          >
            {cardContent.ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConveneDIADiscoveryCard;
