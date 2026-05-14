
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Globe, Building, HandHeart } from 'lucide-react';

interface CulturalImpactSectionProps {
  profile: any;
}

const CulturalImpactSection: React.FC<CulturalImpactSectionProps> = ({ profile }) => {
  const hasImpactContent = profile.community_involvement || 
    profile.giving_back_initiatives || 
    profile.home_country_projects || 
    profile.volunteer_experience ||
    (profile.diaspora_networks && profile.diaspora_networks.length > 0);

  if (!hasImpactContent) {
    return null;
  }

  const diasporaNetworks = Array.isArray(profile.diaspora_networks) ? profile.diaspora_networks : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-dna-forest">
            <Heart className="w-5 h-5 text-dna-crimson" />
            Community Impact & Cultural Engagement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Diaspora Networks */}
          {diasporaNetworks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-dna-emerald" />
                Diaspora Networks & Organizations
              </h4>
              <div className="flex flex-wrap gap-2">
                {diasporaNetworks.map((network: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-dna-gold border-dna-gold">
                    {network}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Community Involvement */}
          {profile.community_involvement && (
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-dna-copper" />
                Community Involvement
              </h4>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {profile.community_involvement}
              </p>
            </div>
          )}

          {/* Giving Back Initiatives */}
          {profile.giving_back_initiatives && (
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <HandHeart className="w-4 h-4 text-dna-crimson" />
                Giving Back Initiatives
              </h4>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {profile.giving_back_initiatives}
              </p>
            </div>
          )}

          {/* Home Country Projects */}
          {profile.home_country_projects && (
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-dna-emerald" />
                Home Country Projects
              </h4>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {profile.home_country_projects}
              </p>
            </div>
          )}

          {/* Volunteer Experience */}
          {profile.volunteer_experience && (
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">
                Volunteer Experience
              </h4>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {profile.volunteer_experience}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CulturalImpactSection;
