import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ConnectDiscoveryLane } from './ConnectDiscoveryLane';
import { ConnectFilterChips, ConnectFilterId } from './ConnectFilterChips';
import { DiaInsightCard, DiaInsightData } from './DiaInsightCard';
import { FilterState } from './NetworkPanel';
import { ConnectionRequestModal } from '@/components/connect/ConnectionRequestModal';
import { connectionService } from '@/services/connectionService';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errorLogger';

interface DiscoveryFeedProps {
  filters?: FilterState;
  networkSearchQuery?: string;
  onMessageMember?: (memberId: string) => void;
  viewMode?: 'discover' | 'network' | 'activity';
  onViewModeChange?: (mode: 'discover' | 'network' | 'activity') => void;
  className?: string;
}

/** Typed shape for members returned by profile queries and discover_members RPC */
interface DiscoveryMember {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string | null;
  headline?: string | null;
  profession?: string | null;
  location?: string | null;
  country_of_origin?: string | null;
  current_country?: string | null;
  focus_areas?: string[] | null;
  industries?: string[] | null;
  bio?: string | null;
  tagline?: string | null;
  last_seen_at?: string | null;
  created_at?: string | null;
  match_score?: number | null;
  connections_count?: number | null;
  [key: string]: unknown;
}

/**
 * DiscoveryFeed — Intelligent lane-based member discovery
 *
 * Four discovery lanes replace the flat grid:
 * 1. Active Now — members active in last 24h
 * 2. In Your Sectors — sector-matched members
 * 3. Your Network Knows — members with 2+ mutual connections
 * 4. Across the Diaspora — members from different countries
 */
