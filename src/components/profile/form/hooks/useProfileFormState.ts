
import { useState, useEffect } from 'react';
import { FormData, ArrayStates, HelperStates } from '../FormDataTypes';

interface UseProfileFormStateProps {
  profile: any;
  user: { email?: string } | null;
}

export const useProfileFormState = ({ profile, user }: UseProfileFormStateProps) => {
  // Initialize form data
  const [formData, setFormData] = useState<FormData>(() => ({
    // Basic info
    full_name: profile?.full_name || '',
    headline: profile?.headline || '',
    email: profile?.email || user?.email || '',
    bio: profile?.bio || '',
    my_dna_statement: profile?.my_dna_statement || '',
    location: profile?.location || '',
    city: profile?.city || '',
    
    // Contact & Links
    linkedin_url: profile?.linkedin_url || '',
    website_url: profile?.website_url || '',
    phone: profile?.phone || '',
    
    // Professional
    profession: profile?.profession || '',
    professional_role: profile?.professional_role || '',
    company: profile?.company || '',
    organization: profile?.organization || '',
    industry: profile?.industry || '',
    years_experience: profile?.years_experience || '',
    education: profile?.education || '',
    certifications: profile?.certifications || '',
    
    // Cultural & Diaspora
    primary_origin_country: profile?.primary_origin_country || '',
    current_country: profile?.current_country || '',
    diaspora_origin: profile?.diaspora_origin || '',
    years_in_diaspora: profile?.years_in_diaspora || '',
    languages: profile?.languages || '',
    
    // Innovation & Impact
    innovation_pathways: profile?.innovation_pathways || '',
    achievements: profile?.achievements || '',
    past_contributions: profile?.past_contributions || '',
    
    // Community & Mentorship
    community_involvement: profile?.community_involvement || '',
    giving_back_initiatives: profile?.giving_back_initiatives || '',
    home_country_projects: profile?.home_country_projects || '',
    volunteer_experience: profile?.volunteer_experience || '',
    availability_for_mentoring: profile?.availability_for_mentoring || false,
    looking_for_opportunities: profile?.looking_for_opportunities || false,
    
    // Settings
    is_public: profile?.is_public !== false,
    account_visibility: profile?.account_visibility || 'public',
    notifications_enabled: profile?.notifications_enabled !== false,
  }));

  // Initialize array data
  const [arrayStates, setArrayStates] = useState<ArrayStates>(() => ({
    skills: profile?.skills ? (Array.isArray(profile.skills) ? profile.skills : profile.skills.split(',').map((s: string) => s.trim())) : [],
    interests: profile?.interests ? (Array.isArray(profile.interests) ? profile.interests : profile.interests.split(',').map((s: string) => s.trim())) : [],
    impactAreas: profile?.impact_areas ? (Array.isArray(profile.impact_areas) ? profile.impact_areas : []) : [],
    engagementIntentions: profile?.engagement_intentions ? (Array.isArray(profile.engagement_intentions) ? profile.engagement_intentions : []) : [],
    skillsOffered: profile?.skills_offered ? (Array.isArray(profile.skills_offered) ? profile.skills_offered : []) : [],
    skillsNeeded: profile?.skills_needed ? (Array.isArray(profile.skills_needed) ? profile.skills_needed : []) : [],
    availableFor: profile?.available_for ? (Array.isArray(profile.available_for) ? profile.available_for : []) : [],
    professionalSectors: profile?.professional_sectors ? (Array.isArray(profile.professional_sectors) ? profile.professional_sectors : []) : [],
    diasporaNetworks: profile?.diaspora_networks ? (Array.isArray(profile.diaspora_networks) ? profile.diaspora_networks : []) : [],
    mentorshipAreas: profile?.mentorship_areas ? (Array.isArray(profile.mentorship_areas) ? profile.mentorship_areas : []) : [],
    // NEW: Discovery tags
    focusAreas: profile?.focus_areas ? (Array.isArray(profile.focus_areas) ? profile.focus_areas : []) : [],
    regionalExpertise: profile?.regional_expertise ? (Array.isArray(profile.regional_expertise) ? profile.regional_expertise : []) : [],
    industries: profile?.industries ? (Array.isArray(profile.industries) ? profile.industries : []) : [],
  }));

  // Initialize helper states
  const [helperStates, setHelperStates] = useState<HelperStates>(() => ({
    newSkill: '',
    newInterest: '',
    newSector: '',
    newNetwork: '',
    newMentorshipArea: '',
    avatarUrl: profile?.avatar_url || '',
    bannerUrl: profile?.banner_image_url || '',
  }));

  const updateFormField = (field: keyof FormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: keyof ArrayStates, value: string[]) => {
    setArrayStates(prev => ({ ...prev, [field]: value }));
  };

  const updateHelperField = (field: keyof HelperStates, value: string) => {
    setHelperStates(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    arrayStates,
    helperStates,
    updateFormField,
    updateArrayField,
    updateHelperField,
  };
};
