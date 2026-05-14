import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Building, ExternalLink, Users, Calendar, Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '@/contexts/MessageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

interface ProfileCardProps {
  profile: {
    id: string;
    full_name?: string;
    profession?: string;
    company?: string;
    location?: string;
    bio?: string;
    linkedin_url?: string;
    website_url?: string;
    avatar_url?: string;
    years_experience?: string;
    country_of_origin?: string;
    skills?: string;
    interests?: string;
    availability_for_mentoring?: boolean;
    looking_for_opportunities?: boolean;
    username?: string;
  };
  onClick?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onClick }) => {
  const navigate = useNavigate();
  const { openMessageOverlay } = useMessage();
  const { user } = useAuth();
  const { data: connectionStatus } = useConnectionStatus(profile.id);
  
  const isConnected = connectionStatus === 'accepted';

  const handleConnectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/connect/${profile.id}`);
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openMessageOverlay(profile.id);
  };

  // SAFELY HANDLE ARRAY OR STRING
  const getStringArray = (value: any): string[] => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string')
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  const skillsList = getStringArray(profile.skills).slice(0, 3);
  const allSkillsCount =
    Array.isArray(profile.skills)
      ? profile.skills.length
      : typeof profile.skills === 'string'
        ? profile.skills.split(',').filter(Boolean).length
        : 0;

  const interestsList = getStringArray(profile.interests).slice(0, 2);

  const profileUrl = profile.username ? `/dna/${profile.username}` : undefined;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full" onClick={onClick}>
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-start space-x-4 mb-4">
          {profileUrl ? (
            <a href={profileUrl} onClick={(e) => e.stopPropagation()} aria-label={`View ${profile.full_name || 'profile'}`} className="inline-block">
              <Avatar className="w-16 h-16 flex-shrink-0">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="bg-dna-copper text-white">
                  {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
            </a>
          ) : (
            <Avatar className="w-16 h-16 flex-shrink-0">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="bg-dna-copper text-white">
                {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-dna-forest truncate">
              {profileUrl ? (
                <a href={profileUrl} onClick={(e) => e.stopPropagation()} className="hover:underline">
                  {profile.full_name || 'Anonymous User'}
                </a>
              ) : (
                profile.full_name || 'Anonymous User'
              )}
            </h3>
            
            {profile.profession && (
              <p className="text-dna-copper font-medium text-sm">{profile.profession}</p>
            )}
            
            <div className="space-y-1 mt-2">
              {profile.company && (
                <div className="flex items-center text-neutral-600 text-xs">
                  <Building className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{profile.company}</span>
                </div>
              )}
              
              {profile.location && (
                <div className="flex items-center text-neutral-600 text-xs">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{profile.location}</span>
                </div>
              )}

              {profile.country_of_origin && (
                <div className="flex items-center text-neutral-600 text-xs">
                  <Heart className="w-3 h-3 mr-1 flex-shrink-0 text-dna-crimson" />
                  <span className="truncate">From {profile.country_of_origin}</span>
                </div>
              )}

              {profile.years_experience && (
                <div className="flex items-center text-neutral-600 text-xs">
                  <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{profile.years_experience} experience</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {profile.bio && (
          <p className="text-neutral-700 text-sm mb-3 line-clamp-2 flex-grow">
            {profile.bio}
          </p>
        )}

        {/* Skills */}
        {skillsList.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {skillsList.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs text-dna-forest border-dna-forest">
                  {skill}
                </Badge>
              ))}
              {allSkillsCount > 3 && (
                <Badge variant="outline" className="text-xs text-neutral-500">
                  +{allSkillsCount - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Interests */}
        {interestsList.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {interestsList.map((interest) => (
                <Badge key={interest} variant="outline" className="text-xs text-dna-copper border-dna-copper">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Status Badges */}
        <div className="flex flex-wrap gap-1 mb-4">
          {profile.availability_for_mentoring && (
            <Badge className="text-xs bg-dna-mint text-dna-forest">
              Mentor
            </Badge>
          )}
          {profile.looking_for_opportunities && (
            <Badge className="text-xs bg-dna-gold text-white">
              Open to Opportunities
            </Badge>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          {/* Only show Connect button if not viewing own profile */}
          {user?.id !== profile.id && (
            <Button 
              size="sm" 
              className="bg-dna-emerald hover:bg-dna-forest text-white flex-1"
              onClick={handleConnectClick}
            >
              <Users className="w-4 h-4 mr-1" />
              Connect
            </Button>
          )}
          
          {/* Only show Message button if connected */}
          {user?.id !== profile.id && isConnected && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={handleMessageClick}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Message
            </Button>
          )}
          
          <div className="flex gap-1">
            {profile.linkedin_url && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(profile.linkedin_url, '_blank');
                }}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
            
            {profile.website_url && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(profile.website_url, '_blank');
                }}
              >
                <Building className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