export function DiscoveryFeed({
  filters,
  networkSearchQuery,
  onMessageMember,
  viewMode = 'discover',
  onViewModeChange,
  className,
}: DiscoveryFeedProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ConnectFilterId>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Connection modal state
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionTarget, setConnectionTarget] = useState<{
    id: string;
    full_name: string;
    headline?: string;
  } | null>(null);

  // Fetch connected user IDs to exclude from discovery
  const { data: connectedUserIds } = useQuery({
    queryKey: ['connected-user-ids', user?.id],
    queryFn: async () => {
      if (!user?.id) return new Set<string>();
      const { data } = await supabase
        .from('connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const ids = new Set<string>();
      data?.forEach((c) => {
        if (c.requester_id !== user.id) ids.add(c.requester_id);
        if (c.recipient_id !== user.id) ids.add(c.recipient_id);
      });
      return ids;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Helper to exclude self + already-connected members
  const excludeConnected = useCallback(
    (members: DiscoveryMember[]) => {
      if (!user?.id) return members;
      return members.filter(
        (m) => m.id !== user.id && !connectedUserIds?.has(m.id)
      );
    },
    [user?.id, connectedUserIds]
  );

  // ─── Lane 1: Active Now (last 24h) ───
  const { data: activeNowMembers = [], isLoading: activeLoading } = useQuery({
    queryKey: ['connect-active-now', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_public', true)
        .gte('last_seen_at', twentyFourHoursAgo)
        .order('last_seen_at', { ascending: false })
        .limit(12);

      if (error) {
        logger.warn('DiscoveryFeed', 'Active Now query failed:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // ─── Lane 2: In Your Sectors ───
  const userSectors = useMemo(() => {
    const sectors: string[] = [];
    if (profile?.industries) sectors.push(...profile.industries);
    if (profile?.focus_areas) sectors.push(...profile.focus_areas);
    return sectors;
  }, [profile?.industries, profile?.focus_areas]);

  const sectorLabel = useMemo(() => {
    if (profile?.industries?.[0]) return profile.industries[0];
    if (profile?.focus_areas?.[0]) return profile.focus_areas[0];
    return 'Your Sector';
  }, [profile?.industries, profile?.focus_areas]);

  const { data: sectorMembers = [], isLoading: sectorLoading } = useQuery({
    queryKey: ['connect-in-sectors', user?.id, userSectors],
    queryFn: async () => {
      if (!user?.id || userSectors.length === 0) return [];

      // Use discover_members RPC with sector filters
      const { data, error } = await supabase.rpc('discover_members', {
        p_current_user_id: user.id,
        p_focus_areas: profile?.focus_areas?.length ? profile.focus_areas : null,
        p_regional_expertise: null,
        p_industries: profile?.industries?.length ? profile.industries : null,
        p_country_of_origin: null,
        p_location_country: null,
        p_skills: null,
        p_search_query: null,
        p_sort_by: 'match',
        p_limit: 12,
        p_offset: 0,
      });

      if (error) {
        logger.warn('DiscoveryFeed', 'Sector query failed:', error);
        return [];
      }
      return (data || []) as DiscoveryMember[];
    },
    enabled: !!user?.id && userSectors.length > 0,
    staleTime: 120000,
  });

  // ─── Lane 3: Your Network Knows (members with mutual connections / high match) ───
  const { data: networkKnowsMembers = [], isLoading: networkLoading } =
    useQuery({
      queryKey: ['connect-network-knows', user?.id],
      queryFn: async () => {
        if (!user?.id) return [];

        // Get members recommended by the platform with high match scores
        const { data, error } = await supabase.rpc('discover_members', {
          p_current_user_id: user.id,
          p_focus_areas: null,
          p_regional_expertise: null,
          p_industries: null,
          p_country_of_origin: null,
          p_location_country: null,
          p_skills: null,
          p_search_query: null,
          p_sort_by: 'match',
          p_limit: 12,
          p_offset: 0,
        });

        if (error) {
          logger.warn('DiscoveryFeed', 'Network Knows query failed:', error);
          return [];
        }

        // Filter to those with calc_match_score > 0 (indicating shared attributes)
        const scored = ((data || []) as DiscoveryMember[]).filter(
          (m) => ((m as Record<string, unknown>).calc_match_score as number || 0) > 0
        );
        return scored;
      },
      enabled: !!user?.id,
      staleTime: 120000,
    });

  // ─── Lane 4: Across the Diaspora (all other members) ───
  const { data: diasporaMembers = [], isLoading: diasporaLoading } = useQuery({
    queryKey: ['connect-across-diaspora', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Use discover_members RPC with no filters to get all members
      const { data, error } = await supabase.rpc('discover_members', {
        p_current_user_id: user.id,
        p_focus_areas: null,
        p_regional_expertise: null,
        p_industries: null,
        p_country_of_origin: null,
        p_location_country: null,
        p_skills: null,
        p_search_query: null,
        p_sort_by: 'recent',
        p_limit: 30,
        p_offset: 0,
      });

      if (error) {
        logger.warn('DiscoveryFeed', 'Diaspora query failed:', error);
        return [];
      }
      return (data || []) as DiscoveryMember[];
    },
    enabled: !!user?.id,
    staleTime: 120000,
  });

  // ─── Search results (when search is active) ───
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['connect-search', user?.id, searchQuery],
    queryFn: async () => {
      if (!user?.id || !searchQuery) return [];

      const { data, error } = await supabase.rpc('discover_members', {
        p_current_user_id: user.id,
        p_focus_areas: null,
        p_regional_expertise: null,
        p_industries: null,
        p_country_of_origin: null,
        p_location_country: null,
        p_skills: null,
        p_search_query: searchQuery,
        p_sort_by: 'match',
        p_limit: 50,
        p_offset: 0,
      });

      if (error) {
        logger.warn('DiscoveryFeed', 'Search query failed:', error);
        return [];
      }
      return (data || []) as DiscoveryMember[];
    },
    enabled: !!user?.id && searchQuery.length > 1,
    staleTime: 30000,
  });

  // Apply connected-user exclusion + progressive deduplication across all lanes
  // Each lane excludes members already shown in earlier lanes
  const filteredActiveNow = useMemo(
    () => excludeConnected(activeNowMembers),
    [activeNowMembers, excludeConnected]
  );

  const filteredSector = useMemo(() => {
    const shownIds = new Set(filteredActiveNow.map((m) => m.id));
    return excludeConnected(sectorMembers).filter((m) => !shownIds.has(m.id));
  }, [sectorMembers, excludeConnected, filteredActiveNow]);

  const filteredNetworkKnows = useMemo(() => {
    const shownIds = new Set([
      ...filteredActiveNow.map((m) => m.id),
      ...filteredSector.map((m) => m.id),
    ]);
    return excludeConnected(networkKnowsMembers).filter((m) => !shownIds.has(m.id));
  }, [networkKnowsMembers, excludeConnected, filteredActiveNow, filteredSector]);

  const filteredDiaspora = useMemo(() => {
    const shownIds = new Set([
      ...filteredActiveNow.map((m) => m.id),
      ...filteredSector.map((m) => m.id),
      ...filteredNetworkKnows.map((m) => m.id),
    ]);
    return excludeConnected(diasporaMembers).filter((m) => !shownIds.has(m.id));
  }, [diasporaMembers, excludeConnected, filteredActiveNow, filteredSector, filteredNetworkKnows]);

  const filteredSearch = useMemo(
    () => searchResults.filter((m) => m.id !== user?.id),
    [searchResults, user?.id]
  );

  // Check if all lanes are empty
  const allLanesEmpty =
    filteredActiveNow.length === 0 &&
    filteredSector.length === 0 &&
    filteredNetworkKnows.length === 0 &&
    filteredDiaspora.length === 0;

  const isLoading =
    activeLoading || sectorLoading || networkLoading || diasporaLoading;

  // Determine which lanes to show based on active filter
  const showLane = useCallback(
    (lane: 'active' | 'sectors' | 'network' | 'diaspora') => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'active') return lane === 'active';
      if (activeFilter === 'sectors') return lane === 'sectors';
      if (activeFilter === 'new') return lane === 'diaspora'; // "New Members" maps to fresh profiles
      if (activeFilter === 'nearby') return lane === 'diaspora'; // "Near Me" shows geography
      return true;
    },
    [activeFilter]
  );

  // Connection modal handlers
  const handleSendConnectionRequest = async (message: string) => {
    if (!connectionTarget) return;
    try {
      await connectionService.sendConnectionRequest(
        connectionTarget.id,
        message
      );
      toast({
        title: 'Connection request sent',
        description: `Request sent to ${connectionTarget.full_name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['connect-'] });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description:
          getErrorMessage(error) || 'Failed to send connection request',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleRefetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['connect-active-now'] });
    queryClient.invalidateQueries({ queryKey: ['connect-in-sectors'] });
    queryClient.invalidateQueries({ queryKey: ['connect-network-knows'] });
    queryClient.invalidateQueries({ queryKey: ['connect-across-diaspora'] });
  }, [queryClient]);

  // ─── Pulse dot for "Active Now" title ───
  const activePulseDot = (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 py-3 space-y-3">
        {/* View mode tabs */}
        {viewMode !== 'discover' && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange?.('discover')}
              className="text-xs text-muted-foreground"
            >
              ← Back to Discovery
            </Button>
            <span className="text-sm font-medium text-foreground">
              {viewMode === 'network' ? 'Your Network' : 'Your Activity'}
            </span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={
              viewMode === 'network'
                ? 'Search your network...'
                : 'Search members, sectors, locations...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filter chips — only in discover mode */}
        {viewMode === 'discover' && !searchQuery && (
          <ConnectFilterChips
            activeFilter={activeFilter}
            onSelect={setActiveFilter}
          />
        )}
      </div>

      {/* Feed Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 space-y-8"
      >
        {/* Search results mode */}
        {searchQuery.length > 1 ? (
          searchLoading ? (
            <LaneSkeleton />
          ) : filteredSearch.length === 0 ? (
            <EmptySearch onClear={() => setSearchQuery('')} />
          ) : (
            <ConnectDiscoveryLane
              title={`Results for "${searchQuery}"`}
              members={filteredSearch}
              onConnectionSent={handleRefetch}
              onMessage={onMessageMember}
            />
          )
        ) : isLoading ? (
          <div className="space-y-8">
            <LaneSkeleton />
            <LaneSkeleton />
          </div>
        ) : allLanesEmpty ? (
          <AllEmptyState />
        ) : (
          <>
            {/* Lane 1: Active Now */}
            {showLane('active') && (
              <ConnectDiscoveryLane
                title="Active Now"
                titleIcon={activePulseDot}
                members={filteredActiveNow}
                onConnectionSent={handleRefetch}
                onMessage={onMessageMember}
              />
            )}

            {/* Lane 2: In Your Sectors */}
            {showLane('sectors') && (
              <ConnectDiscoveryLane
                title={`In ${sectorLabel}`}
                members={filteredSector}
                onConnectionSent={handleRefetch}
                onMessage={onMessageMember}
              />
            )}

            {/* Lane 3: Your Network Knows */}
            {showLane('network') && (
              <ConnectDiscoveryLane
                title="Your Network Knows"
                members={filteredNetworkKnows}
                onConnectionSent={handleRefetch}
                onMessage={onMessageMember}
              />
            )}

            {/* Lane 4: Across the Diaspora */}
            {showLane('diaspora') && (
              <ConnectDiscoveryLane
                title="Across the Diaspora"
                members={filteredDiaspora}
                onConnectionSent={handleRefetch}
                onMessage={onMessageMember}
              />
            )}
          </>
        )}
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        onSend={handleSendConnectionRequest}
        targetUser={connectionTarget}
      />
    </div>
  );
}

// ─── Sub-components ───

function LaneSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-32" />
      <div className="h-px bg-dna-emerald/20" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="min-w-[280px] space-y-3 p-4 border rounded-lg">
            <div className="flex gap-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptySearch({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="text-lg font-medium">No members found</p>
      <p className="text-sm text-muted-foreground mt-1">
        Try adjusting your search
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
}

function AllEmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-dna-emerald/10 flex items-center justify-center mb-4">
        <Users className="h-8 w-8 text-dna-emerald" />
      </div>
      <p className="text-lg font-semibold text-foreground">
        Be the first to connect with the diaspora
      </p>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        Complete your profile to get personalized member recommendations
      </p>
      <Button
        className="mt-6 bg-dna-emerald hover:bg-dna-forest text-white rounded-full px-6"
        onClick={() => navigate('/dna/settings/profile')}
      >
        Complete Profile
      </Button>
    </div>
  );
}

export default DiscoveryFeed;
