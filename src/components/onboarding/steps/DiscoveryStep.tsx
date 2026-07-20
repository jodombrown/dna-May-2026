import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TagMultiSelect } from '@/components/profile/TagMultiSelect';
import { InfoIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ENGAGEMENT_INTENTION_OPTIONS } from '@/data/profileOptions';

// Use same options across onboarding and profile edit
const FOCUS_AREAS = [
  'Agricultural Innovation',
  'Clean Energy & Climate',
  'Digital Infrastructure',
  'Education Technology',
  'Financial Inclusion',
  'Healthcare Access',
  'Manufacturing & Industry',
  'Trade & Investment',
  'Urban Development',
  'Youth & Employment'
];

const REGIONAL_EXPERTISE = [
  'East Africa',
  'West Africa',
  'Southern Africa',
  'North Africa',
  'Central Africa',
  'Pan-African',
  'Diaspora Communities'
];

const INDUSTRIES = [
  'Fintech & Banking',
  'Healthtech & Life Sciences',
  'Agritech & Food Systems',
  'Edtech & Learning',
  'Cleantech & Energy',
  'E-Commerce & Retail',
  'Media & Entertainment',
  'Infrastructure & Construction',
  'Logistics & Supply Chain',
  'Professional Services'
];

// Use canonical engagement options from profileOptions.ts
const ENGAGEMENT_OPTIONS = ENGAGEMENT_INTENTION_OPTIONS.map(o => o.label);

interface DiscoveryStepProps {
  data: {
    focus_areas: string[];
    regional_expertise: string[];
    industries: string[];
    engagement_intentions: string[];
  };
  onUpdate: (field: string, value: any) => void;
}

const DiscoveryStep: React.FC<DiscoveryStepProps> = ({ data, onUpdate }) => {
  // Map stored values to labels for display, handle both old and new formats
  const getDisplayValues = (values: string[]) => {
    return values.map(val => {
      // If it's already a label (old format), keep it
      const optionByLabel = ENGAGEMENT_INTENTION_OPTIONS.find(o => o.label === val);
      if (optionByLabel) return val;
      // If it's a value, convert to label
      const optionByValue = ENGAGEMENT_INTENTION_OPTIONS.find(o => o.value === val);
      return optionByValue ? optionByValue.label : val;
    });
  };

  // Convert labels back to values for storage
  const handleIntentionsChange = (labels: string[]) => {
    const values = labels.map(label => {
      const option = ENGAGEMENT_INTENTION_OPTIONS.find(o => o.label === label);
      return option ? option.value : label;
    });
    onUpdate('engagement_intentions', values);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-dna-forest">Connect & Discover</h2>
        <p className="text-muted-foreground">
          Help us match you with the right people, opportunities, and collaborations.
        </p>
      </div>

      <Alert className="border-dna-mint/30 bg-dna-mint/5">
        <InfoIcon className="h-4 w-4 text-dna-mint" />
        <AlertDescription className="text-sm">
          <strong>Optional but recommended:</strong> Completing this section helps us surface better connections and opportunities for you. You can always update these later in your profile settings.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Focus Areas */}
          <TagMultiSelect
            label="Focus Areas"
            options={FOCUS_AREAS}
            selected={data.focus_areas}
            onChange={(value) => onUpdate('focus_areas', value)}
            placeholder="Select areas (recommended: 2+)"
            colorClass="bg-dna-emerald/10 text-dna-emerald border-dna-emerald/20"
          />

          {/* Regional Expertise */}
          <TagMultiSelect
            label="Regional Expertise"
            options={REGIONAL_EXPERTISE}
            selected={data.regional_expertise}
            onChange={(value) => onUpdate('regional_expertise', value)}
            placeholder="Select regions (recommended: 1+)"
            colorClass="bg-dna-terra/10 text-dna-terra border-dna-terra/20"
          />

          {/* Industries */}
          <TagMultiSelect
            label="Industry Focus"
            options={INDUSTRIES}
            selected={data.industries}
            onChange={(value) => onUpdate('industries', value)}
            placeholder="Select industries (recommended: 1+)"
            colorClass="bg-dna-copper/10 text-dna-copper border-dna-copper/20"
          />

          {/* Engagement Intentions - now uses same options as profile edit */}
          <TagMultiSelect
            label="What Brings You to DNA?"
            options={ENGAGEMENT_OPTIONS}
            selected={getDisplayValues(data.engagement_intentions)}
            onChange={handleIntentionsChange}
            placeholder="Select how you want to engage"
            colorClass="bg-dna-gold/10 text-dna-gold border-dna-gold/20"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscoveryStep;
