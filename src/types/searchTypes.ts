
export interface SearchResult {
  id: string;
  full_name: string;
  profession?: string;
  company?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  skills?: string[];
  is_mentor?: boolean;
  is_investor?: boolean;
  looking_for_opportunities?: boolean;
  years_experience?: number;
  /** Primary origin country, ISO code, sourced from member_heritage (BD038). */
  primary_origin_country?: string;
}

export interface SearchFilters {
  searchTerm: string;
  location: string;
  profession: string;
  skills: string[];
  experience: string;
  isMentor: boolean;
  isInvestor: boolean;
  lookingForOpportunities: boolean;
  countryOfOrigin: string;
}

export interface SearchState {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
}
