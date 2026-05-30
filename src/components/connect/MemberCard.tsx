import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  UserPlus, 
  Check, 
  MessageSquare, 
  Users,
  MoreHorizontal,
  Bookmark,
  Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useMutualConnections } from '@/hooks/useMutualConnections';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getErrorMessage } from '@/lib/errorLogger';
import { FollowButton } from '@/components/profile/FollowButton';

interface MemberCardProps {
  member: {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string;
    headline?: string;
    profession?: string;
    location?: string;
    primary_origin_country?: string;
    current_country?: string;
    focus_areas?: string[];
    industries?: string[];
    skills?: string[];
    languages?: string[];
    available_for?: string[];
    regional_expertise?: string[];
    is_mentor?: boolean;
    is_investor?: boolean;
    match_score: number;
  };
  onConnectionSent?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onConnectionSent }) => {
  const { user } = useAuth();
  const { data: currentUserProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const [isSending, setIsSending] = useState(false);
  const { data: connectionStatus, refetch: refetchStatus } = useConnectionStatus(member.id);
  const { mutualCount, hasMutualConnections } = useMutualConnections(user?.id, member.id);

  // Get primary industry/expertise for "source" badge
  const getPrimaryLabel = (): string | null => {
    if (member.is_mentor) return 'Mentor';
    if (member.is_investor) return 'Investor';
    if (member.industries?.[0]) return member.industries[0];
    if (member.focus_areas?.[0]) return member.focus_areas[0];
    return null;
  };

  const primaryLabel = getPrimaryLabel();

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-connection-request', {
        body: { target_user_id: member.id },
      });

      if (error) throw error;

      const result = data as { status: string; message?: string; error?: string };

      if (result.status === 'pending') {
        await refetchStatus();
        toast({
          title: 'Connection request sent',
          description: `Your request to connect with ${member.full_name} has been sent.`,
        });
        await trackEvent('connect_request_sent', { target_user_id: member.id });
        onConnectionSent?.();
      } else if (result.status === 'profile_incomplete') {
        toast({
          title: 'Profile Incomplete',
          description: result.message || 'Complete your profile to at least 40% to send connection requests.',
          variant: 'destructive',
        });
        navigate('/dna/profile/edit');
      } else if (result.status === 'already_connected') {
        toast({
          title: 'Already connected',
          description: result.message,
        });
      } else if (result.status === 'already_pending' || result.status === 'request_received') {
        toast({
          title: 'Request pending',
          description: result.message,
        });
      } else {
        toast({
          title: 'Unable to connect',
          description: result.error || 'Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Error sending request',
        description: getErrorMessage(error) || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMessage = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({ user_a: user.id, user_b: member.id })
          .select('id')
          .single();

        if (error) throw error;
        navigate(`/dna/messages/${newConv.id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not start conversation',
        variant: 'destructive',
      });
    }
  };

  const handleViewProfile = () => {
    navigate(`/dna/${member.username}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const profileUrl = `${window.location.origin}/dna/${member.username}`;
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: 'Link copied',
      description: 'Profile link copied to clipboard',
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: 'Profile saved',
      description: `${member.full_name} added to your saved profiles`,
    });
  };

  // Build metadata string like Apple News: "Location · Mutual connections"
  const getMetadataString = (): string => {
    const parts: string[] = [];
    if (member.location) parts.push(member.location);
    if (hasMutualConnections) parts.push(`${mutualCount} mutual${mutualCount !== 1 ? 's' : ''}`);
    if (member.primary_origin_country && !member.location) parts.push(member.primary_origin_country);
    return parts.join(' · ');
  };

  const metadata = getMetadataString();

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 } as const}
      className="w-full"
    >
      <Card 
        className="bg-card/60 backdrop-blur-sm border-border/30 overflow-hidden cursor-pointer hover:bg-card/80 transition-colors"
        onClick={handleViewProfile}
      >
        <div className="p-3 md:p-4">
          {/* Apple News style: Two columns - Text left, Image right */}
          <div className="flex gap-2 sm:gap-2.5 md:gap-3">
            {/* Left column: Content */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Source badge (like USA TODAY, The Guardian) */}
              <div className="flex items-center gap-2 mb-1.5">
                {primaryLabel && (
                  <Badge 
                    variant="secondary" 
                    className="w-fit px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary border-0"
                  >
                    {primaryLabel}
                  </Badge>
                )}
                {/* Match Score Badge — single line */}
                {member.match_score > 0 && (
                  <Badge 
                    variant="outline" 
                    className={`w-fit px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                      member.match_score >= 80 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : member.match_score >= 60 
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {member.match_score}%
                  </Badge>
                )}
              </div>

              {/* Headline: Name */}
              <h3 className="font-semibold text-base text-foreground leading-tight mb-1 line-clamp-2">
                {member.full_name}
              </h3>

              {/* Subheadline: Role/Profession */}
              <p className="text-sm text-muted-foreground leading-snug line-clamp-2 mb-2">
                {member.headline || member.profession || 'DNA Community Member'}
              </p>

              {/* Metadata footer like Apple News: "Location · Mutual connections" */}
              <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground/70">
                {member.location && <MapPin className="h-3 w-3 shrink-0" />}
                <span className="truncate">{metadata || 'DNA Member'}</span>
              </div>
            </div>

            {/* Right column: Square avatar + actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* Square avatar with rounded corners - Apple News style */}
              <Avatar className="h-[60px] w-[60px] sm:h-[72px] sm:w-[72px] rounded-xl">
                <AvatarImage
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="object-cover"
                  loading="lazy"
                />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold rounded-xl">
                  {(member.full_name || member.username || 'DN')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Action row: Connect/Status button + overflow menu */}
              <div className="flex items-center gap-1 flex-wrap justify-end max-w-full">
                {/* Connection Action Button */}
                {connectionStatus === 'accepted' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={(e) => { e.stopPropagation(); handleMessage(); }}
                  >
                    <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    Message
                  </Button>
                ) : connectionStatus === 'pending_sent' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs text-muted-foreground border-muted"
                    disabled
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    Sent
                  </Button>
                ) : connectionStatus === 'pending_received' ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs bg-primary text-primary-foreground"
                    onClick={(e) => { e.stopPropagation(); navigate('/dna/connect/network?tab=requests'); }}
                  >
                    <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    Respond
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleConnect}
                    disabled={isSending}
                  >
                    <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    {isSending ? '...' : 'Connect'}
                  </Button>
                )}

                {/* Follow button */}
                <FollowButton targetUserId={member.id} compact />

                {/* Overflow menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="p-1.5 sm:p-2 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={handleSave}>
                      <Bookmark className="mr-2 h-4 w-4" />
                      Save Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Profile
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
        </div>
      </Card>
    </motion.div>
  );
};
