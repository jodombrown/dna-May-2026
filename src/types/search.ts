
export interface Professional {
  id: string;
  username?: string;
  full_name: string;
  headline?: string;
  profession?: string;
  company?: string;
  location?: string;
  /** Primary origin country, ISO code, sourced from member_heritage (BD038). */
  primary_origin_country?: string;
  expertise?: string[];
  bio?: string;
  years_experience?: number;
  education?: string;
  languages?: string[];
  availability_for?: string[];
  linkedin_url?: string;
  website_url?: string;
  avatar_url?: string;
  skills?: string[];
  impact_areas?: string[];
  is_mentor: boolean;
  is_investor: boolean;
  looking_for_opportunities: boolean;
  created_at: string;
  updated_at: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  category?: string;
  member_count: number;
  is_featured: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export type { Event } from './eventTypes';
