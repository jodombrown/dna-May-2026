import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Briefcase, Eye, Edit } from 'lucide-react';

interface MyProfilePreviewProps {
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    professional_role: string | null;
    current_country: string | null;
    primary_origin_country: string | null;
  };
}

export const MyProfilePreview: React.FC<MyProfilePreviewProps> = ({ profile }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-dna-copper" />
          My Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-xl bg-dna-mint text-dna-forest">
              {profile.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{profile.full_name || 'Complete your profile'}</h3>
            
            {profile.headline && (
              <p className="text-sm text-muted-foreground mt-1">{profile.headline}</p>
            )}
            
            {profile.professional_role && (
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <Briefcase className="w-3 h-3 mr-1" />
                <span>{profile.professional_role}</span>
              </div>
            )}
            
            {profile.current_country && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{profile.current_country}</span>
                {profile.primary_origin_country && profile.primary_origin_country !== profile.current_country && (
                  <span className="ml-2 text-xs">• From {profile.primary_origin_country}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/dna/${profile.username}`)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Public Profile
          </Button>
          <Button
            className="flex-1 bg-dna-copper hover:bg-dna-gold"
            onClick={() => navigate('/dna/profile/edit')}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};