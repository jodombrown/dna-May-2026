/**
 * DNA Profile v2 - Diaspora Impact Dashboard
 * Main profile page at /dna/:username
 *
 * Includes SEO optimization for public profiles.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProfileV2 } from '@/hooks/useProfileV2';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMessage } from '@/contexts/MessageContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { ProfileV2VerificationMeta } from '@/types/profileV2';

// Profile v2 Components
import ProfileV2Hero from '@/components/profile-v2/ProfileV2Hero';
import ProfileV2About from '@/components/profile-v2/ProfileV2About';
import ProfileV2Connection from '@/components/profile-v2/ProfileV2Connection';
import ProfileV2Skills from '@/components/profile-v2/ProfileV2Skills';
import ProfileV2Contributions from '@/components/profile-v2/ProfileV2Contributions';
import ProfileV2Interests from '@/components/profile-v2/ProfileV2Interests';
import ProfileV2Activity from '@/components/profile-v2/ProfileV2Activity';
import ProfileV2StatusCard from '@/components/profile-v2/ProfileV2StatusCard';
import ProfileV2QuickStats from '@/components/profile-v2/ProfileV2QuickStats';
import ProfileV2Events from '@/components/profile-v2/ProfileV2Events';
import ProfileV2Spaces from '@/components/profile-v2/ProfileV2Spaces';
import ProfileV2Opportunities from '@/components/profile-v2/ProfileV2Opportunities';
import ProfileV2Stories from '@/components/profile-v2/ProfileV2Stories';
import { DiasporaFootprint } from '@/components/profile-v2/DiasporaFootprint';
import { ProfileConnectionContext } from '@/components/profile-v2/ProfileConnectionContext';
import { ProfileRecentPosts } from '@/components/profile-v2/ProfileRecentPosts';

import { MutualConnectionsWidget } from '@/components/connections/MutualConnectionsWidget';
import PublicProfileLandingView from '@/components/profile-v2/PublicProfileLandingView';
import { ManifestRenderer } from '@/components/contribute/manifest/ManifestRenderer';
import { NeedsRenderer } from '@/components/contribute/needs/NeedsRenderer';
import ProfileSectionLabel from '@/components/profile-v2/ProfileSectionLabel';

// SEO component for public profiles
import { PublicProfileSEO } from '@/components/public-profile';

// Profile view tracking
import { useTrackProfileView } from '@/hooks/useTrackProfileView';

// Profile completion calculation
import { calculateProfileCompletionPts } from '@/lib/profileCompletion';
import { getErrorMessage } from '@/lib/errorLogger';
import { connectionService } from '@/services/connectionService';

// Sprint 13 — Impact Radar, Badges, DIA Insight
import ImpactRadarChart from '@/components/profile/ImpactRadarChart';
import ProfileBadges from '@/components/profile/ProfileBadges';
import DiaUniqueInsight from '@/components/profile/DiaUniqueInsight';
import { useImpactScores } from '@/hooks/useImpactScores';

const ProfileV2: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { openMessageOverlay } = useMessage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: bundle, isLoading, error } = useProfileV2(username);
  const { data: ownerProfile } = useProfile();

  // Sprint 13: Impact scores for radar chart
  const { scores: impactScores } = useImpactScores(bundle?.profile?.id);

  // Track profile views for analytics (non-owner views only)
  useTrackProfileView({
    profileId: bundle?.profile?.id,
    enabled: !isLoading && !!bundle?.profile && !bundle?.permissions?.is_owner,
  });

  // Update handlers
  const handleUpdateAbout = async (bio: string) => {
    if (!user) return;
    const { error } = await supabase.rpc('update_profile_about', {
      p_user_id: user.id,
      p_bio: bio,
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['profile-v2', username] });
    toast({ title: 'About updated', description: 'Your bio has been updated successfully.' });
  };

  const handleUpdateSkills = async (skills: string[]) => {
    if (!user) return;
    const { error } = await supabase.rpc('update_profile_skills', {
      p_user_id: user.id,
      p_skills: JSON.stringify(skills),
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['profile-v2', username] });
    toast({ title: 'Skills updated', description: 'Your skills have been updated successfully.' });
  };

  const handleUpdateContributions = async (contributions: string[]) => {
    if (!user) return;
    const { error } = await supabase.rpc('update_profile_contributions', {
      p_user_id: user.id,
      p_contribution_tags: JSON.stringify(contributions),
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['profile-v2', username] });
    toast({ title: 'Contributions updated', description: 'Your contribution areas have been updated.' });
  };

  const handleUpdateInterests = async (interests: string[]) => {
    if (!user) return;
    const { error } = await supabase.rpc('update_profile_interests', {
      p_user_id: user.id,
      p_interests: JSON.stringify(interests),
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['profile-v2', username] });
    toast({ title: 'Interests updated', description: 'Your interests have been updated successfully.' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Graceful fallback for missing profile OR any query error
  if (error || !bundle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6 text-center">
          {username ? `@${username} doesn't exist or is temporarily unavailable.` : 'No username provided.'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate('/dna/connect/discover')}>
            Discover Members
          </Button>
        </div>
      </div>
    );
  }

  // Normalize the bundle - handle both flat RPC response and expected structure
  const profile = bundle.profile;
  const tags = bundle.tags ?? {};
  const activity = bundle.activity ?? { spaces: [], events: [] };

  // Owner detection: derive client-side so we NEVER render the visitor UI on
  // the owner's own profile even if the RPC forgets to stamp is_owner. The
  // RPC returns is_owner (snake_case) at the top of the bundle; older paths
  // returned isOwner (camelCase) or a nested permissions.is_owner. Fall back
  // to comparing the signed-in user id to the profile id as the source of truth.
  const rpcIsOwner =
    (bundle as unknown as { is_owner?: boolean; isOwner?: boolean }).is_owner ??
    (bundle as unknown as { isOwner?: boolean }).isOwner ??
    bundle.permissions?.is_owner ??
    false;
  const isOwnerViewer = !!user && !!bundle.profile?.id && user.id === bundle.profile.id;
  const rawIsOwner = rpcIsOwner || isOwnerViewer;

  // Show public landing view for signed-out visitors ONLY. An owner viewing
  // their own profile must never be routed through the visitor experience.
  if (!user || (bundle.should_show_public_landing && !isOwnerViewer)) {
    return <PublicProfileLandingView bundle={bundle} />;
  }

  const permissions = bundle.permissions ?? {
    is_owner: rawIsOwner,
    can_edit: rawIsOwner,
    can_create_events: true,
    can_create_public_spaces: true,
  };
  // Force the derived owner flag through, in case the RPC nested permissions
  // block came back with is_owner=false for the actual owner.
  permissions.is_owner = rawIsOwner;
  permissions.can_edit = permissions.can_edit || rawIsOwner;
  
  // Get connection status from bundle (populated by RPC)
  const connectionStatus = bundle.connection_status ?? 'none';
  
  // Ensure visibility has defaults
  const visibility = bundle.visibility ?? {
    about: 'public',
    skills: 'public',
    interests: 'public',
    activity: 'public',
  };
  
  // Ensure completion and verification_meta have defaults
  const completion = bundle.completion ?? { score: 0, suggested_actions: [] };
  
  // Derive verification tier from canonical profile completion score
  // This ensures the Verification widget is always in sync with the Profile Strength widget
  const profileForCompletion = permissions.is_owner && ownerProfile ? ownerProfile : profile;
  const completionScore = calculateProfileCompletionPts(profileForCompletion);
  
  // Build verification_meta from actual completion score
  // - 100 pts = soft_verified (auto-verified via profile completion)
  // - <100 pts = pending
  // - profile.verification_status can override to 'full' if admin-verified
  const derivedVerificationTier = ((): 'pending' | 'soft' | 'full' => {
    const dbStatus = profile?.verification_status;
    if (dbStatus === 'fully_verified') return 'full';
    if (completionScore >= 100) return 'soft';
    return 'pending';
  })();
  
  const verification_meta: ProfileV2VerificationMeta = {
    tier: derivedVerificationTier,
    status: derivedVerificationTier === 'full' ? 'fully_verified' : derivedVerificationTier === 'soft' ? 'soft_verified' : 'pending_verification',
    updated_at: profile?.created_at || null,
    improvement_suggestions: completionScore < 100 
      ? ['Complete your profile to 100% to unlock soft verification']
      : [],
  };

  // Check if this is a private profile (all main sections hidden for non-owner)
  const isPrivateProfile = !permissions.is_owner &&
    visibility?.about === 'hidden' &&
    visibility?.skills === 'hidden' &&
    visibility?.interests === 'hidden' &&
    visibility?.activity === 'hidden';

  // Private profile view for non-owners
  if (isPrivateProfile) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <div className="h-40 sm:h-52 w-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center text-center -mt-16">
            <Avatar className="w-28 h-28 border-4 border-background shadow-xl mb-4">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {(profile?.full_name || profile?.username || 'DN').split(' ').map(n => n[0]).join('').slice(0, 2) || 'DN'}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold text-foreground">{profile?.full_name || profile?.username || 'DNA Member'}</h1>
            <p className="text-muted-foreground text-sm mb-6">@{profile?.username || 'member'}</p>
            <Card className="max-w-md">
              <CardContent className="pt-6 text-center">
                <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">This profile is private</h2>
                <p className="text-muted-foreground text-sm">
                  {profile?.full_name || 'This user'} has chosen to keep their profile information private.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* SEO Meta Tags - for public profile visibility */}
      <PublicProfileSEO
        username={profile.username}
        fullName={profile.full_name || profile.username || 'DNA Member'}
        firstName={profile.first_name}
        lastName={profile.last_name}
        headline={profile.headline || profile.professional_role}
        bio={profile.bio}
        avatarUrl={profile.avatar_url}
        company={profile.company}
        linkedinUrl={(profile as unknown as { linkedin_url?: string }).linkedin_url}
        websiteUrl={(profile as unknown as { website_url?: string }).website_url}
        memberSince={profile.created_at}
      />

      {/* Hero Section */}
      <ProfileV2Hero
        profile={profile}
        permissions={{
          ...permissions,
          can_connect: connectionStatus === 'none' && !permissions.is_owner,
        }}
        connectionStatus={connectionStatus}
        connectionsCount={activity.connections_count ?? 0}
        onEdit={() => permissions.is_owner && navigate('/dna/profile/edit')}
        onConnect={async () => {
          if (!user || permissions.is_owner || connectionStatus !== 'none') return;
          try {
            const { data, error } = await supabase.functions.invoke('send-connection-request', {
              body: { target_user_id: profile.id },
            });
            if (error) throw error;
            const result = data as { status: string; message?: string; error?: string };
            if (result.status === 'pending') {
              toast({
                title: 'Connection request sent',
                description: `Your request to connect with ${profile.full_name} has been sent.`,
              });
              queryClient.invalidateQueries({ queryKey: ['profile-v2', username] });
            } else if (result.status === 'already_connected') {
              toast({ title: 'Already connected', description: result.message });
            } else if (result.status === 'already_pending' || result.status === 'request_received') {
              toast({ title: 'Request pending', description: result.message });
            } else if (result.status === 'profile_incomplete') {
              toast({ title: 'Profile Incomplete', description: result.message || 'Complete your profile to send requests.', variant: 'destructive' });
              navigate('/dna/profile/edit');
            } else {
              toast({ title: 'Unable to connect', description: result.error || 'Please try again.', variant: 'destructive' });
            }
          } catch (err: unknown) {
            toast({ title: 'Error', description: getErrorMessage(err) || 'Failed to send request', variant: 'destructive' });
          }
        }}
        onAcceptConnection={async () => {
          if (!user || permissions.is_owner || connectionStatus !== 'pending_received') return;
          try {
            // Find the pending connection request
            const { data: connection } = await supabase
              .from('connections')
              .select('id')
              .eq('requester_id', profile.id)
              .eq('recipient_id', user.id)
              .eq('status', 'pending')
              .single();

            if (!connection) {
              toast({ title: 'Request not found', variant: 'destructive' });
              return;
            }

            // Use connectionService to get event bus emission, notifications, and DIA nudges
            await connectionService.acceptConnectionRequest(connection.id);

            toast({
              title: 'Connection accepted',
              description: `You are now connected with ${profile.full_name}`,
            });
            queryClient.invalidateQueries({ queryKey: ['profile-v2', username] });
          } catch (err: unknown) {
            toast({ title: 'Error', description: getErrorMessage(err) || 'Failed to accept connection', variant: 'destructive' });
          }
        }}
        onMessage={() => openMessageOverlay(profile.id)}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <ProfileSectionLabel>About</ProfileSectionLabel>
              <div className="space-y-4">
                <ProfileV2About
                  profile={profile}
                  visibility={visibility}
                  isOwner={permissions.is_owner}
                  onUpdate={handleUpdateAbout}
                />
                <ManifestRenderer
                  targetUserId={profile.id}
                  viewerUserId={user?.id ?? null}
                />
                <NeedsRenderer
                  targetUserId={profile.id}
                  viewerUserId={user?.id ?? null}
                />
              </div>
            </section>

            <section>
              <ProfileSectionLabel>Five C&apos;s footprint</ProfileSectionLabel>
              <DiasporaFootprint
                userId={profile.id}
                isOwner={permissions.is_owner}
                username={profile.username}
                counts={(bundle.activity as { counts?: {
                  connections: number; events: number; spaces: number; contributions: number; posts: number;
                } })?.counts}
              />

            </section>

            <section>
              <ProfileSectionLabel>Activity</ProfileSectionLabel>
              <div className="space-y-4">
                <ProfileRecentPosts userId={profile.id} username={profile.username} />
                {!permissions.is_owner && user?.id && profile?.id && (
                  <ProfileConnectionContext
                    currentUserId={user.id}
                    targetUserId={profile.id}
                    targetName={profile.full_name || 'this member'}
                  />
                )}
                <ProfileV2Connection
                  profile={profile}
                  isOwner={permissions.is_owner}
                />
                <ProfileV2Events
                  profile={profile}
                  visibility={visibility}
                  isOwner={permissions.is_owner}
                />
                <ProfileV2Spaces
                  profile={profile}
                  visibility={visibility}
                  isOwner={permissions.is_owner}
                />
                <ProfileV2Opportunities
                  profile={profile}
                  visibility={visibility}
                  isOwner={permissions.is_owner}
                />
                <ProfileV2Stories
                  profile={profile}
                  visibility={visibility}
                  isOwner={permissions.is_owner}
                />
              </div>
            </section>

            <section>
              <ProfileSectionLabel>Expertise &amp; interests</ProfileSectionLabel>
              <div className="space-y-4">
                <ProfileV2Skills
                  tags={tags}
                  visibility={visibility}
                  isOwner={permissions.is_owner}
                  onUpdate={handleUpdateSkills}
                />
                <ProfileV2Contributions
                  tags={tags}
                  isOwner={permissions.is_owner}
                  onUpdate={handleUpdateContributions}
                />
                <ProfileV2Interests
                  tags={tags}
                  visibility={visibility}
                  isOwner={permissions.is_owner}
                  onUpdate={handleUpdateInterests}
                />
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Impact Radar Chart — Sprint 13A (owner only) */}
            {permissions.is_owner && impactScores && (
              <div className="bg-card border rounded-lg p-4 flex flex-col items-center">
                <h3 className="text-sm font-semibold mb-2 self-start">Five C&apos;s Impact</h3>
                <ImpactRadarChart
                  scores={impactScores}
                  size="lg"
                  interactive
                />
              </div>
            )}

            {/* DIA Unique Insight — Sprint 13B */}
            <DiaUniqueInsight
              userId={profile.id}
              isOwner={permissions.is_owner}
            />

            {/* Profile Badges — Sprint 13C */}
            <ProfileBadges
              userId={profile.id}
              isOwner={permissions.is_owner}
            />

            {/* Mutual Connections (Non-Owner Only) */}
            {!permissions.is_owner && user?.id && profile?.id && (
              <MutualConnectionsWidget
                userId={profile.id}
                currentUserId={user.id}
                variant="full"
              />
            )}

            {/* Profile Status Card (Owner Only) - Consolidated Progress + Verification */}
            {permissions.is_owner && (
              <ProfileV2StatusCard
                profile={profileForCompletion}
                verificationTier={derivedVerificationTier}
                username={profile?.username || username}
              />
            )}

            {/* Quick Stats Row */}
            <ProfileV2QuickStats
              activity={activity}
              username={profile?.username || username}
              isOwner={permissions.is_owner}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ProfileV2;
