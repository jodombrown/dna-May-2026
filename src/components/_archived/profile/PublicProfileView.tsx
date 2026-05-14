import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RequireProfileScore } from '@/components/profile/RequireProfileScore';
import { MapPin, Briefcase, Hash, MessageCircle, UserPlus, Phone } from 'lucide-react';

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  profession: string | null;
  current_country: string | null;
  interests: string[] | null;
  bio: string | null;
  is_public: boolean;
  // Contact visibility fields
  contact_number_visibility?: string | null;
  phone_number?: string | null;
  whatsapp_number?: string | null;
}

interface PublicProfileViewProps {
  profile: ProfileData;
  isOwner?: boolean; // Whether the viewer is the profile owner
  onMessage?: () => void;
  onConnect?: () => void;
}

// Helper to get the displayable contact number based on visibility setting
// Owners can always see their own info, others respect is_public and visibility
const getDisplayContactNumber = (
  profile: ProfileData, 
  isOwner: boolean
): { number: string | null; type: 'phone' | 'whatsapp' | null } => {
  // Non-public profiles: only owner can see contact info
  if (!profile.is_public && !isOwner) return { number: null, type: null };
  
  if (profile.contact_number_visibility === 'phone' && profile.phone_number) {
    return { number: profile.phone_number, type: 'phone' };
  }
  if (profile.contact_number_visibility === 'whatsapp' && profile.whatsapp_number) {
    return { number: profile.whatsapp_number, type: 'whatsapp' };
  }
  return { number: null, type: null };
};

const PublicProfileView: React.FC<PublicProfileViewProps> = ({ 
  profile, 
  isOwner = false,
  onMessage, 
  onConnect 
}) => {
  // Don't show private profiles to non-owners
  if (!profile.is_public && !isOwner) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-neutral-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Profile Private</h2>
              <p className="text-neutral-600">This user has chosen to keep their profile private.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'User'} />
              <AvatarFallback className="bg-dna-mint text-dna-forest text-2xl">
                {profile.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {profile.full_name || 'DNA Member'}
              </h1>
              {profile.profession && (
                <div className="flex items-center text-muted-foreground mt-1">
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span>{profile.profession}</span>
                </div>
              )}
              {profile.current_country && (
                <div className="flex items-center text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{profile.current_country}</span>
                </div>
              )}
              {/* Contact number visibility enforcement */}
              {(() => {
                const contactInfo = getDisplayContactNumber(profile, isOwner);
                if (!contactInfo.number) return null;
                return (
                  <div className="flex items-center text-muted-foreground mt-1">
                    {contactInfo.type === 'whatsapp' ? (
                      <MessageCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Phone className="w-4 h-4 mr-2" />
                    )}
                    <span>{contactInfo.number}</span>
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="flex space-x-3">
            {onConnect && (
              <RequireProfileScore min={50} featureName="sending connection requests">
                <Button 
                  onClick={onConnect}
                  className="bg-dna-copper hover:bg-dna-gold text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </RequireProfileScore>
            )}
            {onMessage && (
              <RequireProfileScore min={80} featureName="messaging other members">
                <Button 
                  onClick={onMessage}
                  variant="outline"
                  className="border-dna-copper text-dna-copper hover:bg-dna-copper hover:text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </RequireProfileScore>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {profile.bio && (
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">About</h3>
            <p className="text-neutral-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Hash className="w-5 h-5 text-dna-copper" />
              Diaspora Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-dna-mint text-dna-forest hover:bg-dna-emerald hover:text-white"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!profile.bio && (!profile.interests || profile.interests.length === 0) && (
          <div className="text-center py-8">
            <p className="text-neutral-500">This member hasn't shared much about themselves yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PublicProfileView;
