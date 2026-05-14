import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MessageSquare, UserPlus, Clock, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useMutualConnections } from '@/hooks/useMutualConnections';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errorLogger';
import { getFlag } from '@/lib/countryFlags';

interface ConnectMemberCardProps {
  member: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string;
    headline?: string;
    profession?: string;
    location?: string;
    country_of_origin?: string;
    current_country?: string;
    focus_areas?: string[];
    industries?: string[];
    bio?: string;
    tagline?: string;
    last_seen_at?: string;
    created_at?: string;
    match_score?: number;
    [key: string]: unknown;
  };
  onConnectionSent?: () => void;
  onMessage?: (memberId: string) => void;
}

/**
 * ConnectMemberCard — "Alive Before Accomplished"
 * Presence → Credibility → Value → Belonging
 */
export function ConnectMemberCard({ member, onConnectionSent, onMessage }: ConnectMemberCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const [isSending, setIsSending] = useState(false);
  const { data: connectionStatus, refetch: refetchStatus } = useConnectionStatus(member.id);
  const { mutualConnections, mutualCount } = useMutualConnections(user?.id, member.id);

  // --- Presence signal ---
  const presence = useMemo(() => {
    if (member.last_seen_at) {
      const hours = (Date.now() - new Date(member.last_seen_at).getTime()) / (1000 * 60 * 60);
      if (hours < 24) return { color: 'bg-green-500', pulse: true, label: 'Active today' };
      if (hours < 168) return { color: 'bg-emerald-500', pulse: false, label: 'Active this week' };
    }
    return { color: 'bg-muted-foreground/40', pulse: false, label: 'Inactive' };
  }, [member.last_seen_at]);

  // --- Sector chip ---
  const sector = useMemo(() => {
    const raw = member.industries?.[0] || member.focus_areas?.[0];
    if (!raw) return null;
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }, [member.industries, member.focus_areas]);

  // --- Country flag ---
  const flag = member.country_of_origin ? getFlag(member.country_of_origin) || null : null;

  // --- Value line: first sentence of bio, max 60 chars ---
  const valueLine = useMemo(() => {
    const source = member.tagline || member.bio;
    if (!source) return null;
    const firstSentence = source.split(/[.!?]/)[0]?.trim();
    if (!firstSentence) return null;
    return firstSentence.length > 60 ? firstSentence.slice(0, 57) + '…' : firstSentence;
  }, [member.bio, member.tagline]);

  // --- Initials ---
  const initials = member.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // --- Actions ---
  const handleViewProfile = () => navigate(`/dna/${member.username}`);

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-connection-request', {
        body: { target_user_id: member.id },
      });
      if (error) throw error;
      const result = data as { status: string; message?: string };
      if (result.status === 'pending') {
        await refetchStatus();
        toast({ title: 'Connection request sent', description: `Request sent to ${member.full_name}.` });
        await trackEvent('connect_request_sent', { target_user_id: member.id });
        onConnectionSent?.();
      } else if (result.status === 'profile_incomplete') {
        toast({ title: 'Profile Incomplete', description: result.message || 'Complete your profile first.', variant: 'destructive' });
        navigate('/dna/profile/edit');
      } else {
        toast({ title: 'Request status', description: result.message || 'Please try again later.' });
      }
    } catch (error: unknown) {
      toast({ title: 'Error', description: getErrorMessage(error) || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMessage) { onMessage(member.id); return; }
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user_a.eq.${user.id},user_b.eq.${member.id}),and(user_a.eq.${member.id},user_b.eq.${user.id})`)
        .maybeSingle();
      if (existing) {
        navigate(`/dna/messages/${existing.id}`);
      } else {
        const { data: newConv, error } = await supabase.from('conversations').insert({ user_a: user.id, user_b: member.id }).select('id').single();
        if (error) throw error;
        navigate(`/dna/messages/${newConv.id}`);
      }
    } catch {
      toast({ title: 'Error', description: 'Could not start conversation', variant: 'destructive' });
    }
  };

  // --- Mutual connection avatars ---
  const displayedMutuals = (mutualConnections || []).slice(0, 3);
  const mutualRemainder = Math.max(0, mutualCount - 3);

  return (
    <div
      role="article"
      onClick={handleViewProfile}
      className={cn(
        'relative bg-card border border-border rounded-lg p-4 cursor-pointer',
        'hover:shadow-md hover:border-dna-emerald/30 transition-all duration-200',
        'flex flex-col gap-3 min-h-[220px]'
      )}
    >
      {/* Country flag — top right */}
      {flag && (
        <span className="absolute top-3 right-3 text-lg" role="img" aria-label={member.country_of_origin || ''}>
          {flag}
        </span>
      )}

      {/* Layer 1: Avatar + Presence + Identity */}
      <div className="flex items-start gap-3 pr-8">
        {/* Avatar with presence dot */}
        <div className="relative shrink-0 group/avatar">
          <Avatar className="h-14 w-14 ring-2 ring-transparent group-hover/avatar:ring-dna-emerald/20 transition-all">
            <AvatarImage src={member.avatar_url} alt={member.full_name} />
            <AvatarFallback className="bg-dna-emerald-subtle text-dna-emerald-dark font-semibold text-base">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Presence dot */}
          <span
            className={cn(
              'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card',
              presence.color,
              presence.pulse && 'animate-pulse'
            )}
            title={presence.label}
          />
        </div>

        {/* Identity column */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base text-foreground leading-tight truncate">
            {member.full_name}
          </h3>
          <p className="text-sm text-muted-foreground leading-snug truncate">
            {member.headline || member.profession || 'DNA Community Member'}
          </p>
          {/* Sector chip */}
          {sector && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border border-dna-emerald-dark/40 text-dna-emerald-dark bg-transparent">
              {sector}
            </span>
          )}
        </div>
      </div>

      {/* Layer 3: Value line */}
      {valueLine && (
        <p className="text-xs text-muted-foreground italic leading-snug line-clamp-2">
          "{valueLine}"
        </p>
      )}

      {/* Layer 4: Social proof */}
      {mutualCount > 0 ? (
        <div className="flex items-center gap-2">
          {displayedMutuals.length > 0 && (
            <div className="flex -space-x-1.5">
              {displayedMutuals.map((mc) => (
                <Avatar key={mc.user_id} className="h-5 w-5 border-2 border-card">
                  <AvatarImage src={mc.avatar_url || undefined} />
                  <AvatarFallback className="bg-dna-emerald-subtle text-dna-emerald-dark text-[8px] font-semibold">
                    {mc.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {mutualRemainder > 0 && (
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted border-2 border-card text-[8px] font-semibold text-muted-foreground">
                  +{mutualRemainder}
                </div>
              )}
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {mutualCount} mutual {mutualCount === 1 ? 'connection' : 'connections'}
          </span>
        </div>
      ) : (member as { connections_count?: number }).connections_count ? (
        <span className="text-xs text-muted-foreground">
          {(member as { connections_count?: number }).connections_count} connections
        </span>
      ) : null}

      {/* Action row — pushed to bottom */}
      <div className="flex items-center justify-between pt-1 mt-auto">
        {/* Location & Member since */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground truncate min-w-0">
          {member.location && (
            <>
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{member.location}</span>
            </>
          )}
          {member.created_at && (
            <>
              {member.location && <span className="text-muted-foreground/40">·</span>}
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </>
          )}
        </div>

        {/* State-dependent button */}
        {connectionStatus === 'accepted' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMessage}
            className="rounded-full px-4 py-1.5 h-auto text-xs font-semibold border-dna-forest text-dna-forest hover:bg-dna-emerald-subtle shrink-0"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            Message
          </Button>
        ) : connectionStatus === 'pending_sent' ? (
          <Button
            size="sm"
            variant="ghost"
            disabled
            className="rounded-full px-4 py-1.5 h-auto text-xs font-semibold text-muted-foreground shrink-0"
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={isSending}
            className="rounded-full px-4 py-1.5 h-auto text-xs font-semibold bg-dna-emerald text-white hover:bg-dna-emerald-light shrink-0"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
