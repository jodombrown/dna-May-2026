/**
 * Profile Edit Types
 * Shared types for all profile edit section components
 */

export interface AfricaFocusArea {
  geography: string;
  sectors: string[];
}

export interface ProfileEditFormData {
  // Basic Info
  full_name: string;
  headline: string;
  bio: string;
  current_location: string;
  current_country: string;
  primary_origin_country: string;

  // Professional Info
  profession: string;
  company: string;
  years_experience: number;
  skills: string[];
  interests: string[];

  // Diaspora Info
  languages: string[];

  // Engagement
  intentions: string[];
  engagement_intentions: string[];
  available_for: string[];
  mentorship_areas: string[];
  diaspora_networks: string[];

  // Africa Focus
  africa_focus_areas: AfricaFocusArea[];
  focus_areas: string[];
  regional_expertise: string[];
  industries: string[];

  // Social
  linkedin_url: string;
  twitter_url: string;
  website_url: string;

  // Privacy
  is_public: boolean;
}

export interface ProfileEditSectionProps {
  formData: ProfileEditFormData;
  onUpdate: (field: keyof ProfileEditFormData, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export interface ImageUploadState {
  avatarUrl: string | null;
  bannerUrl: string | null;
  uploadingAvatar: boolean;
  uploadingBanner: boolean;
}
