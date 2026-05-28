import { useState } from 'react';

export interface OnboardingFormData {
  // Identity
  first_name: string;
  last_name: string;
  avatar_url: string;
  current_country: string;
  headline: string;

  // Username
  username: string;

  // Retained profile fields (no longer captured as identity in the wizard)
  country_of_origin: string;
  interests: string[];
  my_dna_statement: string;

  // Deferred fields (for later profile completion)
  profession: string;
  professional_role: string;
  professional_sectors: string[];
  skills: string[];
  years_experience: string;
  focus_areas: string[];
  regional_expertise: string[];
  industries: string[];
  engagement_intentions: string[];
}

export const useOnboardingForm = (initialData?: Partial<OnboardingFormData>) => {
  const [formData, setFormData] = useState<OnboardingFormData>({
    // Identity
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    avatar_url: initialData?.avatar_url || '',
    current_country: initialData?.current_country || '',
    headline: initialData?.headline || '',

    // Username
    username: initialData?.username || '',

    // Retained profile fields
    country_of_origin: initialData?.country_of_origin || '',
    interests: initialData?.interests || [],
    my_dna_statement: initialData?.my_dna_statement || '',

    // Deferred fields
    profession: initialData?.profession || '',
    professional_role: initialData?.professional_role || '',
    professional_sectors: initialData?.professional_sectors || [],
    skills: initialData?.skills || [],
    years_experience: initialData?.years_experience || '',
    focus_areas: initialData?.focus_areas || [],
    regional_expertise: initialData?.regional_expertise || [],
    industries: initialData?.industries || [],
    engagement_intentions: initialData?.engagement_intentions || [],
  });

  const updateField = (field: keyof OnboardingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateMultipleFields = (updates: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return {
    formData,
    updateField,
    updateMultipleFields,
  };
};
