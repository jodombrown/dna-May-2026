import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, MapPin, Globe, Briefcase, MessageCircle, UserPlus, Clock, Check, UserCheck, Users, Calendar } from 'lucide-react';
import { ProfileV2Data, ProfileV2Permissions, VerificationStatus, ConnectionStatus } from '@/types/profileV2';
import { getFlag, getDiasporaRegionTag } from '@/lib/countryFlags';
import { originCodeToName } from '@/lib/memberHeritage';
import { ProfilePresenceDot } from './ProfilePresenceDot';
import { useToast } from '@/hooks/use-toast';
import { ProfileShareDropdown } from '@/components/profile/ProfileShareDropdown';
import { BANNER_GRADIENTS, BannerGradientKey } from '@/lib/constants/bannerGradients';
import { FollowButton } from '@/components/profile/FollowButton';
import { useFollow } from '@/hooks/useFollow';
import { CulturalPattern } from '@/components/shared/CulturalPattern';

interface ProfileV2HeroProps {
  profile: ProfileV2Data;
  permissions: ProfileV2Permissions;
  connectionStatus?: ConnectionStatus;
  connectionsCount?: number;
  onEdit?: () => void;
  onConnect?: () => void;
  onAcceptConnection?: () => void;
  onMessage?: () => void;
}

// Returns whether user is verified for gradient ring display
const isVerified = (status: VerificationStatus): boolean => {
  return status === 'fully_verified' || status === 'soft_verified';
};

// Gradient ring wrapper for verified users - uses DNA cultural colors with 3D shadow
const VerificationRing: React.FC<{ status: VerificationStatus; children: React.ReactNode }> = ({ status, children }) => {
  if (!isVerified(status)) {
    return <>{children}</>;
  }
  
  const isFullyVerified = status === 'fully_verified';
  
  return (
    <div 
      className="relative p-1 rounded-full"
      style={{
        background: isFullyVerified 
          ? 'linear-gradient(135deg, hsl(38 70% 50%), hsl(18 60% 55%), hsl(25 85% 55%))'
          : 'linear-gradient(135deg, hsl(183 28% 28%), hsl(160 35% 45%))',
        boxShadow: isFullyVerified
          ? '0 4px 20px hsla(38, 70%, 50%, 0.4), 0 2px 8px hsla(18, 60%, 55%, 0.3), 0 6px 24px hsla(25, 85%, 55%, 0.25)'
          : '0 4px 16px hsla(183, 28%, 28%, 0.35), 0 2px 6px hsla(160, 35%, 45%, 0.25)'
      }}
    >
      {children}
    </div>
  );
};

