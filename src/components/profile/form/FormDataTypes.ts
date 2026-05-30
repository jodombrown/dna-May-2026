
export interface FormData {
  // Basic info
  full_name: string;
  headline: string;
  email: string;
  bio: string;
  my_dna_statement: string;
  location: string;
  city: string;
  
  // Contact & Links
  linkedin_url: string;
  website_url: string;
  phone: string;
  
  // Professional
  profession: string;
  professional_role: string;
  company: string;
  organization: string;
  industry: string;
  years_experience: string;
  education: string;
  certifications: string;
  
  // Cultural & Diaspora
  primary_origin_country: string;
  current_country: string;
  diaspora_origin: string;
  years_in_diaspora: string;
  languages: string;
  
  // Innovation & Impact
  innovation_pathways: string;
  achievements: string;
  past_contributions: string;
  
  // Community & Mentorship
  community_involvement: string;
  giving_back_initiatives: string;
  home_country_projects: string;
  volunteer_experience: string;
  availability_for_mentoring: boolean;
  looking_for_opportunities: boolean;
  
  // Settings
  is_public: boolean;
  account_visibility: string;
  notifications_enabled: boolean;
}

export interface ArrayStates {
  skills: string[];
  interests: string[];
  impactAreas: string[];
  engagementIntentions: string[];
  skillsOffered: string[];
  skillsNeeded: string[];
  availableFor: string[];
  professionalSectors: string[];
  diasporaNetworks: string[];
  mentorshipAreas: string[];
  // NEW: Discovery tags
  focusAreas: string[];
  regionalExpertise: string[];
  industries: string[];
}

export interface HelperStates {
  newSkill: string;
  newInterest: string;
  newSector: string;
  newNetwork: string;
  newMentorshipArea: string;
  avatarUrl: string;
  bannerUrl: string;
}
