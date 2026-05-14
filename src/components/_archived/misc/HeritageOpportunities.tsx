import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Globe, MapPin, Flag, ArrowRight, Users, Briefcase, Building2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useNavigate } from 'react-router-dom';
import { Adinkrahene } from '@/components/icons/adinkra';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeritageOpportunity {
  id: string;
  title: string;
  description: string;
  type: string;
  location: string;
  impact_area: string;
  creator_id: string;
  creator_name: string;
  creator_avatar?: string;
  created_at: string;
  heritage_match: boolean;
  region_match: boolean;
  match_reason: string;
}

// Map countries to African regions for matching
const getAfricanRegion = (country: string): string => {
  const countryLower = country?.toLowerCase() || '';

  const westAfrica = ['nigeria', 'ghana', 'senegal', 'mali', 'burkina faso', 'niger', 'benin', 'togo', 'guinea', 'sierra leone', 'liberia', 'gambia', 'guinea-bissau', 'cape verde', 'mauritania', 'ivory coast', "cote d'ivoire"];
  const eastAfrica = ['kenya', 'tanzania', 'uganda', 'rwanda', 'burundi', 'ethiopia', 'eritrea', 'djibouti', 'somalia', 'south sudan', 'sudan'];
  const southernAfrica = ['south africa', 'botswana', 'namibia', 'zimbabwe', 'zambia', 'mozambique', 'malawi', 'angola', 'lesotho', 'eswatini', 'swaziland', 'madagascar', 'mauritius', 'comoros', 'seychelles'];
  const northAfrica = ['egypt', 'morocco', 'algeria', 'tunisia', 'libya'];
  const centralAfrica = ['cameroon', 'central african republic', 'chad', 'congo', 'democratic republic of congo', 'drc', 'gabon', 'equatorial guinea', 'sao tome and principe'];

  if (westAfrica.some(c => countryLower.includes(c))) return 'West Africa';
  if (eastAfrica.some(c => countryLower.includes(c))) return 'East Africa';
  if (southernAfrica.some(c => countryLower.includes(c))) return 'Southern Africa';
  if (northAfrica.some(c => countryLower.includes(c))) return 'North Africa';
  if (centralAfrica.some(c => countryLower.includes(c))) return 'Central Africa';
  return 'Global';
};

export const HeritageOpportunities: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch current user's profile for heritage info
  const { data: userProfile } = useQuery({
    queryKey: ['user-heritage-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('country_of_origin, diaspora_origin, current_country, interests, skills')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch heritage-matched opportunities
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['heritage-opportunities', user?.id, userProfile?.country_of_origin],
    queryFn: async () => {
      if (!userProfile) return [];

      const userHeritage = userProfile.country_of_origin || userProfile.diaspora_origin;
      const userRegion = getAfricanRegion(userHeritage || '');

      // Fetch contribution cards (opportunities) that match heritage or region
      const { data: cards } = await supabase
        .from('contribution_cards')
        .select(`
          id,
          title,
          description,
          contribution_type,
          location,
          impact_area,
          created_by,
          created_at,
          profiles!contribution_cards_created_by_fkey (
            id,
            full_name,
            avatar_url,
            country_of_origin,
            current_country
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!cards) return [];

      // Filter and score opportunities based on heritage/region match
      const scored: HeritageOpportunity[] = cards
        .map((card: any) => {
          const creatorHeritage = card.profiles?.country_of_origin || '';
          const creatorCountry = card.profiles?.current_country || '';
          const opportunityLocation = card.location || '';
          const creatorRegion = getAfricanRegion(creatorHeritage || creatorCountry);
          const locationRegion = getAfricanRegion(opportunityLocation);

          // Check for heritage match
          const heritageMatch = userHeritage && creatorHeritage &&
            creatorHeritage.toLowerCase() === userHeritage.toLowerCase();

          // Check for region match
          const regionMatch = userRegion !== 'Global' && (
            userRegion === creatorRegion || userRegion === locationRegion
          );

          if (!heritageMatch && !regionMatch) {
            return null;
          }

          let matchReason = '';
          if (heritageMatch) {
            matchReason = `From ${userHeritage}`;
          } else if (regionMatch) {
            matchReason = `${userRegion} opportunity`;
          }

          return {
            id: card.id,
            title: card.title,
            description: card.description,
            type: card.contribution_type,
            location: card.location,
            impact_area: card.impact_area,
            creator_id: card.created_by,
            creator_name: card.profiles?.full_name || 'DNA Member',
            creator_avatar: card.profiles?.avatar_url,
            created_at: card.created_at,
            heritage_match: !!heritageMatch,
            region_match: !!regionMatch,
            match_reason: matchReason,
          };
        })
        .filter(Boolean) as HeritageOpportunity[];

      // Sort: heritage matches first, then by date
      return scored.sort((a, b) => {
        if (a.heritage_match && !b.heritage_match) return -1;
        if (!a.heritage_match && b.heritage_match) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }).slice(0, 5);
    },
    enabled: !!userProfile,
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'funding':
      case 'investment':
        return Building2;
      case 'skills':
      case 'mentorship':
        return Briefcase;
      case 'network':
        return Users;
      default:
        return Globe;
    }
  };

  if (!userProfile?.country_of_origin && !userProfile?.diaspora_origin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-dna-copper" />
            Heritage Opportunities
          </CardTitle>
          <CardDescription>
            Complete your profile with your country of origin to see opportunities from your heritage region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/dna/profile/edit')} variant="outline">
            Complete Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-dna-copper" />
            Heritage Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" showText />
        </CardContent>
      </Card>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-dna-copper" />
            Heritage Opportunities
          </CardTitle>
          <CardDescription>
            Opportunities connected to {userProfile.country_of_origin || userProfile.diaspora_origin}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No heritage-matched opportunities available right now. Check back soon!
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/dna/contribute')}
          >
            Browse All Opportunities
          </Button>
        </CardContent>
      </Card>
    );
  }

  const userHeritage = userProfile.country_of_origin || userProfile.diaspora_origin;
  const userRegion = getAfricanRegion(userHeritage || '');

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-dna-copper" />
            Heritage Opportunities
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              {userRegion !== 'Global' ? userRegion : userHeritage}
            </Badge>
          </CardTitle>
          <CardDescription>
            Opportunities connected to your heritage and region
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {opportunities.map((opp) => {
            const TypeIcon = getTypeIcon(opp.type);

            return (
              <div
                key={opp.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/dna/contribute/${opp.id}`)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={opp.creator_avatar} alt={opp.creator_name} />
                  <AvatarFallback>
                    {opp.creator_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm truncate hover:text-dna-copper transition-colors">
                      {opp.title}
                    </h4>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={opp.heritage_match ? 'default' : 'secondary'}
                          className={`text-xs shrink-0 ${opp.heritage_match ? 'bg-dna-copper hover:bg-dna-copper/90' : ''}`}
                        >
                          {opp.heritage_match ? (
                            <><Flag className="h-3 w-3 mr-1" /> Heritage</>
                          ) : (
                            <><MapPin className="h-3 w-3 mr-1" /> Region</>
                          )}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="text-xs">{opp.match_reason}</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {opp.description}
                  </p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TypeIcon className="h-3 w-3" />
                      <span className="capitalize">{opp.type.replace('_', ' ')}</span>
                    </div>
                    {opp.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{opp.location}</span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      by {opp.creator_name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/dna/contribute')}
          >
            See All Heritage Opportunities <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default HeritageOpportunities;
