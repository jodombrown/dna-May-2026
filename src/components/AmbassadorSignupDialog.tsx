
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Users, Star, Handshake } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ComprehensiveLocationInput from '@/components/ui/comprehensive-location-input';

interface AmbassadorSignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AmbassadorSignupDialog = ({ isOpen, onClose }: AmbassadorSignupDialogProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    linkedin: '',
    organization: '',
    currentLocation: '',
    connectionToAfrica: '',
    experience: '',
    motivation: '',
    skills: '',
    availability: ''
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
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in your first name, last name, and email.');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const ambassadorDetails = `
Experience/Background: ${formData.experience || 'Not provided'}

Motivation: ${formData.motivation || 'Not provided'}

Skills to Contribute: ${formData.skills || 'Not provided'}

Availability: ${formData.availability || 'Not provided'}
      `.trim();

      const { data, error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'ambassador-signup',
          formData: {
            name: fullName,
            email: formData.email,
            organization: formData.organization,
            current_location: formData.currentLocation,
            connection_to_africa: formData.connectionToAfrica,
            linkedin_url: formData.linkedin,
            ambassador_details: ambassadorDetails
          },
          userEmail: formData.email
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success('Thank you for your interest in becoming a DNA Ambassador! We\'ll be in touch soon to discuss next steps.');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          linkedin: '',
          organization: '',
          currentLocation: '',
          connectionToAfrica: '',
          experience: '',
          motivation: '',
          skills: '',
          availability: ''
        });
        onClose();
      } else {
        throw new Error(data?.error || 'Failed to submit ambassador application');
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
              <Users className="w-6 h-6 text-dna-emerald" />
            </div>
            <Badge className="bg-dna-copper text-white">
              Ambassador Program
            </Badge>
          </div>
          <SheetTitle className="text-2xl text-neutral-900">Become a DNA Ambassador</SheetTitle>
          <SheetDescription className="text-base text-neutral-600">
            Join our ambassador program to help build and grow the DNA community across the African diaspora. 
            Ambassadors play a crucial role in connecting communities, driving engagement, and shaping our platform's future.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          <div className="bg-gradient-to-r from-dna-emerald/5 to-dna-copper/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-dna-emerald" />
              What DNA Ambassadors Do
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-dna-emerald text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  1
                </div>
                <p className="text-neutral-700">Help grow DNA communities in your region or professional area</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-dna-copper text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  2
                </div>
                <p className="text-neutral-700">Facilitate connections between diaspora professionals and organizations</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-dna-forest text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  3
                </div>
                <p className="text-neutral-700">Provide feedback and insights to help shape platform development</p>
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
              <Label htmlFor="experience" className="text-sm font-medium text-neutral-700">
                Relevant Experience & Background
              </Label>
              <Textarea
                id="experience"
                placeholder="Tell us about your professional background, community involvement, or relevant experience..."
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="motivation" className="text-sm font-medium text-neutral-700">
                Why do you want to become a DNA Ambassador?
              </Label>
              <Textarea
                id="motivation"
                placeholder="Share your motivation and what you hope to achieve as an ambassador..."
                value={formData.motivation}
                onChange={(e) => handleInputChange('motivation', e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="skills" className="text-sm font-medium text-neutral-700">
                Skills & Expertise You Can Contribute
              </Label>
              <Textarea
                id="skills"
                placeholder="What skills, knowledge, or expertise would you bring to the ambassador role?"
                value={formData.skills}
                onChange={(e) => handleInputChange('skills', e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="availability" className="text-sm font-medium text-neutral-700">
                Time Commitment & Availability
              </Label>
              <Textarea
                id="availability"
                placeholder="How much time can you commit to ambassador activities? Any specific preferences or constraints?"
                value={formData.availability}
                onChange={(e) => handleInputChange('availability', e.target.value)}
                rows={2}
                maxLength={300}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                variant="default"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting Application...' : 'Apply to be an Ambassador'}
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

export default AmbassadorSignupDialog;