const ProfileV2Hero: React.FC<ProfileV2HeroProps> = ({
  profile,
  permissions,
  connectionStatus = 'none',
  connectionsCount = 0,
  onEdit,
  onConnect,
  onAcceptConnection,
  onMessage,
}) => {
  const { toast } = useToast();
  const { followerCount, followingCount } = useFollow(profile.id);
  const navigate = useNavigate();

  const networkBase = permissions.is_owner
    ? '/dna/connect/network'
    : '/dna/connect/discover';
  const goToNetwork = (tab: 'connections' | 'followers' | 'following') => {
    navigate(permissions.is_owner ? `${networkBase}?tab=${tab}` : networkBase);
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/dna/${profile.username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: 'Link copied!',
        description: 'Profile link copied to clipboard',
      });
    } catch {
      toast({
        title: 'Share profile',
        description: profileUrl,
      });
    }
  };

  // Get banner style based on banner_type, banner_gradient, and banner_url
  const getBannerStyle = (): React.CSSProperties => {
    const bannerType = profile.banner_type || 'gradient';
    const bannerGradient = profile.banner_gradient || 'dna';
    const bannerUrl = profile.banner_url;

    if (bannerType === 'image' && bannerUrl) {
      return {
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    
    if (bannerType === 'gradient' && bannerGradient) {
      const gradient = BANNER_GRADIENTS[bannerGradient as BannerGradientKey];
      return { background: gradient?.css || BANNER_GRADIENTS.dna.css };
    }
    
    // Default fallback to DNA gradient
    return { background: BANNER_GRADIENTS.dna.css };
  };

  return (
    <div className="relative w-full">
      {/* Banner */}
      <div
        className="h-32 sm:h-44 md:h-56 w-full relative overflow-hidden"
        style={getBannerStyle()}
      >
        {/* Cultural pattern overlay — defaults to Kente, respects user preference */}
        <CulturalPattern
          pattern={((profile as unknown as Record<string, unknown>).preferred_pattern as 'kente' | 'mudcloth' | 'ndebele' | 'adinkra') || 'kente'}
          opacity={0.08}
        />
        {/* Dark overlay for text contrast if enabled */}
        {profile.banner_overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        )}
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Avatar & Actions Row */}
        <div className="relative -mt-14 sm:-mt-18 md:-mt-20">
          <div className="flex items-end justify-between gap-4">
            {/* Avatar with Verification Ring */}
            <div className="relative flex-shrink-0">
              <VerificationRing status={profile.verification_status}>
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 border-4 border-background shadow-xl">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                  <AvatarFallback className="text-xl sm:text-2xl md:text-3xl font-bold bg-primary text-primary-foreground">
                    {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                  </AvatarFallback>
                </Avatar>
              </VerificationRing>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-2 pb-2">
              {permissions.is_owner ? (
                <>
                  {onEdit && (
                    <Button onClick={onEdit} size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                  <ProfileShareDropdown
                    username={profile.username || ''}
                    fullName={profile.full_name}
                    profile={profile}
                    showDownload={true}
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-10"
                  />
                </>
              ) : (
                <>
                  {/* Connection Button - shows different states based on connectionStatus */}
                  {connectionStatus === 'none' && onConnect && (
                    <Button onClick={onConnect} size="sm" className="bg-primary hover:bg-primary/90">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                  {connectionStatus === 'pending_sent' && (
                    <Button variant="outline" size="sm" disabled className="text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      Request Sent
                    </Button>
                  )}
                  {connectionStatus === 'pending_received' && onAcceptConnection && (
                    <Button onClick={onAcceptConnection} size="sm" className="bg-primary hover:bg-primary/90">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Accept Request
                    </Button>
                  )}
                  {connectionStatus === 'accepted' && (
                    <Button variant="outline" size="sm" disabled className="text-primary border-primary/50">
                      <Check className="w-4 h-4 mr-2" />
                      Connected
                    </Button>
                  )}
                  {/* Sprint 12D.2: Follow button */}
                  <FollowButton targetUserId={profile.id} />
                  {onMessage && (
                    <Button onClick={onMessage} variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Info Section */}
        <div className="pt-3 sm:pt-4 pb-4 sm:pb-6">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Name & Username */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {profile.full_name}
                </h1>
                <ProfilePresenceDot lastSeenAt={(profile as unknown as { last_seen_at?: string }).last_seen_at} size="md" />
              </div>
              <p className="text-muted-foreground text-sm">@{profile.username}</p>
            </div>

            {/* Headline */}
            {profile.headline && (
              <p className="text-sm sm:text-base md:text-lg text-foreground leading-snug">
                {profile.headline}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs sm:text-sm text-muted-foreground">
              {profile.professional_role && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-none">{profile.professional_role}</span>
                </div>
              )}
              {profile.company && (
                <span className="text-muted-foreground/70">at {profile.company}</span>
              )}
              {(profile.location || profile.current_country) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-none">
                    <span className="text-muted-foreground/70">Based in </span>
                    {profile.location || profile.current_country}
                  </span>
                  {/* Large country flag next to location */}
                  {profile.current_country && (
                    <span className="text-2xl leading-none" aria-label={profile.current_country}>
                      {getFlag(profile.current_country)}
                    </span>
                  )}
                </div>
              )}
              {profile.primary_origin_country && (() => {
                const originName = originCodeToName(profile.primary_origin_country) || profile.primary_origin_country;
                if (originName === profile.current_country) return null;
                return (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-none">
                      <span className="text-muted-foreground/70">From </span>
                      {originName}
                    </span>
                    <span className="text-2xl leading-none" aria-label={originName}>
                      {getFlag(originName)}
                    </span>
                  </div>
                );
              })()}
              {/* Connection & follower counts */}
              {(connectionsCount > 0 || followerCount > 0 || followingCount > 0) && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>
                    {connectionsCount > 0 && (
                      <>
                        <strong>{connectionsCount}</strong> connections
                        {(followerCount > 0 || followingCount > 0) && <span className="mx-1">·</span>}
                      </>
                    )}
                    {(followerCount > 0 || followingCount > 0) && (
                      <>
                        <strong>{followerCount}</strong> followers
                        <span className="mx-1">·</span>
                        <strong>{followingCount}</strong> following
                      </>
                    )}
                  </span>
                </div>
              )}
              {/* Member since */}
              {profile.created_at && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>
                    Member since{' '}
                    <strong>
                      {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Diaspora Region Tag */}
            {(() => {
              const tag = getDiasporaRegionTag(originCodeToName(profile.primary_origin_country) || null, profile.current_country);
              return tag ? (
                <p className="text-xs text-muted-foreground">{tag}</p>
              ) : null;
            })()}

            {/* Mobile Action Buttons - Preserved original simple UI */}
            <div className="flex gap-2 md:hidden pt-2">
              {permissions.is_owner ? (
                <>
                  {onEdit && (
                    <Button onClick={onEdit} className="flex-1" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                  <ProfileShareDropdown
                    username={profile.username || ''}
                    fullName={profile.full_name}
                    profile={profile}
                    showDownload={true}
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-10"
                  />
                </>
              ) : (
                <>
                  {/* Connection button (mobile) */}
                  {connectionStatus === 'none' && onConnect && (
                    <Button onClick={onConnect} size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                  {connectionStatus === 'pending_sent' && (
                    <Button variant="outline" size="sm" disabled className="flex-1 text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      Requested
                    </Button>
                  )}
                  {connectionStatus === 'pending_received' && onAcceptConnection && (
                    <Button onClick={onAcceptConnection} size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                  )}
                  {connectionStatus === 'accepted' && (
                    <Button variant="outline" size="sm" disabled className="flex-1 text-primary border-primary/50">
                      <Check className="w-4 h-4 mr-2" />
                      Connected
                    </Button>
                  )}
                  {/* Follow button (mobile) */}
                  <FollowButton targetUserId={profile.id} />
                  {onMessage && (
                    <Button onClick={onMessage} variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <ProfileShareDropdown
                    username={profile.username || ''}
                    fullName={profile.full_name}
                    profile={profile}
                    showDownload={true}
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-9"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileV2Hero;
