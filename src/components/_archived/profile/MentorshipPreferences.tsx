
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Calendar, Star } from 'lucide-react';

interface MentorshipPreferencesProps {
  profile: any;
  isOwnProfile: boolean;
  onConnect?: () => void;
  onMessage?: () => void;
}

const MentorshipPreferences: React.FC<MentorshipPreferencesProps> = ({
  profile,
  isOwnProfile,
  onConnect,
  onMessage
}) => {
  const mentorshipAreas = Array.isArray(profile.mentorship_areas) ? profile.mentorship_areas : [];

  if (!profile.availability_for_mentoring && !profile.looking_for_opportunities && !isOwnProfile) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-dna-forest">
          <Users className="w-5 h-5 text-dna-emerald" />
          Mentorship & Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.availability_for_mentoring && (
            <Badge className="bg-dna-emerald text-white">
              <Star className="w-3 h-3 mr-1" />
              Available for Mentoring
            </Badge>
          )}
          {profile.looking_for_opportunities && (
            <Badge className="bg-dna-gold text-white">
              <Calendar className="w-3 h-3 mr-1" />
              Seeking Opportunities
            </Badge>
          )}
        </div>

        {mentorshipAreas.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-2">Mentorship Areas</h4>
            <div className="flex flex-wrap gap-2">
              {mentorshipAreas.map((area: string, index: number) => (
                <Badge key={index} variant="outline" className="text-dna-crimson border-dna-crimson">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {profile.availability_for_mentoring && !isOwnProfile && (
          <div className="pt-4 border-t">
            <p className="text-sm text-neutral-600 mb-3">
              This member is available for mentoring and knowledge sharing within the diaspora community.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={onConnect}
                size="sm"
                className="bg-dna-emerald hover:bg-dna-forest text-white"
              >
                <Users className="w-4 h-4 mr-1" />
                Connect
              </Button>
              <Button 
                onClick={onMessage}
                variant="outline"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </Button>
            </div>
          </div>
        )}

        {profile.looking_for_opportunities && !isOwnProfile && (
          <div className="pt-4 border-t">
            <p className="text-sm text-neutral-600 mb-3">
              This member is actively seeking new opportunities and collaborations.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={onConnect}
                size="sm"
                className="bg-dna-gold hover:bg-dna-copper text-white"
              >
                <Users className="w-4 h-4 mr-1" />
                Connect
              </Button>
              <Button 
                onClick={onMessage}
                variant="outline"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Reach Out
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MentorshipPreferences;
