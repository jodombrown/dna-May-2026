
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MessageSquare, Star, Lightbulb, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ComprehensiveLocationInput from '@/components/ui/comprehensive-location-input';

interface MainPageFeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MainPageFeedbackPanel = ({ isOpen, onClose }: MainPageFeedbackPanelProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    linkedin: '',
    organization: '',
    currentLocation: '',
    connectionToAfrica: '',
    feedbackType: '',
    overallExperience: '',
    suggestions: '',
    specificFeedback: '',
    mostValuableFeature: '',
    improvementAreas: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    const trimmedEmail = formData.email.trim();
    
    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
      toast.error('Please fill in your first name, last name, and email.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = `${trimmedFirstName} ${trimmedLastName}`;
      const feedbackDetails = `
Overall Experience: ${formData.overallExperience.trim() || 'Not provided'}

Most Valuable Feature: ${formData.mostValuableFeature.trim() || 'Not provided'}

Improvement Areas: ${formData.improvementAreas.trim() || 'Not provided'}

Specific Feedback: ${formData.specificFeedback.trim() || 'Not provided'}

General Suggestions: ${formData.suggestions.trim() || 'Not provided'}

Feedback Type: ${formData.feedbackType.trim() || 'General'}
      `.trim();

      const { data, error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'main-page-feedback',
          formData: {
            name: fullName,
            email: trimmedEmail,
            organization: formData.organization.trim(),
            current_location: formData.currentLocation.trim(),
            connection_to_africa: formData.connectionToAfrica.trim(),
            linkedin_url: formData.linkedin.trim(),
            feedback_type: formData.feedbackType.trim(),
            feedback_details: feedbackDetails
          },
          userEmail: formData.email
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success('Thank you for your valuable feedback! We truly appreciate your insights and will use them to improve the DNA platform.');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          linkedin: '',
          organization: '',
          currentLocation: '',
          connectionToAfrica: '',
          feedbackType: '',
          overallExperience: '',
          suggestions: '',
          specificFeedback: '',
          mostValuableFeature: '',
          improvementAreas: ''
        });
        onClose();
      } else {
        throw new Error(data?.error || 'Failed to send feedback');
      }
    } catch (error: unknown) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-dna-emerald/10 rounded-lg">
              <MessageSquare className="w-6 h-6 text-dna-emerald" />
            </div>
            <Badge className="bg-dna-copper text-white">
              Your Voice Matters
            </Badge>
          </div>
          <SheetTitle className="text-2xl text-neutral-900">Share Your Feedback & Vision</SheetTitle>
          <SheetDescription className="text-base text-neutral-600">
            Help us build the DNA platform that truly serves the African Diaspora. Your insights, suggestions, and perspectives are invaluable in shaping our journey forward.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          <div className="bg-gradient-to-r from-dna-emerald/5 to-dna-copper/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-dna-emerald" />
              Why Your Feedback Is Critical
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-dna-emerald text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  1
                </div>
                <p className="text-neutral-700">Help us understand what resonates most with diaspora professionals like you</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-dna-copper text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  2
                </div>
                <p className="text-neutral-700">Guide our platform development priorities and feature roadmap</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-dna-forest text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  3
                </div>
                <p className="text-neutral-700">Ensure we're building something that truly adds value to your professional journey</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-neutral-700">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-neutral-700">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  maxLength={50}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                maxLength={254}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="organization" className="text-sm font-medium text-neutral-700">
                  Organization/Company
                </Label>
                <Input
                  id="organization"
                  type="text"
                  placeholder="Your organization"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  maxLength={100}
                />
              </div>
              <div>
                <ComprehensiveLocationInput
                  id="currentLocation"
                  label="Current Location"
                  value={formData.currentLocation}
                  onChange={(value) => handleInputChange('currentLocation', value)}
                  placeholder="City, State/Province, Country"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="connectionToAfrica" className="text-sm font-medium text-neutral-700">
                Your Connection to Africa
              </Label>
              <Input
                id="connectionToAfrica"
                type="text"
                placeholder="e.g., Nigerian diaspora, business interests in Ghana, etc."
                value={formData.connectionToAfrica}
                onChange={(e) => handleInputChange('connectionToAfrica', e.target.value)}
                maxLength={150}
              />
            </div>

            <div>
              <Label htmlFor="linkedin" className="text-sm font-medium text-neutral-700">
                LinkedIn Profile (Optional)
              </Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedin}
                onChange={(e) => handleInputChange('linkedin', e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="overallExperience" className="text-sm font-medium text-neutral-700">
                How would you describe your overall experience with the DNA platform concept?
              </Label>
              <Textarea
                id="overallExperience"
                placeholder="Share your initial impressions, what excited you, any concerns..."
                value={formData.overallExperience}
                onChange={(e) => handleInputChange('overallExperience', e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="mostValuableFeature" className="text-sm font-medium text-neutral-700">
                Which pillar or feature concept resonates most with you? (Connect, Collaborate, Contribute)
              </Label>
              <Textarea
                id="mostValuableFeature"
                placeholder="Tell us which aspect of DNA you find most compelling and why..."
                value={formData.mostValuableFeature}
                onChange={(e) => handleInputChange('mostValuableFeature', e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="improvementAreas" className="text-sm font-medium text-neutral-700">
                What areas do you think need improvement or clarification?
              </Label>
              <Textarea
                id="improvementAreas"
                placeholder="Share any concerns, unclear aspects, or areas for improvement..."
                value={formData.improvementAreas}
                onChange={(e) => handleInputChange('improvementAreas', e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="suggestions" className="text-sm font-medium text-neutral-700">
                Additional Suggestions & Ideas
              </Label>
              <Textarea
                id="suggestions"
                placeholder="Any other suggestions, ideas, or thoughts you'd like to share with us..."
                value={formData.suggestions}
                onChange={(e) => handleInputChange('suggestions', e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-neutral-500 mt-1">
                {formData.suggestions.length}/1000 characters
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                variant="default"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Sending Your Feedback...' : 'Share My Feedback'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-6"
              >
                Close
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MainPageFeedbackPanel;
