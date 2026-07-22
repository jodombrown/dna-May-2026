import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TagMultiSelect } from '@/components/profile/TagMultiSelect';

const INTEREST_OPTIONS = [
  'Agriculture',
  'Arts & Culture',
  'Climate',
  'Education',
  'Energy',
  'Entrepreneurship',
  'Fashion',
  'Film',
  'Finance',
  'Healthcare',
  'Infrastructure',
  'Investment',
  'Literature',
  'Media',
  'Music',
  'Politics',
  'Real Estate',
  'Social Impact',
  'Sports',
  'Technology',
] as const;

const FOCUS_AREA_OPTIONS = [
  'Agriculture Modernization',
  'Climate Action',
  'Cultural Preservation',
  'Diaspora Engagement',
  'Economic Development',
  'Education Reform',
  'Financial Inclusion',
  'Governance & Policy',
  'Healthcare Access',
  'Infrastructure Development',
  'Social Enterprise',
  'Sustainable Development',
  'Tech Innovation',
  'Trade & Commerce',
  'Women in Leadership',
  'Youth Empowerment',
] as const;

const REGIONAL_EXPERTISE_OPTIONS = [
  'Central Africa',
  'East Africa',
  'North Africa',
  'Southern Africa',
  'West Africa',
  'African Diaspora',
] as const;

const INDUSTRY_OPTIONS = [
  'Agriculture',
  'Consulting',
  'Education',
  'Energy',
  'Finance',
  'Government',
  'Healthcare',
  'Legal',
  'Manufacturing',
  'Media',
  'Non-Profit',
  'Real Estate',
  'Retail',
  'Technology',
  'Transportation',
] as const;

interface ProfileEditInterestsProps {
  interests: string[];
  focusAreas: string[];
  regionalExpertise: string[];
  industries: string[];
  onInterestsChange: (interests: string[]) => void;
  onFocusAreasChange: (areas: string[]) => void;
  onRegionalExpertiseChange: (regions: string[]) => void;
  onIndustriesChange: (industries: string[]) => void;
}

const ProfileEditInterests: React.FC<ProfileEditInterestsProps> = ({
  interests,
  focusAreas,
  regionalExpertise,
  industries,
  onInterestsChange,
  onFocusAreasChange,
  onRegionalExpertiseChange,
  onIndustriesChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interests & Focus Areas</CardTitle>
        <CardDescription>What you're passionate about. This powers discovery and recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <TagMultiSelect
          label="Personal Interests"
          options={INTEREST_OPTIONS}
          selected={interests}
          onChange={onInterestsChange}
          placeholder="Select your interests..."
          colorClass="bg-dna-ocean/10 text-dna-ocean border-dna-ocean/20"
          allowCustom={true}
        />

        <TagMultiSelect
          label="Impact Focus Areas"
          options={FOCUS_AREA_OPTIONS}
          selected={focusAreas}
          onChange={onFocusAreasChange}
          placeholder="Select focus areas..."
          colorClass="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
          allowCustom={true}
        />

        <TagMultiSelect
          label="Regional Expertise"
          options={REGIONAL_EXPERTISE_OPTIONS}
          selected={regionalExpertise}
          onChange={onRegionalExpertiseChange}
          placeholder="Select regions you know well..."
          colorClass="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
          allowCustom={true}
        />

        <TagMultiSelect
          label="Industries"
          options={INDUSTRY_OPTIONS}
          selected={industries}
          onChange={onIndustriesChange}
          placeholder="Select industries..."
          colorClass="bg-dna-copper/10 text-dna-copper border-dna-copper/20"
          allowCustom={true}
        />
      </CardContent>
    </Card>
  );
};

export default ProfileEditInterests;
