import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FeedResearchFormProps {
  onSuccess: () => void;
}

const FeedResearchForm: React.FC<FeedResearchFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    valueRating: '',
    postFrequency: '',
    checkFrequency: '',
    contentToShare: [] as string[],
    contentToShareOther: '',
    contentToSee: [] as string[],
    contentToSeeOther: '',
    featureRatings: {} as Record<string, number>,
    concerns: [] as string[],
    concernsOther: '',
    differentiationIdea: '',
    dreamFeature: '',
    useCase: '',
    wantsEarlyAccess: false,
    earlyAccessEmail: ''
  });

  const contentToShareOptions = [
    'Career updates & professional milestones',
    'Business launches & venture updates',
    'Africa-focused opportunities',
    'Industry insights & market analysis',
    'Event announcements',
    'Questions seeking community input',
    'Success stories & lessons learned',
    'Resources & educational content'
  ];

  const contentToSeeOptions = [
    'Investment opportunities',
    'Job postings',
    'Business partnerships',
    'Event announcements',
    'Industry trends & analysis',
    'Success stories',
    'Africa market insights',
    'Professional advice'
  ];

  const featuresToRate = [
    'Rich media (images, videos, documents)',
    'Multiple reactions (like, celebrate, insightful)',
    'Comments & discussions',
    'Filter by topic/industry',
    'Filter by Africa region',
    '@mentions to tag connections',
    '#hashtags for topics'
  ];

  const concernOptions = [
    'Time consuming / addictive',
    'Too much noise / low quality',
    'Privacy concerns',
    'Professional vs personal boundaries',
    'Algorithmic filtering',
    'Misinformation',
    'Negative interactions',
    'No concerns'
  ];

  const handleCheckboxChange = (field: 'contentToShare' | 'contentToSee' | 'concerns', value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleFeatureRating = (feature: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      featureRatings: { ...prev.featureRatings, [feature]: rating }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to submit feedback');
      return;
    }

    // Validation
    if (!formData.valueRating || !formData.postFrequency || !formData.checkFrequency) {
      toast.error('Please answer all required questions');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine main options with "other" text
      const finalContentToShare = [...formData.contentToShare];
      if (formData.contentToShareOther) {
        finalContentToShare.push(`Other: ${formData.contentToShareOther}`);
      }

      const finalContentToSee = [...formData.contentToSee];
      if (formData.contentToSeeOther) {
        finalContentToSee.push(`Other: ${formData.contentToSeeOther}`);
      }

      const finalConcerns = [...formData.concerns];
      if (formData.concernsOther) {
        finalConcerns.push(`Other: ${formData.concernsOther}`);
      }

      const { error } = await supabase
        .from('feed_research_responses')
        .insert({
          user_id: user.id,
          value_rating: formData.valueRating,
          post_frequency: formData.postFrequency,
          check_frequency: formData.checkFrequency,
          content_to_share: finalContentToShare,
          content_to_see: finalContentToSee,
          feature_ratings: formData.featureRatings,
          concerns: finalConcerns,
          differentiation_idea: formData.differentiationIdea,
          dream_feature: formData.dreamFeature,
          use_case: formData.useCase,
          wants_early_access: formData.wantsEarlyAccess,
          early_access_email: formData.earlyAccessEmail
        });

      if (error) throw error;

      toast.success('Thank you! Your feedback helps us build DNA for the diaspora.');
      onSuccess();
    } catch (error: unknown) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card id="research-form" className="p-8 max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Value Assessment */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">
              1. How valuable would a professional feed be for your diaspora engagement? *
            </Label>
            <RadioGroup 
              value={formData.valueRating} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, valueRating: value }))}
              className="mt-3 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="essential" id="val-essential" />
                <Label htmlFor="val-essential" className="font-normal cursor-pointer">
                  Essential - I need this to engage effectively
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="very-valuable" id="val-very" />
                <Label htmlFor="val-very" className="font-normal cursor-pointer">
                  Very valuable - Would use it regularly
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="somewhat-valuable" id="val-somewhat" />
                <Label htmlFor="val-somewhat" className="font-normal cursor-pointer">
                  Somewhat valuable - Might check occasionally
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="limited-value" id="val-limited" />
                <Label htmlFor="val-limited" className="font-normal cursor-pointer">
                  Limited value - Other features more important
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not-valuable" id="val-not" />
                <Label htmlFor="val-not" className="font-normal cursor-pointer">
                  Not valuable - Don't need a feed
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold">
              2. How often would you POST to the feed? *
            </Label>
            <RadioGroup 
              value={formData.postFrequency} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, postFrequency: value }))}
              className="mt-3 space-y-2"
            >
              {['Daily', 'Few times per week', 'Weekly', 'Monthly', 'Rarely - I\'m more of a reader'].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`post-${option}`} />
                  <Label htmlFor={`post-${option}`} className="font-normal cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold">
              3. How often would you CHECK the feed? *
            </Label>
            <RadioGroup 
              value={formData.checkFrequency} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, checkFrequency: value }))}
              className="mt-3 space-y-2"
            >
              {['Multiple times daily', 'Daily', 'Few times per week', 'Weekly', 'Rarely'].map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`check-${option}`} />
                  <Label htmlFor={`check-${option}`} className="font-normal cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Section 2: Content Preferences */}
        <div className="space-y-4 pt-6 border-t">
          <div>
            <Label className="text-base font-semibold">
              4. What would you most want to SHARE? (Select all that apply)
            </Label>
            <div className="mt-3 space-y-2">
              {contentToShareOptions.map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`share-${option}`}
                    checked={formData.contentToShare.includes(option)}
                    onCheckedChange={() => handleCheckboxChange('contentToShare', option)}
                  />
                  <Label htmlFor={`share-${option}`} className="font-normal cursor-pointer">{option}</Label>
                </div>
              ))}
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  placeholder="Other (please specify)..."
                  value={formData.contentToShareOther}
                  onChange={(e) => setFormData(prev => ({ ...prev, contentToShareOther: e.target.value }))}
                  className="max-w-md"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold">
              5. What content do you most want to SEE? (Select all)
            </Label>
            <div className="mt-3 space-y-2">
              {contentToSeeOptions.map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`see-${option}`}
                    checked={formData.contentToSee.includes(option)}
                    onCheckedChange={() => handleCheckboxChange('contentToSee', option)}
                  />
                  <Label htmlFor={`see-${option}`} className="font-normal cursor-pointer">{option}</Label>
                </div>
              ))}
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  placeholder="Other (please specify)..."
                  value={formData.contentToSeeOther}
                  onChange={(e) => setFormData(prev => ({ ...prev, contentToSeeOther: e.target.value }))}
                  className="max-w-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Feature Priorities */}
        <div className="space-y-4 pt-6 border-t">
          <Label className="text-base font-semibold">
            6. Rate these features (1 = Not important, 5 = Essential)
          </Label>
          <div className="space-y-4">
            {featuresToRate.map(feature => (
              <div key={feature}>
                <Label className="text-sm mb-2 block">{feature}</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <Button
                      key={rating}
                      type="button"
                      variant={formData.featureRatings[feature] === rating ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFeatureRating(feature, rating)}
                      className="w-12"
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Concerns */}
        <div className="space-y-4 pt-6 border-t">
          <div>
            <Label className="text-base font-semibold">
              7. What concerns do you have about social feeds? (Select all)
            </Label>
            <div className="mt-3 space-y-2">
              {concernOptions.map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`concern-${option}`}
                    checked={formData.concerns.includes(option)}
                    onCheckedChange={() => handleCheckboxChange('concerns', option)}
                  />
                  <Label htmlFor={`concern-${option}`} className="font-normal cursor-pointer">{option}</Label>
                </div>
              ))}
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  placeholder="Other concerns..."
                  value={formData.concernsOther}
                  onChange={(e) => setFormData(prev => ({ ...prev, concernsOther: e.target.value }))}
                  className="max-w-md"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold">
              8. How should DNA's feed be DIFFERENT from LinkedIn/Twitter/Facebook?
            </Label>
            <Textarea
              value={formData.differentiationIdea}
              onChange={(e) => setFormData(prev => ({ ...prev, differentiationIdea: e.target.value }))}
              placeholder="Share your thoughts on what would make DNA's feed unique..."
              maxLength={500}
              rows={4}
              className="mt-2"
            />
            <p className="text-sm text-neutral-500 mt-1">{formData.differentiationIdea.length}/500</p>
          </div>

          <div>
            <Label className="text-base font-semibold">
              9. If you could have ONE feature that doesn't exist elsewhere, what would it be?
            </Label>
            <Textarea
              value={formData.dreamFeature}
              onChange={(e) => setFormData(prev => ({ ...prev, dreamFeature: e.target.value }))}
              placeholder="Describe your dream feature..."
              maxLength={300}
              rows={3}
              className="mt-2"
            />
            <p className="text-sm text-neutral-500 mt-1">{formData.dreamFeature.length}/300</p>
          </div>

          <div>
            <Label className="text-base font-semibold">
              10. Complete this: "I would post to the DNA feed when..."
            </Label>
            <Textarea
              value={formData.useCase}
              onChange={(e) => setFormData(prev => ({ ...prev, useCase: e.target.value }))}
              placeholder="I would post when..."
              maxLength={200}
              rows={2}
              className="mt-2"
            />
            <p className="text-sm text-neutral-500 mt-1">{formData.useCase.length}/200</p>
          </div>
        </div>

        {/* Early Access */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="early-access"
              checked={formData.wantsEarlyAccess}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, wantsEarlyAccess: checked as boolean }))}
            />
            <Label htmlFor="early-access" className="font-semibold cursor-pointer">
              Yes! Notify me when the feed launches
            </Label>
          </div>
          {formData.wantsEarlyAccess && (
            <Input
              type="email"
              placeholder="Your email for early access"
              value={formData.earlyAccessEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, earlyAccessEmail: e.target.value }))}
              className="max-w-md"
            />
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full bg-dna-emerald hover:bg-dna-forest text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <p className="text-sm text-neutral-500 text-center mt-2">
            * Required questions
          </p>
        </div>
      </form>
    </Card>
  );
};

export default FeedResearchForm;
