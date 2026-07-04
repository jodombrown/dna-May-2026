import React, { useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagMultiSelect } from '@/components/profile/TagMultiSelect';
import {
  DIASPORA_NETWORK_OPTIONS,
  ENGAGEMENT_INTENTION_OPTIONS,
  ETHNIC_HERITAGE_OPTIONS,
  RETURN_INTENTIONS_OPTIONS,
  AFRICAN_CAUSES_OPTIONS,
  getVisitFrequencyOptionsFor,
} from '@/data/profileOptions';

const MENTORSHIP_AREA_OPTIONS = [
  'Business strategy',
  'Career guidance',
  'Entrepreneurship',
  'Fundraising',
  'Investment',
  'Leadership',
  'Legal/Compliance',
  'Marketing',
  'Operations',
  'Personal development',
  'Product development',
  'Technical skills',
] as const;

interface VisitFrequencyFieldProps {
  returnIntentions: string;
  visitFrequency: string;
  onVisitFrequencyChange: (value: string) => void;
}

const VisitFrequencyField: React.FC<VisitFrequencyFieldProps> = ({
  returnIntentions,
  visitFrequency,
  onVisitFrequencyChange,
}) => {
  const visitOptions = useMemo(
    () => getVisitFrequencyOptionsFor(returnIntentions),
    [returnIntentions]
  );
  useEffect(() => {
    if (visitFrequency && !visitOptions.some(o => o.value === visitFrequency)) {
      onVisitFrequencyChange('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnIntentions]);
  return (
    <div>
      <Label htmlFor="visit_frequency">How Often Do You Visit Africa?</Label>
      <Select value={visitFrequency} onValueChange={onVisitFrequencyChange}>
        <SelectTrigger className="bg-background">
          <SelectValue placeholder={returnIntentions ? 'Select visit frequency' : 'Choose your return plan first'} />
        </SelectTrigger>
        <SelectContent className="bg-popover border shadow-lg z-50">
          {visitOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface ProfileEditDiasporaProps {
  diasporaNetworks: string[];
  engagementIntentions: string[];
  mentorshipAreas: string[];
  ethnicHeritage: string[];
  returnIntentions: string;
  africanCauses: string[];
  visitFrequency: string;
  onNetworksChange: (networks: string[]) => void;
  onIntentionsChange: (intentions: string[]) => void;
  onMentorshipAreasChange: (areas: string[]) => void;
  onEthnicHeritageChange: (heritage: string[]) => void;
  onReturnIntentionsChange: (value: string) => void;
  onAfricanCausesChange: (causes: string[]) => void;
  onVisitFrequencyChange: (value: string) => void;
}

const ProfileEditDiaspora: React.FC<ProfileEditDiasporaProps> = ({
  diasporaNetworks,
  engagementIntentions,
  mentorshipAreas,
  ethnicHeritage,
  returnIntentions,
  africanCauses,
  visitFrequency,
  onNetworksChange,
  onIntentionsChange,
  onMentorshipAreasChange,
  onEthnicHeritageChange,
  onReturnIntentionsChange,
  onAfricanCausesChange,
  onVisitFrequencyChange,
}) => {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle>My Connection to Africa</CardTitle>
        <CardDescription>Whether diaspora, continental African, or ally, tell us how you connect</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ethnic Heritage */}
        <TagMultiSelect
          label="Ethnic/Tribal Heritage"
          options={Array.from(ETHNIC_HERITAGE_OPTIONS)}
          selected={ethnicHeritage}
          onChange={onEthnicHeritageChange}
          placeholder="Select your heritage..."
          colorClass="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
          allowCustom={true}
        />

        {/* African Causes */}
        <TagMultiSelect
          label="African Causes You Care About"
          options={Array.from(AFRICAN_CAUSES_OPTIONS.map(o => o.label))}
          selected={africanCauses.map(c => {
            const option = AFRICAN_CAUSES_OPTIONS.find(o => o.value === c);
            return option ? option.label : c;
          })}
          onChange={(labels) => {
            // Convert labels back to values for storage
            const values = labels.map(label => {
              const option = AFRICAN_CAUSES_OPTIONS.find(o => o.label === label);
              return option ? option.value : label;
            });
            onAfricanCausesChange(values);
          }}
          placeholder="Select causes..."
          colorClass="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
          allowCustom={true}
        />

        {/* Return Intentions */}
        <div>
          <Label htmlFor="return_intentions">Return Plans</Label>
          <Select value={returnIntentions} onValueChange={onReturnIntentionsChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Any plans to relocate to Africa?" />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-lg z-50">
              {RETURN_INTENTIONS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visit Frequency - filtered by Return Plans */}
        <VisitFrequencyField
          returnIntentions={returnIntentions}
          visitFrequency={visitFrequency}
          onVisitFrequencyChange={onVisitFrequencyChange}
        />

        {/* Diaspora Networks */}
        <TagMultiSelect
          label="Networks & Communities"
          options={Array.from(DIASPORA_NETWORK_OPTIONS)}
          selected={diasporaNetworks}
          onChange={onNetworksChange}
          placeholder="Select networks you belong to..."
          colorClass="bg-dna-forest/10 text-dna-forest border-dna-forest/20"
          allowCustom={true}
        />

        {/* Engagement Intentions */}
        <TagMultiSelect
          label="What Brings You to DNA?"
          options={Array.from(ENGAGEMENT_INTENTION_OPTIONS.map(o => o.label))}
          selected={engagementIntentions.map(val => {
            // Handle both value and label formats for backward compatibility
            const optionByValue = ENGAGEMENT_INTENTION_OPTIONS.find(o => o.value === val);
            if (optionByValue) return optionByValue.label;
            const optionByLabel = ENGAGEMENT_INTENTION_OPTIONS.find(o => o.label === val);
            return optionByLabel ? optionByLabel.label : val;
          })}
          onChange={(labels) => {
            // Store as values for consistency
            const values = labels.map(label => {
              const option = ENGAGEMENT_INTENTION_OPTIONS.find(o => o.label === label);
              return option ? option.value : label;
            });
            onIntentionsChange(values);
          }}
          placeholder="Select your intentions..."
          colorClass="bg-dna-emerald/10 text-dna-emerald border-dna-emerald/20"
          allowCustom={true}
        />

        {/* Mentorship Areas */}
        <TagMultiSelect
          label="Mentorship Areas"
          options={Array.from(MENTORSHIP_AREA_OPTIONS)}
          selected={mentorshipAreas}
          onChange={onMentorshipAreasChange}
          placeholder="Select mentorship areas..."
          colorClass="bg-dna-copper/10 text-dna-copper border-dna-copper/20"
          allowCustom={true}
        />
      </CardContent>
    </Card>
  );
};

export default ProfileEditDiaspora;
