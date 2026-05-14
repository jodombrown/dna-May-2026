import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PageSpecificSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  pageType: 'connect' | 'collaborate' | 'contribute' | 'convene' | 'convey';
}

const PageSpecificSurvey: React.FC<PageSpecificSurveyProps> = ({ isOpen, onClose, pageType }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    email: '',
    current_experience: '',
    desired_features: [] as string[],
    improvement_suggestions: '',
    missing_elements: '',
    interaction_preferences: '',
    usage_frequency: '',
    additional_comments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getPageContent = () => {
    switch (pageType) {
      case 'connect':
        return {
          title: 'Connect Survey - Shape Our Networking Platform',
          description: 'Help us understand how you want to connect with the African diaspora community.',
          questions: {
            experience: 'How do you currently connect with other diaspora members?',
            features: [
              'Professional networking tools',
              'Mentorship matching',
              'Event discovery',
              'Industry-specific groups',
              'Location-based connections',
              'Skills-based matching'
            ],
            interaction: 'How would you prefer to interact with other members?',
            missing: 'What networking features are missing from existing platforms?'
          }
        };
      case 'collaborate':
        return {
          title: 'Collaborate Survey - Build Our Collaboration Hub',
          description: 'Share your ideas for how we can best facilitate project collaboration.',
          questions: {
            experience: 'How do you currently collaborate on projects for Africa?',
            features: [
              'Project matching system',
              'Team formation tools',
              'Progress tracking',
              'Resource sharing',
              'Skill-based project discovery',
              'Virtual collaboration spaces'
            ],
            interaction: 'What collaboration tools would be most valuable to you?',
            missing: 'What collaboration features are you missing in current platforms?'
          }
        };
      case 'contribute':
        return {
          title: 'Contribute Survey - Design Our Impact Platform',
          description: 'Help us create the best way for you to contribute to African development.',
          questions: {
            experience: 'How do you currently contribute to African causes?',
            features: [
              'Impact tracking dashboard',
              'Crowdfunding projects',
              'Skill-based volunteering',
              'Investment opportunities',
              'Educational sponsorships',
              'Community fundraising'
            ],
            interaction: 'What would motivate you to contribute more frequently?',
            missing: 'What contribution methods are missing from existing platforms?'
          }
        };
      case 'convene':
        return {
          title: 'Convene Survey - Shape Our Events Platform',
          description: 'Help us create the best diaspora gathering experiences.',
          questions: {
            experience: 'What types of diaspora events do you currently attend?',
            features: [
              'Virtual event hosting',
              'Hybrid event support',
              'Regional meetups',
              'Industry conferences',
              'Networking mixers',
              'Cultural gatherings'
            ],
            interaction: 'What would make you more likely to attend or host events?',
            missing: 'What event features are missing from existing platforms?'
          }
        };
      case 'convey':
        return {
          title: 'Convey Survey - Enhance Our Storytelling Platform',
          description: 'Help us amplify diaspora success stories and impact.',
          questions: {
            experience: 'How do you currently share or discover diaspora achievements?',
            features: [
              'Impact story showcase',
              'Video testimonials',
              'Project case studies',
              'Achievement highlights',
              'Community spotlights',
              'Innovation updates'
            ],
            interaction: 'What would encourage you to share your own story?',
            missing: 'What storytelling features are missing from existing platforms?'
          }
        };
    }
  };

  const content = getPageContent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: `${pageType}_survey`,
          formData: {
            ...formData,
            page_type: pageType
          },
          userEmail: formData.email || undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Survey Submitted!",
        description: `Thank you for your ${pageType} feedback. Your input will help shape our platform.`,
      });

      onClose();
      setFormData({
        first_name: '',
        email: '',
        current_experience: '',
        desired_features: [],
        improvement_suggestions: '',
        missing_elements: '',
        interaction_preferences: '',
        usage_frequency: '',
        additional_comments: ''
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      desired_features: checked
        ? [...prev.desired_features, feature]
        : prev.desired_features.filter(f => f !== feature)
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-dna-forest">
            {content.title}
          </SheetTitle>
          <p className="text-neutral-600">
            {content.description}
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dna-copper">About You</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Your first name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dna-copper">Your Experience</h3>
            
            <div>
              <Label htmlFor="current_experience">{content.questions.experience}</Label>
              <Textarea
                id="current_experience"
                value={formData.current_experience}
                onChange={(e) => setFormData(prev => ({ ...prev, current_experience: e.target.value }))}
                placeholder="Describe your current experience..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="usage_frequency">How often would you use this feature?</Label>
              <RadioGroup 
                value={formData.usage_frequency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, usage_frequency: value }))}
              >
                {['Daily', 'Weekly', 'Monthly', 'Occasionally', 'Rarely'].map((freq) => (
                  <div key={freq} className="flex items-center space-x-2">
                    <RadioGroupItem value={freq} id={freq} />
                    <Label htmlFor={freq}>{freq}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dna-copper">Desired Features</h3>
            
            <div>
              <Label>What features would you find most valuable? (Select all that apply)</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {content.questions.features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={formData.desired_features.includes(feature)}
                      onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                    />
                    <Label htmlFor={feature} className="text-sm">{feature}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="interaction_preferences">{content.questions.interaction}</Label>
              <Textarea
                id="interaction_preferences"
                value={formData.interaction_preferences}
                onChange={(e) => setFormData(prev => ({ ...prev, interaction_preferences: e.target.value }))}
                placeholder="Share your preferences..."
                rows={3}
              />
            </div>
          </div>

          {/* Improvements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dna-copper">Help Us Improve</h3>
            
            <div>
              <Label htmlFor="missing_elements">{content.questions.missing}</Label>
              <Textarea
                id="missing_elements"
                value={formData.missing_elements}
                onChange={(e) => setFormData(prev => ({ ...prev, missing_elements: e.target.value }))}
                placeholder="What's missing from existing solutions..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="improvement_suggestions">Any other suggestions for improvement?</Label>
              <Textarea
                id="improvement_suggestions"
                value={formData.improvement_suggestions}
                onChange={(e) => setFormData(prev => ({ ...prev, improvement_suggestions: e.target.value }))}
                placeholder="Your ideas and suggestions..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="additional_comments">Additional Comments</Label>
              <Textarea
                id="additional_comments"
                value={formData.additional_comments}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_comments: e.target.value }))}
                placeholder="Any other thoughts..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-dna-emerald hover:bg-dna-forest text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Survey'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default PageSpecificSurvey;