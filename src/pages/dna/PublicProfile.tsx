import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  MapPin, 
  Briefcase, 
  Globe2, 
  MessageCircle, 
  UserPlus, 
  Clock, 
  MoreVertical,
  ArrowLeft,
  User,
  Flag,
  Ban
} from 'lucide-react';
import { BANNER_GRADIENTS, BannerGradientKey } from '@/lib/constants/bannerGradients';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { connectionService } from '@/services/connectionService';
import { messageService } from '@/services/messageService';
import { MESSAGING_ENABLED } from '@/config/featureFlags';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BlockUserDialog } from '@/components/safety/BlockUserDialog';
import { ReportDialog } from '@/components/safety/ReportDialog';
import { useState } from 'react';
import {
  ProfileSpacesSection,
  ProfileEventsSection,
  ProfileContributionsSection,
  ProfileStoriesSection,
} from '@/components/profile/cross-5c';
import { ProfileViewTracker } from '@/components/analytics/ProfileViewTracker';
import { ProfileViewersWidget } from '@/components/analytics/ProfileViewersWidget';
import { getErrorMessage } from '@/lib/errorLogger';

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const queryClient = useQueryClient();
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Profile not found');
      return data;
    },
    enabled: !!username,
  });

  // Get connection status
  const { data: connectionStatus } = useConnectionStatus(profile?.id);

  // Check if blocked
  const { data: isBlocked } = useQuery({
    queryKey: ['is-blocked', user?.id, profile?.id],
    queryFn: async () => {
      if (!user || !profile) return false;
      const { data } = await supabase
        .from('blocked_users')
        .select('id')
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_id.eq.${user.id})`)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!profile,
  });

  // Send connection request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Profile not found');
      
      const response = await supabase.functions.invoke('send-connection-request', {
        body: { target_user_id: profile.id },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-status', profile?.id] });
      trackEvent('connect_request_sent', { target_user_id: profile?.id });
      toast({
        title: 'Connection request sent',
        description: `Your request has been sent to ${profile?.full_name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send request',
        description: getErrorMessage(error) || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Handle message button
  const handleMessage = async () => {
    if (!profile) return;
    
    try {
      const { id: conversationId } = await messageService.getOrCreateConversation(profile.id);
      trackEvent('connect_conversation_started', { target_user_id: profile.id });
      navigate(`/dna/messages/${conversationId}`);
    } catch (error: unknown) {
      toast({
        title: 'Cannot start conversation',
        description: getErrorMessage(error) || 'You must be connected to message this user',
        variant: 'destructive',
      });
    }
  };

  // Fetch mutual connections
  const { data: mutualConnections } = useQuery({
    queryKey: ['mutual-connections', user?.id, profile?.id],
    queryFn: async () => {
      if (!user || !profile || user.id === profile.id) return [];
      const { data, error } = await supabase.rpc('get_mutual_connections', {
        p_viewer_id: user.id,
        p_target_user_id: profile.id,
        p_limit: 5,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profile && user.id !== profile.id,
  });

  const isOwnProfile = user?.id === profile?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-h1 font-serif mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The user you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/dna/connect/discover')}>
            Discover Members
          </Button>
        </div>
      </div>
    );
  }

  // If profile is private and not own profile
  if (!profile.is_public && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-h2 font-serif mb-2">Profile Private</h2>
              <p className="text-muted-foreground">
                This user has chosen to keep their profile private.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If users are blocked
  if (isBlocked && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <Ban className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-h2 font-serif mb-2">Profile Unavailable</h2>
              <p className="text-muted-foreground">
                This profile is not available to view.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main profile view
  return (
    <div className="min-h-screen bg-background pt-20 pb-bottom-nav md:pb-0">
      {/* Banner - supports gradients, images, and overlay */}
      {(() => {
        const bannerType = profile.banner_type || 'gradient';
        const bannerGradient = profile.banner_gradient || 'dna';
        const bannerOverlay = profile.banner_overlay || false;
        
        const getBannerStyle = () => {
          if (bannerType === 'image' && profile.banner_url) {
            return { 
              backgroundImage: `url(${profile.banner_url})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center' 
            };
          }
          if (bannerType === 'gradient') {
            const gradient = BANNER_GRADIENTS[bannerGradient as BannerGradientKey];
            return { background: gradient?.css || BANNER_GRADIENTS.dna.css };
          }
          return { background: BANNER_GRADIENTS.dna.css };
        };

        return (
          <div 
            className="h-64 relative"
            style={getBannerStyle()}
          >
            {bannerOverlay && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            )}
          </div>
        );
      })()}

      <div className="container max-w-4xl mx-auto px-4 pb-16">
        {!isOwnProfile && (
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mt-4 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        {/* Header Card */}
        <Card className="-mt-24 relative">
          <CardContent className="pt-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-6">
                <Avatar className="w-32 h-32 border-4 border-background">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl bg-dna-mint text-dna-forest">
                    {profile.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-h1 font-serif mb-2">{profile.full_name || 'DNA Member'}</h1>
                  
                  {profile.professional_role && (
                    <div className="flex items-center text-muted-foreground mb-2">
                      <Briefcase className="w-4 h-4 mr-2" />
                      <span>{profile.professional_role}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {(profile.current_city || profile.current_country) && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          {profile.current_city && profile.current_country
                            ? `Based in ${profile.current_city}, ${profile.current_country}`
                            : `Based in ${profile.current_city || profile.current_country}`}
                        </span>
                      </div>
                    )}
                    {(profile as any).primary_origin_country && (profile as any).primary_origin_country !== profile.current_country && (
                      <div className="flex items-center">
                        <Globe2 className="w-4 h-4 mr-1" />
                        <span>From {(profile as any).primary_origin_country}</span>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {!isOwnProfile && (
                <div className="flex items-center gap-2">
                  {connectionStatus === 'none' && !isBlocked && (
                    <Button
                      onClick={() => sendRequestMutation.mutate()}
                      disabled={sendRequestMutation.isPending}
                      className="bg-dna-copper hover:bg-dna-gold"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                  
                  {connectionStatus === 'pending_sent' && (
                    <Button disabled variant="outline">
                      <Clock className="w-4 h-4 mr-2" />
                      Request Sent
                    </Button>
                  )}
                  
                  {connectionStatus === 'pending_received' && (
                    <Button variant="outline" onClick={() => navigate('/dna/connect/network?tab=requests')}>
                      Respond to Request
                    </Button>
                  )}
                  
                  {/* BD063 hide-and-freeze: Message entry hidden while DM messaging is OUT at v0.0. */}
                  {MESSAGING_ENABLED && connectionStatus === 'accepted' && (
                    <Button onClick={handleMessage} variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  )}

                  {/* More actions menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
                        <Ban className="w-4 h-4 mr-2" />
                        Block User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                        <Flag className="w-4 h-4 mr-2" />
                        Report User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {isOwnProfile && (
                <Button onClick={() => navigate('/dna/profile/edit')}>
                  Edit Profile
                </Button>
              )}
            </div>


            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Skills & Expertise */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.focus_areas && profile.focus_areas.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Focus Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.focus_areas.map((area, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => navigate(`/dna/connect/discover?focus=${encodeURIComponent(area)}`)}
                        aria-label={`Find members with focus area: ${area}`}
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                      >
                        <Badge variant="outline" className="border-dna-copper hover:bg-dna-copper/10 cursor-pointer transition-colors">{area}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {profile.industries && profile.industries.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.industries.map((industry, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => navigate(`/dna/connect/discover?industry=${encodeURIComponent(industry)}`)}
                        aria-label={`Find members in industry: ${industry}`}
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                      >
                        <Badge variant="secondary" className="hover:bg-secondary/70 cursor-pointer transition-colors">{industry}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {profile.regional_expertise && profile.regional_expertise.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Regional Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.regional_expertise.map((region, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => navigate(`/dna/connect/discover?region=${encodeURIComponent(region)}`)}
                        aria-label={`Find members with regional expertise: ${region}`}
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                      >
                        <Badge variant="outline" className="hover:bg-muted cursor-pointer transition-colors">{region}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Availability flags */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">Open To</h3>
              <div className="flex flex-wrap gap-3">
                {profile.open_to_opportunities && (
                  <button
                    type="button"
                    onClick={() => navigate('/dna/contribute')}
                    aria-label="Browse opportunities"
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                  >
                    <Badge className="bg-dna-emerald hover:bg-dna-emerald/90 cursor-pointer transition-colors">Opportunities</Badge>
                  </button>
                )}
                {profile.available_for && profile.available_for.length > 0 && (
                  profile.available_for.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => navigate(`/dna/connect/discover?available_for=${encodeURIComponent(item)}`)}
                      aria-label={`Find members available for: ${item}`}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                    >
                      <Badge variant="outline" className="hover:bg-muted cursor-pointer transition-colors">{item}</Badge>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Mutual Connections */}
            {!isOwnProfile && mutualConnections && mutualConnections.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">
                  {mutualConnections.length} Mutual Connection{mutualConnections.length !== 1 ? 's' : ''}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {mutualConnections.map((conn: any) => (
                    <div
                      key={conn.id}
                      className="flex items-center gap-2 p-2 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate(`/dna/${conn.username}`)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={conn.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-dna-mint text-dna-forest">
                          {conn.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">{conn.full_name}</p>
                        {conn.headline && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {conn.headline}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile View Tracker - Auto-tracks views */}
        <ProfileViewTracker profileId={profile.id} />

        {/* Profile Viewers Widget - Only shown to profile owner */}
        {isOwnProfile && (
          <div className="mt-6">
            <ProfileViewersWidget profileId={profile.id} />
          </div>
        )}

        {/* Cross-5C Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <ProfileSpacesSection userId={profile.id} />
          <ProfileEventsSection userId={profile.id} />
          <ProfileContributionsSection userId={profile.id} />
          <ProfileStoriesSection userId={profile.id} />
        </div>
      </div>

      {/* Safety Dialogs */}
      {profile && (
        <>
          <BlockUserDialog
            open={showBlockDialog}
            onOpenChange={setShowBlockDialog}
            userId={profile.id}
            userName={profile.full_name || 'this user'}
            onBlockSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['is-blocked'] });
              queryClient.invalidateQueries({ queryKey: ['connection-status'] });
              navigate('/dna/connect/discover');
            }}
          />
          <ReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            targetUserId={profile.id}
            context="profile"
          />
        </>
      )}
    </div>
  );
};

export default PublicProfile;