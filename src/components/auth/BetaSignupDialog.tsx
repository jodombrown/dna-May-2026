import React, { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BetaSignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WaitlistFormData {
  name: string;
  email: string;
  company: string;
  role: string;
  experience: string;
  experienceOther: string;
  motivation: string;
  linkedin_url: string;
}

export const BetaSignupDialog: React.FC<BetaSignupDialogProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WaitlistFormData>({
    name: '',
    email: '',
    company: '',
    role: '',
    experience: '',
    experienceOther: '',
    motivation: '',
    linkedin_url: ''
  });

  const handleInputChange = (field: keyof WaitlistFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in your name and email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'waitlist_signup',
          formData,
          userEmail: formData.email
        }
      });

      if (error) throw error;

      toast({
        title: "Welcome to the waitlist!",
        description: "We've received your application and will be in touch soon.",
      });

      setFormData({
        name: '',
        email: '',
        company: '',
        role: '',
        experience: '',
        experienceOther: '',
        motivation: '',
        linkedin_url: ''
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={onClose} className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="text-xl font-bold gradient-text">
            Join the DNA Platform Waitlist
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company/Organization</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Your company"
              />
            </div>
            <div>
              <Label htmlFor="role">Current Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder="Your current role"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="experience">I identify as</Label>
            <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your diaspora identity" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg">
                <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="researcher">Researcher</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="artist">Artist/Creative</SelectItem>
                <SelectItem value="tech">Tech Innovator</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="nonprofit">Nonprofit Leader</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.experience === 'other' && (
            <div>
              <Label htmlFor="experienceOther">Please specify</Label>
              <Input
                id="experienceOther"
                value={formData.experienceOther}
                onChange={(e) => handleInputChange('experienceOther', e.target.value)}
                placeholder="Describe your diaspora identity"
              />
            </div>
          )}

          <div>
            <Label htmlFor="linkedin">LinkedIn Profile (Optional)</Label>
            <Input
              id="linkedin"
              value={formData.linkedin_url}
              onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div>
            <Label htmlFor="motivation">Why are you interested in the DNA Platform?</Label>
            <Textarea
              id="motivation"
              value={formData.motivation}
              onChange={(e) => handleInputChange('motivation', e.target.value)}
              placeholder="Tell us about your interest in connecting with the African diaspora..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Waitlist'
              )}
            </Button>
          </div>
        </form>
      </ResponsiveModal>
  );
};

export default BetaSignupDialog;