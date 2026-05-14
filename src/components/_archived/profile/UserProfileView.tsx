
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit2, MapPin, Briefcase, Hash } from 'lucide-react';

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  professional_role: string | null;
  current_country: string | null;
  interests: string[] | null;
  bio: string | null;
}

interface UserProfileViewProps {
  profile: ProfileData;
  onEdit: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ profile, onEdit }) => {
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
                {profile.full_name || 'Your Name'}
              </h1>
              {profile.professional_role && (
                <div className="flex items-center text-neutral-600 mt-1">
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span>{profile.professional_role}</span>
                </div>
              )}
              {profile.current_country && (
                <div className="flex items-center text-neutral-600 mt-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{profile.current_country}</span>
                </div>
              )}
            </div>
          </div>
          <Button 
            onClick={onEdit}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
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
            <p className="text-neutral-500 mb-4">Your profile is looking a bit empty!</p>
            <Button variant="default" onClick={onEdit}>
              Complete Your Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProfileView;
