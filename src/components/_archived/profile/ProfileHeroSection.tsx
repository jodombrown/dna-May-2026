import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Award, MapPin, Globe, Briefcase, Camera, MessageCircle, UserPlus } from "lucide-react";
import { BANNER_GRADIENTS, BannerGradientKey } from "@/lib/constants/bannerGradients";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProfileHeroSectionProps {
  profile: any;
  isOwnProfile: boolean;
  onEdit?: () => void;
  bannerType?: 'gradient' | 'solid' | 'image';
  bannerGradient?: string;
  bannerUrl?: string;
  bannerOverlay?: boolean;
  onEditBanner?: () => void;
  onEditAvatar?: () => void;
}

const ProfileHeroSection = ({ 
  profile, 
  isOwnProfile, 
  onEdit,
  bannerType = 'gradient',
  bannerGradient = 'dna',
  bannerUrl,
  bannerOverlay = false,
  onEditBanner,
  onEditAvatar
}: ProfileHeroSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  useEffect(() => {
    if (user && profile && user.id !== profile.id) {
      fetchConnectionStatus();
    }
  }, [user, profile]);

  const fetchConnectionStatus = async () => {
    if (!user || !profile) return;
    
    setIsLoadingStatus(true);
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('status')
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${profile.id}),and(requester_id.eq.${profile.id},recipient_id.eq.${user.id})`)
        .maybeSingle();

      if (error) throw error;
      setConnectionStatus(data?.status || null);
    } catch (error) {
      // Error fetching connection status
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleMessage = async () => {
    if (!user || !profile) return;
    
    try {
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_id: user.id,
        p_other_user_id: profile.id,
      });

      if (error) throw error;
      
      navigate(`/dna/messages/${conversationId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const handleConnect = async () => {
    if (!user || !profile) return;
    
    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          recipient_id: profile.id,
          status: 'pending'
        });

      if (error) throw error;
      
      toast({
        title: 'Connection request sent',
        description: `Your request to connect with ${profile.full_name} has been sent.`,
      });

      fetchConnectionStatus();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send connection request',
        variant: 'destructive',
      });
    }
  };

  const getBannerStyle = () => {
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
    return { background: BANNER_GRADIENTS.dna.css };
  };

  return (
    <section className="relative rounded-xl overflow-hidden mb-6">
      {/* Banner */}
      <div 
        className="w-full h-[200px] md:h-[280px] relative"
        style={getBannerStyle()}
      >
        {/* Overlay for text contrast */}
        {bannerOverlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        )}
        
        {/* Edit Banner Button (only on own profile) */}
        {isOwnProfile && onEditBanner && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 bg-white/90 hover:bg-white"
            onClick={onEditBanner}
          >
            <Camera className="h-4 w-4 mr-2" />
            Change Banner
          </Button>
        )}
      </div>

      {/* Avatar + Info Container */}
      <div className="relative px-4 md:px-8 -mt-16 md:-mt-24 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-6 border-white shadow-xl overflow-hidden">
              <Avatar className="w-full h-full">
                <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} className="object-cover" />
                <AvatarFallback className="bg-dna-emerald text-white text-3xl md:text-5xl font-bold">
                  {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Verified Badge */}
            {profile?.is_verified && (
              <div className="absolute top-0 right-0 w-8 h-8 bg-dna-gold rounded-full flex items-center justify-center shadow">
                <Award className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Edit Avatar Button */}
            {isOwnProfile && onEditAvatar && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full bg-white hover:bg-white shadow-lg"
                onClick={onEditAvatar}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Name & Info */}
          <div className="flex-1 md:mb-4">
            <h1 className="text-2xl md:text-4xl font-bold text-warm-neutral-900">{profile?.full_name}</h1>
            {profile?.profession && (
              <p className="text-base md:text-lg text-warm-neutral-600 mt-1">{profile.profession}</p>
            )}
            
            {profile?.company && (
              <div className="flex items-center gap-2 text-warm-neutral-600 mt-2">
                <Briefcase className="w-4 h-4" />
                <span>{profile.company}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-2">
              {profile?.location && (
                <div className="flex items-center gap-1 text-warm-neutral-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.location}</span>
                </div>
              )}
              {profile?.country_of_origin && (
                <div className="flex items-center gap-1 text-warm-neutral-600">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">{profile.country_of_origin}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isOwnProfile && onEdit ? (
            <Button
              onClick={onEdit}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : user && profile && user.id !== profile.id && !isLoadingStatus && (
            <div className="flex gap-2">
              {connectionStatus !== 'accepted' && (
                <Button
                  onClick={handleConnect}
                  disabled={connectionStatus === 'pending'}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {connectionStatus === 'pending' ? 'Request Pending' : 'Connect'}
                </Button>
              )}
              <Button
                onClick={handleMessage}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProfileHeroSection;
