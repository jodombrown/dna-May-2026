import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sankofa } from '@/components/icons/adinkra';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MapPin, UserPlus, Check, MessageSquare, Users, MoreHorizontal, Bookmark, Share2, UserCheck, ExternalLink, ChevronDown, Eye, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useMutualConnections } from '@/hooks/useMutualConnections';
import { FiveCsEngagement } from './FiveCsEngagement';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errorLogger';
import { CulturalPattern } from '@/components/shared/CulturalPattern';
import { getFlag } from '@/lib/countryFlags';
import { getRoleLabel } from '@/components/onboarding/RoleDeclarationStep';
import type { Database } from '@/integrations/supabase/types';

// Sector color mapping
const SECTOR_COLORS: Record<string, string> = {
  TECHNOLOGY: 'bg-blue-100 text-blue-700 border-blue-200',
  EDUCATION: 'bg-copper-100 text-copper-700 border-copper-200',
  AGRICULTURE: 'bg-green-100 text-green-700 border-green-200',
  HEALTHCARE: 'bg-rose-100 text-rose-700 border-rose-200',
  FINANCE: 'bg-amber-100 text-amber-700 border-amber-200',
  MEDIA: 'bg-copper-100 text-copper-700 border-copper-200',
  ARTS: 'bg-copper-100 text-copper-700 border-copper-200',
  GOVERNMENT: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  NONPROFIT: 'bg-teal-100 text-teal-700 border-teal-200',
  ENERGY: 'bg-orange-100 text-orange-700 border-orange-200',
  DEFAULT: 'bg-neutral-100 text-neutral-700 border-neutral-200',
};

// Available-for label mapping
const AVAILABLE_FOR_LABELS: Record<string, { label: string; emoji: string }> = {
  mentoring: { label: 'Mentoring', emoji: '🎯' },
  mentorship: { label: 'Mentoring', emoji: '🎯' },
  collaboration: { label: 'Collaboration', emoji: '🤝' },
  investing: { label: 'Investing', emoji: '💰' },
  investment: { label: 'Investing', emoji: '💰' },
  speaking: { label: 'Speaking', emoji: '🎤' },
  advising: { label: 'Advising', emoji: '💡' },
  advisory: { label: 'Advising', emoji: '💡' },
  consulting: { label: 'Consulting', emoji: '📊' },
  hiring: { label: 'Hiring', emoji: '👥' },
  partnerships: { label: 'Partnerships', emoji: '🔗' },
  volunteering: { label: 'Volunteering', emoji: '❤️' },
  cofounding: { label: 'Co-founding', emoji: '🚀' },
  networking: { label: 'Networking', emoji: '🌐' },
};

interface EnhancedMemberCardProps {
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
    skills?: string[];
    languages?: string[];
    available_for?: string[];
    role?: Database["public"]["Enums"]["dna_identity_role"] | null;
    regional_expertise?: string[];
    ethnic_heritage?: string[];
    is_mentor?: boolean;
    is_investor?: boolean;
    match_score: number;
    match_reasons?: string[];
    shared_events?: number;
    shared_skills?: string[];
    shared_focus_areas?: string[];
    last_seen_at?: string;
    created_at?: string;
  };
  onConnectionSent?: () => void;
  onMessage?: (memberId: string) => void;
  variant?: 'default' | 'compact';
}

/**
 * EnhancedMemberCard - Redesigned member card with expandable preview,
 * heritage flags, activity signals, seeking tags, and cool animations.
 */
