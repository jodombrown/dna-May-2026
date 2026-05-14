
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Heart, 
  Users,
  Calendar,
  Globe2
} from 'lucide-react';

interface ProfileOverviewProps {
  profile: any;
}

const ProfileOverview: React.FC<ProfileOverviewProps> = ({ profile }) => {
  const skillsList = Array.isArray(profile.skills) ? profile.skills : 
    (profile.skills ? profile.skills.split(',').map((s: string) => s.trim()) : []);
  
  const interestsList = Array.isArray(profile.interests) ? profile.interests : 
    (profile.interests ? profile.interests.split(',').map((s: string) => s.trim()) : []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cultural Background */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-dna-forest">
            <Heart className="w-5 h-5 text-dna-crimson" />
            Cultural Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.country_of_origin && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-500" />
              <span className="text-sm">From {profile.country_of_origin}</span>
            </div>
          )}
          {profile.current_country && (
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-neutral-500" />
              <span className="text-sm">Based in {profile.current_country}</span>
            </div>
          )}
          {profile.years_in_diaspora && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span className="text-sm">{profile.years_in_diaspora} years in diaspora</span>
            </div>
          )}
          {profile.languages && (
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-1">Languages</p>
              <p className="text-sm text-neutral-600">{profile.languages}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-dna-forest">
            <Briefcase className="w-5 h-5 text-dna-copper" />
            Professional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.profession && (
            <div>
              <p className="text-sm font-medium text-dna-copper">{profile.profession}</p>
              {profile.company && (
                <p className="text-sm text-neutral-600">at {profile.company}</p>
              )}
            </div>
          )}
          {profile.years_experience && (
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-neutral-500" />
              <span className="text-sm">{profile.years_experience} years experience</span>
            </div>
          )}
          {profile.education && (
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-1">Education</p>
              <p className="text-sm text-neutral-600">{profile.education}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {profile.availability_for_mentoring && (
              <Badge className="bg-dna-mint text-dna-forest text-xs">
                Available for Mentoring
              </Badge>
            )}
            {profile.looking_for_opportunities && (
              <Badge className="bg-dna-gold text-white text-xs">
                Open to Opportunities
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills & Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-dna-forest">
            <Users className="w-5 h-5 text-dna-emerald" />
            Skills & Interests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skillsList.length > 0 && (
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1">
                {skillsList.slice(0, 5).map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs text-dna-forest border-dna-forest">
                    {skill}
                  </Badge>
                ))}
                {skillsList.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{skillsList.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          {interestsList.length > 0 && (
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Interests</p>
              <div className="flex flex-wrap gap-1">
                {interestsList.slice(0, 4).map((interest: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs text-dna-copper border-dna-copper">
                    {interest}
                  </Badge>
                ))}
                {interestsList.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{interestsList.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileOverview;
