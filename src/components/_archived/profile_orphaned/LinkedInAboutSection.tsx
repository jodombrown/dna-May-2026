
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Target, 
  Award, 
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface AboutSectionProps {
  profile: any;
  isOwnProfile: boolean;
  onEdit?: () => void;
}

const LinkedInAboutSection: React.FC<AboutSectionProps> = ({ 
  profile, 
  isOwnProfile, 
  onEdit 
}) => {
  const [showFullBio, setShowFullBio] = useState(false);
  
  const bioPreview = profile.bio?.length > 300 ? 
    profile.bio.substring(0, 300) + '...' : 
    profile.bio;

  const shouldShowReadMore = profile.bio?.length > 300;

  const impactAreas = profile.impact_areas || [];
  const skillsOffered = profile.skills_offered || [];
  const skillsNeeded = profile.skills_needed || [];

  if (!profile.bio && !impactAreas.length && !skillsOffered.length && !skillsNeeded.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-dna-forest">About</CardTitle>
        {isOwnProfile && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bio/Description */}
        {profile.bio && (
          <div>
            <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
              {showFullBio ? profile.bio : bioPreview}
            </p>
            {shouldShowReadMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullBio(!showFullBio)}
                className="mt-2 text-dna-copper hover:text-dna-gold p-0 h-auto font-semibold"
              >
                {showFullBio ? (
                  <>
                    Show less <ChevronUp className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Impact Areas */}
        {impactAreas.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-dna-crimson" />
              Impact Areas
            </h4>
            <div className="flex flex-wrap gap-2">
              {impactAreas.map((area: string, index: number) => (
                <Badge 
                  key={index} 
                  className="bg-dna-crimson/10 text-dna-crimson border-dna-crimson/20"
                >
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Skills Offered */}
        {skillsOffered.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-dna-emerald" />
              Skills I Can Offer
            </h4>
            <div className="flex flex-wrap gap-2">
              {skillsOffered.map((skill: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-dna-emerald border-dna-emerald hover:bg-dna-emerald hover:text-white"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Skills Needed */}
        {skillsNeeded.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-dna-gold" />
              Skills I'm Looking For
            </h4>
            <div className="flex flex-wrap gap-2">
              {skillsNeeded.map((skill: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-dna-gold border-dna-gold hover:bg-dna-gold hover:text-white"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available For */}
        {profile.available_for && profile.available_for.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">Available For</h4>
            <div className="flex flex-wrap gap-2">
              {profile.available_for.map((service: string, index: number) => (
                <Badge 
                  key={index} 
                  className="bg-dna-copper/10 text-dna-copper border-dna-copper/20"
                >
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkedInAboutSection;