export function EnhancedMemberCard({
  member,
  onConnectionSent,
  onMessage,
  variant = 'default',
}: EnhancedMemberCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: connectionStatus, refetch: refetchStatus } = useConnectionStatus(member.id);
  const { mutualCount, hasMutualConnections } = useMutualConnections(user?.id, member.id);

  // Determine primary sector badge
  const primarySector = useMemo(() => {
    if (member.industries?.[0]) return member.industries[0].toUpperCase();
    if (member.focus_areas?.[0]) return member.focus_areas[0].toUpperCase();
    return null;
  }, [member.industries, member.focus_areas]);

  const sectorColor = primarySector
    ? SECTOR_COLORS[primarySector] || SECTOR_COLORS.DEFAULT
    : SECTOR_COLORS.DEFAULT;

  // Heritage flag
  const heritageFlag = getFlag(member.country_of_origin);
  const heritageCountries = member.ethnic_heritage?.slice(0, 3) || [];

  // Activity signal
  const activitySignal = useMemo(() => {
    if (member.last_seen_at) {
      const lastSeen = new Date(member.last_seen_at);
      const now = new Date();
      const diffHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
      if (diffHours < 1) return { label: 'Online now', color: 'bg-emerald-500' };
      if (diffHours < 24) return { label: 'Active today', color: 'bg-emerald-400' };
      if (diffHours < 168) return { label: 'Active this week', color: 'bg-amber-400' };
    }
    if (member.created_at) {
      const joined = new Date(member.created_at);
      const now = new Date();
      const diffDays = (now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 14) return { label: 'New member', color: 'bg-blue-400' };
    }
    return null;
  }, [member.last_seen_at, member.created_at]);

  // Available for / seeking
  const seekingTags = useMemo(() => {
    if (!member.available_for?.length) return [];
    return member.available_for.slice(0, 3).map((item) => {
      const key = item.toLowerCase().replace(/\s+/g, '');
      return AVAILABLE_FOR_LABELS[key] || { label: item, emoji: '✨' };
    });
  }, [member.available_for]);

  // Build match reasons
  const matchReasons = useMemo(() => {
    const reasons: string[] = [];
    if (member.match_reasons) return member.match_reasons.slice(0, 3);
    if (member.shared_events && member.shared_events > 0) {
      reasons.push(`${member.shared_events} shared event${member.shared_events > 1 ? 's' : ''}`);
    }
    if (hasMutualConnections) {
      reasons.push(`${mutualCount} mutual connection${mutualCount !== 1 ? 's' : ''}`);
    }
    if (member.shared_focus_areas?.length) {
      reasons.push(`Both focus on ${member.shared_focus_areas[0]}`);
    }
    if (member.shared_skills?.length) {
      reasons.push(`Shared skill: ${member.shared_skills[0]}`);
    }
    return reasons.slice(0, 3);
  }, [member, hasMutualConnections, mutualCount]);

  // Match score tooltip
  const matchTooltipContent = useMemo(() => {
    if (member.match_score >= 80) return 'High compatibility based on shared interests, location, and network overlap';
    if (member.match_score >= 60) return 'Good match based on complementary skills and focus areas';
    if (member.match_score >= 40) return 'Potential connection based on industry alignment';
    return 'Explore their profile to discover common ground';
  }, [member.match_score]);

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
        toast({ title: 'Connection request sent', description: `Your request to connect with ${member.full_name} has been sent.` });
        await trackEvent('connect_request_sent', { target_user_id: member.id });
        onConnectionSent?.();
      } else if (result.status === 'profile_incomplete') {
        toast({ title: 'Profile Incomplete', description: result.message || 'Complete your profile to at least 40% to send connection requests.', variant: 'destructive' });
        navigate('/dna/profile/edit');
      } else {
        toast({ title: 'Request status', description: result.message || 'Please try again later.' });
      }
    } catch (error: unknown) {
      toast({ title: 'Error sending request', description: getErrorMessage(error) || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleMessage = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onMessage) { onMessage(member.id); return; }
    if (!user) return;
    try {
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user_a.eq.${user.id},user_b.eq.${member.id}),and(user_a.eq.${member.id},user_b.eq.${user.id})`)
        .maybeSingle();
      if (existingConversation) {
        navigate(`/dna/messages/${existingConversation.id}`);
      } else {
        const { data: newConv, error } = await supabase.from('conversations').insert({ user_a: user.id, user_b: member.id }).select('id').single();
        if (error) throw error;
        navigate(`/dna/messages/${newConv.id}`);
      }
    } catch {
      toast({ title: 'Error', description: 'Could not start conversation', variant: 'destructive' });
    }
  };

  const handleViewProfile = () => navigate(`/dna/${member.username}`);
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/dna/${member.username}`);
    toast({ title: 'Link copied', description: 'Profile link copied to clipboard' });
  };
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({ title: 'Profile saved', description: `${member.full_name} added to your saved profiles` });
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCompact = variant === 'compact';

  return (
    <TooltipProvider>
      <motion.div
        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="w-full"
      >
        <Card
          className="group relative bg-card/60 backdrop-blur-sm border-border/30 overflow-hidden cursor-pointer hover:bg-card/80 hover:shadow-lg transition-all duration-300"
          onClick={handleViewProfile}
        >
          {/* Mudcloth pattern — visible on hover only */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <CulturalPattern pattern="mudcloth" opacity={0.04} />
          </div>

          <div className={cn('relative p-3 sm:p-4', isCompact && 'p-2.5 sm:p-3')}>
            <div className="flex gap-2 sm:gap-3">
              {/* Left column: Content */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Top row: Sector + Match Score + Activity */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {primarySector && (
                    <Badge
                      variant="outline"
                      className={cn('w-fit px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border', sectorColor)}
                    >
                      {primarySector}
                    </Badge>
                  )}

                  {member.match_score >= 60 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            'w-fit px-2 py-0.5 text-[10px] font-bold cursor-help gap-1 whitespace-nowrap',
                            member.match_score >= 80
                              ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-100'
                              : 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-300 shadow-sm shadow-amber-100'
                          )}
                        >
                          <Sankofa className="h-3 w-3" />
                          {member.match_score}% Match
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs bg-popover border border-border">
                        <div className="flex items-start gap-2">
                          <Sankofa className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">DIA Match Score</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{matchTooltipContent}</p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Activity signal */}
                  {activitySignal && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', activitySignal.color)} />
                      {activitySignal.label}
                    </span>
                  )}
                </div>

                {/* Name + Heritage Flag */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3
                    className={cn(
                      'font-semibold text-foreground leading-tight line-clamp-1',
                      isCompact ? 'text-sm' : 'text-base'
                    )}
                  >
                    {member.full_name}
                  </h3>
                  {heritageFlag && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm shrink-0 cursor-help" role="img" aria-label={member.country_of_origin || 'Heritage'}>
                          {heritageFlag}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Heritage: {member.country_of_origin}
                        {getRoleLabel(member.role) && ` · ${getRoleLabel(member.role)}`}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Headline */}
                <p className={cn('text-muted-foreground leading-snug line-clamp-1 mb-1.5', isCompact ? 'text-xs' : 'text-sm')}>
                  {member.headline || member.profession || 'DNA Community Member'}
                </p>

                {/* Seeking / Available For tags */}
                {seekingTags.length > 0 && !isCompact && (
                  <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">Open to:</span>
                    {seekingTags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="px-1.5 py-0 text-[10px] font-normal border-primary/20 text-primary/80 bg-primary/5"
                      >
                        <span className="mr-0.5">{tag.emoji}</span>
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Match reasons */}
                {matchReasons.length > 0 && !isCompact && (
                  <div className="flex items-start gap-1.5 mb-1.5">
                    <Sankofa className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-snug">
                      {matchReasons.slice(0, 2).map((reason, index) => (
                        <span key={index}>
                          {index > 0 && <span className="mx-1 text-border">·</span>}
                          <span className="font-medium text-foreground">{reason}</span>
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                {/* Location + Mutual footer */}
                <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  {member.location && <MapPin className="h-3 w-3 shrink-0" />}
                  <span className="truncate">
                    {member.location || member.current_country || 'DNA Member'}
                    {hasMutualConnections && member.location && ' · '}
                    {hasMutualConnections && (
                      <span className="inline-flex items-center gap-0.5">
                        <Users className="h-3 w-3 inline" />
                        {mutualCount} mutual
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Right column: Avatar + Actions */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                {/* Avatar with activity ring */}
                <div className="relative">
                  <Avatar className={cn('rounded-xl', isCompact ? 'h-14 w-14 sm:h-16 sm:w-16' : 'h-[60px] w-[60px] sm:h-[72px] sm:w-[72px] md:h-20 md:w-20',
                    activitySignal?.label === 'Online now' && 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-background'
                  )}>
                    <AvatarImage src={member.avatar_url} alt={member.full_name} className="object-cover" loading="eager" />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold rounded-xl">
                      {(member.full_name || member.username || 'DN').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Heritage flag overlay on avatar */}
                  {heritageCountries.length > 1 && (
                    <div className="absolute -bottom-1 -right-1 flex -space-x-1">
                      {heritageCountries.slice(0, 2).map((h, i) => (
                        <span key={i} className="text-xs bg-background rounded-full px-0.5 shadow-sm" role="img" aria-label={h}>
                          {getFlag(h) || '🌍'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-wrap justify-end max-w-full">
                  {connectionStatus === 'accepted' ? (
                    <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={(e) => { e.stopPropagation(); handleMessage(); }}
                    >
                      <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      Message
                    </Button>
                  ) : connectionStatus === 'pending_sent' ? (
                    <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs text-muted-foreground border-muted" disabled onClick={(e) => e.stopPropagation()}>
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      Sent
                    </Button>
                  ) : connectionStatus === 'pending_received' ? (
                    <Button variant="default" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs bg-primary text-primary-foreground"
                      onClick={(e) => { e.stopPropagation(); navigate('/dna/connect/network?tab=requests'); }}
                    >
                      <UserCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      Respond
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleConnect} disabled={isSending}
                    >
                      <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      {isSending ? '...' : 'Connect'}
                    </Button>
                  )}

                  {/* Overflow menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="p-1.5 sm:p-2 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleViewProfile}>
                        <ExternalLink className="mr-2 h-4 w-4" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSave}>
                        <Bookmark className="mr-2 h-4 w-4" /> Save Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" /> Share Profile
                      </DropdownMenuItem>
                      {hasMutualConnections && (
                        <>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
                            <Users className="h-3 w-3" />
                            {mutualCount} mutual connection{mutualCount !== 1 ? 's' : ''}
                          </div>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Expand toggle — "Quick peek" */}
            {!isCompact && (
              <motion.button
                className="w-full flex items-center justify-center gap-1 pt-2 mt-1 border-t border-border/30 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                onClick={toggleExpand}
                whileHover={{ color: 'var(--foreground)' }}
              >
                <Eye className="h-3 w-3" />
                <span>{isExpanded ? 'Less' : 'Quick peek'}</span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3 w-3" />
                </motion.div>
              </motion.button>
            )}

            {/* Expandable Preview Section */}
            <AnimatePresence>
              {isExpanded && !isCompact && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-3">
                    {/* Heritage row */}
                    {(member.country_of_origin || heritageCountries.length > 0) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Heritage</span>
                        {member.country_of_origin && (
                          <Badge variant="outline" className="text-[11px] font-normal border-dna-ochre/30 bg-dna-ochre/5 text-foreground gap-1">
                            <span>{heritageFlag}</span>
                            {member.country_of_origin}
                            {getRoleLabel(member.role) && (
                              <span className="text-muted-foreground/60 ml-0.5">· {getRoleLabel(member.role)}</span>
                            )}
                          </Badge>
                        )}
                        {heritageCountries.filter(h => h !== member.country_of_origin).map((h, i) => (
                          <Badge key={i} variant="outline" className="text-[11px] font-normal border-border/50 gap-1">
                            <span>{getFlag(h)}</span>
                            {h}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Skills row */}
                    {member.skills && member.skills.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Skills</span>
                        {member.skills.slice(0, 5).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-[11px] font-normal bg-muted/80">
                            {skill}
                          </Badge>
                        ))}
                        {member.skills.length > 5 && (
                          <span className="text-[10px] text-muted-foreground">+{member.skills.length - 5}</span>
                        )}
                      </div>
                    )}

                    {/* Five C's Engagement */}
                    <FiveCsEngagement userId={member.id} compact className="mb-0" />

                    {/* View full profile CTA */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs text-primary hover:text-primary/80 hover:bg-primary/5"
                      onClick={(e) => { e.stopPropagation(); handleViewProfile(); }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      View full profile
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

export default EnhancedMemberCard;
