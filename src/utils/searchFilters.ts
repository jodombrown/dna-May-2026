
import { Professional, Community, Event } from '@/hooks/useSearch';
import { SearchFilters } from '@/types/advancedSearchTypes';

export const filterProfessionals = (
  professionals: Professional[],
  searchTerm: string,
  filters: SearchFilters
): Professional[] => {
  const searchLower = searchTerm.toLowerCase().trim();
  
  return professionals.filter(prof => {
    const matchesSearch = !searchTerm || 
      prof.full_name.toLowerCase().includes(searchLower) ||
      prof.profession?.toLowerCase().includes(searchLower) ||
      prof.company?.toLowerCase().includes(searchLower) ||
      prof.bio?.toLowerCase().includes(searchLower) ||
      prof.location?.toLowerCase().includes(searchLower) ||
      prof.primary_origin_country?.toLowerCase().includes(searchLower) ||
      prof.skills?.some(skill => skill.toLowerCase().includes(searchLower));

    const matchesLocation = !filters.location || 
      prof.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
      prof.primary_origin_country?.toLowerCase().includes(filters.location.toLowerCase());

    const matchesSkills = filters.skills.length === 0 ||
      filters.skills.some(skill => prof.skills?.some(profSkill => 
        profSkill.toLowerCase().includes(skill.toLowerCase())
      ));

    const matchesMentor = !filters.isMentor || prof.is_mentor;
    const matchesInvestor = !filters.isInvestor || prof.is_investor;
    const matchesOpportunities = !filters.lookingForOpportunities || prof.looking_for_opportunities;

    return matchesSearch && matchesLocation && matchesSkills && 
           matchesMentor && matchesInvestor && matchesOpportunities;
  });
};

export const filterCommunities = (
  communities: Community[],
  searchTerm: string
): Community[] => {
  const searchLower = searchTerm.toLowerCase().trim();
  
  return communities.filter(comm => {
    return !searchTerm || 
      comm.name.toLowerCase().includes(searchLower) ||
      comm.description?.toLowerCase().includes(searchLower) ||
      comm.category?.toLowerCase().includes(searchLower);
  });
};

export const filterEvents = (
  events: Event[],
  searchTerm: string,
  filters: SearchFilters
): Event[] => {
  const searchLower = searchTerm.toLowerCase().trim();
  
  return events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower) ||
      event.type?.toLowerCase().includes(searchLower) ||
      event.location?.toLowerCase().includes(searchLower);

    const matchesLocation = !filters.location || 
      event.location?.toLowerCase().includes(filters.location.toLowerCase());

    return matchesSearch && matchesLocation;
  });
};

export const hasActiveFilters = (filters: SearchFilters): boolean => {
  return Boolean(filters.location) || 
         filters.skills.length > 0 || 
         filters.isMentor || 
         filters.isInvestor || 
         filters.lookingForOpportunities;
};
