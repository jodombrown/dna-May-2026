import React from 'react';
import { TagMultiSelect } from './TagMultiSelect';
import { FOCUS_AREAS, REGIONAL_EXPERTISE, INDUSTRIES } from '@/lib/constants/discoveryTags';

interface ProfileDiscoverySectionProps {
  focusAreas: string[];
  regionalExpertise: string[];
  industries: string[];
  onFocusAreasChange: (values: string[]) => void;
  onRegionalExpertiseChange: (values: string[]) => void;
  onIndustriesChange: (values: string[]) => void;
}

export const ProfileDiscoverySection: React.FC<ProfileDiscoverySectionProps> = ({
  focusAreas,
  regionalExpertise,
  industries,
  onFocusAreasChange,
  onRegionalExpertiseChange,
  onIndustriesChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Discovery & Matching
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Help others find you by tagging your expertise, regional focus, and industries. 
          These tags are critical for being discovered by potential collaborators.
        </p>
      </div>

      <TagMultiSelect
        label="Focus Areas"
        options={FOCUS_AREAS}
        selected={focusAreas}
        onChange={onFocusAreasChange}
        colorClass="bg-dna-emerald/10 text-dna-emerald border-dna-emerald/20"
        placeholder="Select your focus areas (minimum 2 for profile completion)"
      />

      <TagMultiSelect
        label="Regional Expertise"
        options={REGIONAL_EXPERTISE}
        selected={regionalExpertise}
        onChange={onRegionalExpertiseChange}
        colorClass="bg-dna-terra/10 text-dna-terra border-dna-terra/20"
        placeholder="Select regions where you have expertise (minimum 1)"
      />

      <TagMultiSelect
        label="Industries"
        options={INDUSTRIES}
        selected={industries}
        onChange={onIndustriesChange}
        colorClass="bg-dna-ochre/10 text-dna-ochre border-dna-ochre/20"
        placeholder="Select your industries (minimum 2)"
      />

      <div className="bg-dna-emerald/5 border border-dna-emerald/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <strong>💡 Tip:</strong> Complete these fields to increase your discoverability. 
          Adding at least 2 focus areas, 1 regional expertise, and 2 industries earns you 
          30 points toward profile completion!
        </p>
      </div>
    </div>
  );
};
