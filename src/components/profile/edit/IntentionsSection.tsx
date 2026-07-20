import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TagMultiSelect } from '@/components/ui/TagMultiSelect';
import { ProfileEditSectionProps } from './types';
import {
  INTENTION_OPTIONS,
  ENGAGEMENT_INTENTION_OPTIONS,
  AVAILABLE_FOR_OPTIONS,
  MENTORSHIP_AREA_OPTIONS,
} from '@/data/profileOptions';

export function IntentionsSection({
  formData,
  onUpdate,
  errors = {},
  disabled = false,
}: ProfileEditSectionProps) {
  const selectedIntentions = formData.intentions || [];

  const toggleIntention = (value: string) => {
    if (selectedIntentions.includes(value)) {
      onUpdate('intentions', selectedIntentions.filter((i: string) => i !== value));
    } else {
      onUpdate('intentions', [...selectedIntentions, value]);
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle>What Brings You to DNA?</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select at least one intention (required for full access)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Intentions */}
        <div>
          <Label className="mb-3 block">Primary Intentions</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTENTION_OPTIONS.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`intention-${option.value}`}
                  checked={selectedIntentions.includes(option.value)}
                  onCheckedChange={() => toggleIntention(option.value)}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`intention-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          {errors.intentions && (
            <p className="text-sm text-destructive mt-2">{errors.intentions}</p>
          )}
        </div>

        {/* Engagement Intentions */}
        <TagMultiSelect
          label="Engagement Intentions"
          options={ENGAGEMENT_INTENTION_OPTIONS.map(o => o.label)}
          selected={formData.engagement_intentions || []}
          onChange={(values) => onUpdate('engagement_intentions', values)}
          placeholder="How do you want to engage?"
          colorClass="bg-dna-emerald/10 text-dna-emerald border-dna-emerald/20"
          disabled={disabled}
        />

        {/* Available For */}
        <TagMultiSelect
          label="Available For"
          options={AVAILABLE_FOR_OPTIONS.map(o => o.label)}
          selected={formData.available_for || []}
          onChange={(values) => onUpdate('available_for', values)}
          placeholder="What opportunities are you open to?"
          colorClass="bg-dna-terra/10 text-dna-terra border-dna-terra/20"
          disabled={disabled}
        />

        {/* Mentorship Areas */}
        <TagMultiSelect
          label="Mentorship Areas"
          options={[...MENTORSHIP_AREA_OPTIONS]}
          selected={formData.mentorship_areas || []}
          onChange={(values) => onUpdate('mentorship_areas', values)}
          placeholder="Select areas you can mentor in or want mentoring"
          colorClass="bg-dna-ochre/10 text-dna-ochre border-dna-ochre/20"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}

export default IntentionsSection;
