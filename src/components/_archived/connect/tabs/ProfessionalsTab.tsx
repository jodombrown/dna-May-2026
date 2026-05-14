
import React from 'react';
import ProfessionalsFilters from './ProfessionalsFilters';
import ProfessionalListItem from './ProfessionalListItem';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { MockProfessional, mockProfessionals } from '@/components/connect/tabs/ProfessionalsMockData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProfessionalsTabProps {
  searchTerm: string;
}

const ProfessionalsTab: React.FC<ProfessionalsTabProps> = ({ searchTerm }) => {
  const { user } = useAuth();
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, profession, company, location, avatar_url, skills, bio, headline').limit(50);
      return data || [];
    }
  });

  // Use mock data if no profiles exist, otherwise transform real profiles
  const realProfiles = profiles
    ?.filter(profile => profile.id !== user?.id)
    ?.map(profile => ({
      id: profile.id,
      name: profile.full_name || 'Unknown',
      title: profile.profession || 'Professional',
      company: profile.company || 'Independent',
      location: profile.location || 'Unknown',
      origin: 'Unknown',
      avatar: profile.avatar_url || '',
      followers: 0,
      connections: 0,
      skills: profile.skills || [],
      bio: profile.bio || profile.headline || '',
      connectionStatus: null,
      recentActivity: 'Active on DNA',
      isOnline: false,
      mutualConnections: 0,
    } as MockProfessional));

  // Use mock data as fallback if no real profiles
  const allProfiles = (realProfiles && realProfiles.length > 0) ? realProfiles : mockProfessionals;

  // Filter by search term
  const transformedProfiles = allProfiles?.filter(profile => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      profile.name?.toLowerCase().includes(search) ||
      profile.title?.toLowerCase().includes(search) ||
      profile.bio?.toLowerCase().includes(search) ||
      profile.location?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-dna-copper" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfessionalsFilters 
        searchTerm={searchTerm}
        professionalsCount={transformedProfiles?.length || 0}
      />

      <div className="grid gap-6">
        {transformedProfiles?.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No professionals found. Try adjusting your search.
          </div>
        ) : (
          transformedProfiles?.map((professional) => (
            <ProfessionalListItem 
              key={professional.id} 
              professional={professional} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ProfessionalsTab;
