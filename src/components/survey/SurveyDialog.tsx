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

interface SurveyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SurveyDialog: React.FC<SurveyDialogProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    age_group: '',
    gender: '',
    current_country: '',
    country_of_origin: '',
    education: '',
    occupation: '',
    connection_methods: [] as string[],
    participation_frequency: '',
    challenges: '',
    platform_interest: {
      connect: '',
      collaborate: '',
      contribute: ''
    },
    valuable_features: [] as string[],
    motivation: '',
    concerns: '',
    follow_up: false,
    first_name: '',
    last_name: '',
    email: '',
    additional_comments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'survey',
          formData: formData,
          userEmail: formData.email || undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Survey Submitted!",
        description: "Thank you for your valuable feedback. Your response has been sent to our team.",
      });

      onClose();
      setFormData({
        age_group: '',
        gender: '',
        current_country: '',
        country_of_origin: '',
        education: '',
        occupation: '',
        connection_methods: [],
        participation_frequency: '',
        challenges: '',
        platform_interest: {
          connect: '',
          collaborate: '',
          contribute: ''
        },
        valuable_features: [],
        motivation: '',
        concerns: '',
        follow_up: false,
        first_name: '',
        last_name: '',
        email: '',
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

  const handleConnectionMethodChange = (method: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      connection_methods: checked
        ? [...prev.connection_methods, method]
        : prev.connection_methods.filter(m => m !== method)
    }));
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      valuable_features: checked
        ? [...prev.valuable_features, feature]
        : prev.valuable_features.filter(f => f !== feature)
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-dna-forest">
            DNA Market Validation Survey
          </SheetTitle>
          <p className="text-neutral-600">
            Thank you for participating in this survey. Your feedback will help shape a new digital platform 
            designed to connect, empower, and mobilize the African diaspora for Africa's progress. 
            All responses are confidential.
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Section 1: About You */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dna-copper">Section 1: About You</h3>
            
            <div>
              <Label htmlFor="age_group">Age Group</Label>
              <RadioGroup 
                value={formData.age_group} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, age_group: value }))}
              >
                {['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'].map((age) => (
                  <div key={age} className="flex items-center space-x-2">
                    <RadioGroupItem value={age} id={age} />
                    <Label htmlFor={age}>{age}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <RadioGroup 
                value={formData.gender} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
              >
                {['Female', 'Male', 'Non-binary/Other', 'Prefer not to say'].map((gender) => (
                  <div key={gender} className="flex items-center space-x-2">
                    <RadioGroupItem value={gender} id={gender} />
                    <Label htmlFor={gender}>{gender}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current_country">Current Country</Label>
                <Input
                  id="current_country"
                  value={formData.current_country}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_country: e.target.value }))}
                  placeholder="Country you currently live in"
                />
              </div>
              <div>
                <Label htmlFor="country_of_origin">Country of Origin</Label>
                <Input
                  id="country_of_origin"
                  value={formData.country_of_origin}
                  onChange={(e) => setFormData(prev => ({ ...prev, country_of_origin: e.target.value }))}
                  placeholder="Your country of origin"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="education">Highest Level of Education</Label>
              <RadioGroup 
                value={formData.education} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, education: value }))}
              >
                {['Primary', 'Secondary', 'Tertiary/University', 'Postgraduate'].map((edu) => (
                  <div key={edu} className="flex items-center space-x-2">
                    <RadioGroupItem value={edu} id={edu} />
                    <Label htmlFor={edu}>{edu}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="occupation">Current Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                placeholder="Your current occupation"
              />
            </div>
          </div>

          {/* Section 2: Digital Habits & Community Engagement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dna-copper">Section 2: Digital Habits & Community Engagement</h3>
            
            <div>
              <Label>How do you currently connect with other Africans or diaspora members? (Select all that apply)</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {[
                  'Social media (Facebook, WhatsApp, etc.)',
                  'Professional networks (LinkedIn)',
                  'Community organizations',
                  'Events/conferences',
                  "I don't connect regularly",
                  'Other'
                ].map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={method}
                      checked={formData.connection_methods.includes(method)}
                      onCheckedChange={(checked) => handleConnectionMethodChange(method, checked as boolean)}
                    />
                    <Label htmlFor={method} className="text-sm">{method}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="participation_frequency">How often do you participate in diaspora community activities?</Label>
              <RadioGroup 
                value={formData.participation_frequency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, participation_frequency: value }))}
              >
                {['Never', 'Occasionally', 'Monthly', 'Weekly', 'Daily'].map((freq) => (
                  <div key={freq} className="flex items-center space-x-2">
                    <RadioGroupItem value={freq} id={freq} />
                    <Label htmlFor={freq}>{freq}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Section 3: Platform Needs & Interest */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dna-copper">Section 3: Platform Needs & Interest</h3>
            
            <div>
              <Label htmlFor="challenges">What challenges do you face when trying to connect or collaborate with other diaspora members or organizations?</Label>
              <Textarea
                id="challenges"
                value={formData.challenges}
                onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                placeholder="Describe your challenges..."
                rows={3}
              />
            </div>

            <div>
              <Label>How interested would you be in using a platform that allows you to: (1 = Not interested, 5 = Very interested)</Label>
              <div className="space-y-3 mt-2">
                {[
                  { key: 'connect', label: 'Connect with other diaspora members' },
                  { key: 'collaborate', label: 'Collaborate on projects for Africa\'s progress' },
                  { key: 'contribute', label: 'Contribute financially or with skills to African causes' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <Label className="flex-1">{item.label}</Label>
                    <RadioGroup 
                      value={formData.platform_interest[item.key as keyof typeof formData.platform_interest]} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        platform_interest: { 
                          ...prev.platform_interest, 
                          [item.key]: value 
                        } 
                      }))}
                      className="flex space-x-2"
                    >
                      {['1', '2', '3', '4', '5'].map((rating) => (
                        <div key={rating} className="flex items-center">
                          <RadioGroupItem value={rating} id={`${item.key}-${rating}`} />
                          <Label htmlFor={`${item.key}-${rating}`} className="ml-1 text-sm">{rating}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>What features would you find most valuable in such a platform? (Select up to 3)</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {[
                  'Professional networking',
                  'Project collaboration tools',
                  'Crowdfunding/investment opportunities',
                  'Mentorship programs',
                  'Events and webinars',
                  'News and updates about Africa'
                ].map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={formData.valuable_features.includes(feature)}
                      onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                      disabled={formData.valuable_features.length >= 3 && !formData.valuable_features.includes(feature)}
                    />
                    <Label htmlFor={feature} className="text-sm">{feature}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="motivation">What would motivate you to actively use and contribute to this platform?</Label>
              <Textarea
                id="motivation"
                value={formData.motivation}
                onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                placeholder="Share your motivations..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="concerns">What concerns or reservations would you have about joining such a platform?</Label>
              <Textarea
                id="concerns"
                value={formData.concerns}
                onChange={(e) => setFormData(prev => ({ ...prev, concerns: e.target.value }))}
                placeholder="Share your concerns..."
                rows={3}
              />
            </div>
          </div>

          {/* Section 4: Final Thoughts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-dna-copper">Section 4: Final Thoughts</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="follow_up"
                checked={formData.follow_up}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, follow_up: checked as boolean }))}
              />
              <Label htmlFor="follow_up">Would you be willing to participate in follow-up interviews or focus groups?</Label>
            </div>

            {formData.follow_up && (
              <div className="space-y-4 bg-neutral-50 p-4 rounded-lg">
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
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="additional_comments">Any additional comments or suggestions?</Label>
              <Textarea
                id="additional_comments"
                value={formData.additional_comments}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_comments: e.target.value }))}
                placeholder="Additional thoughts..."
                rows={3}
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

export default SurveyDialog;
