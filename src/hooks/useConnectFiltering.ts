import { useMemo } from 'react';
import { mockProfessionals } from '@/components/connect/tabs/ProfessionalsMockData';
import { demoCommunities, demoEvents } from '@/data/demoSearchData';

interface FilterState {
  location: string;
  skills: string[];
  isMentor: boolean;
  isInvestor: boolean;
  lookingForOpportunities: boolean;
}

export const useConnectFiltering = (searchTerm: string, filters: FilterState) => {
  return useMemo(() => {
    const filterText = searchTerm.toLowerCase();
    
    // Convert mockProfessionals to the expected format for filtering
    const convertedProfessionals = mockProfessionals.map(prof => ({
      id: prof.id,
      full_name: prof.name,
      profession: prof.title,
      company: prof.company,
      location: prof.location,
      primary_origin_country: prof.origin,
      bio: prof.bio,
      skills: prof.skills,
      avatar_url: prof.avatar,
      is_mentor: false, // Can be extended later
      is_investor: false, // Can be extended later
      looking_for_opportunities: false, // Can be extended later
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }));
    
    const textMatch = (value?: string) => !searchTerm || value?.toLowerCase().includes(filterText);
    const locationMatch = (value?: string) => !filters.location || filters.location === 'all' || value?.toLowerCase().includes(filters.location.toLowerCase());
    const skillsMatch = (skills?: string[]) => filters.skills.length === 0 || filters.skills.some(skill => skills?.some(s => s.toLowerCase().includes(skill.toLowerCase())));

    // Professionals
    let filteredProfessionals = convertedProfessionals.filter(prof => (
      // AND of individual matches
      textMatch(prof.full_name) || textMatch(prof.profession) || textMatch(prof.company) || textMatch(prof.location) || textMatch(prof.primary_origin_country) || textMatch(prof.bio)
    ) && locationMatch(prof.location) && skillsMatch(prof.skills));

    // Graceful fallback: if none, relax progressively
    if (filteredProfessionals.length === 0) {
      // Try location + skills only
      filteredProfessionals = convertedProfessionals.filter(prof => locationMatch(prof.location) && skillsMatch(prof.skills));
    }
    if (filteredProfessionals.length === 0) {
      // Try text only
      filteredProfessionals = convertedProfessionals.filter(prof => (
        textMatch(prof.full_name) || textMatch(prof.profession) || textMatch(prof.company) || textMatch(prof.location) || textMatch(prof.primary_origin_country) || textMatch(prof.bio)
      ));
    }
    if (filteredProfessionals.length === 0) {
      // Top picks default
      filteredProfessionals = convertedProfessionals.slice(0, 12);
    }

    // Communities
    let filteredCommunities = demoCommunities.filter(comm => {
      const matchesText = !searchTerm || 
        comm.name.toLowerCase().includes(filterText) ||
        comm.description.toLowerCase().includes(filterText) ||
        comm.category.toLowerCase().includes(filterText);
      const matchesCategory = filters.skills.length === 0 ||
        filters.skills.some(skill => 
          comm.category.toLowerCase().includes(skill.toLowerCase()) ||
          comm.name.toLowerCase().includes(skill.toLowerCase()) ||
          comm.description.toLowerCase().includes(skill.toLowerCase())
        );
      return matchesText && matchesCategory;
    });
    if (filteredCommunities.length === 0) {
      filteredCommunities = demoCommunities.slice(0, 9);
    }

    // Events
    let filteredEvents = demoEvents.filter(event => {
      const matchesText = !searchTerm || 
        event.title.toLowerCase().includes(filterText) ||
        event.description?.toLowerCase().includes(filterText) ||
        event.location?.toLowerCase().includes(filterText) ||
        event.type?.toLowerCase().includes(filterText);
      const matchesLocation = !filters.location || filters.location === 'all' || 
        event.location?.toLowerCase().includes(filters.location.toLowerCase());
      const matchesType = filters.skills.length === 0 ||
        filters.skills.some(skill => 
          event.type?.toLowerCase().includes(skill.toLowerCase()) ||
          event.title.toLowerCase().includes(skill.toLowerCase()) ||
          event.description?.toLowerCase().includes(skill.toLowerCase())
        );
      return matchesText && matchesLocation && matchesType;
    });
    if (filteredEvents.length === 0) {
      filteredEvents = demoEvents.slice(0, 6);
    }

    return {
      professionals: filteredProfessionals,
      communities: filteredCommunities,
      events: filteredEvents
    };
  }, [searchTerm, filters]);
};