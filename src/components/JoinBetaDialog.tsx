import React, { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface JoinBetaDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinBetaDialog: React.FC<JoinBetaDialogProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    linkedin: '',
    interest: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'beta_request',
          formData,
        },
      });

      if (error) throw error;

      toast({
        title: 'Welcome to the Beta!',
        description: 'Thank you for joining our beta program. We\'ll be in touch soon!',
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        email: '',
        linkedin: '',
        interest: '',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={onClose} className="sm:max-w-[500px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="text-2xl font-bold text-dna-forest">
            Join Our Beta Program
          </ResponsiveModalTitle>
          <ResponsiveModalDescription className="text-base">
            Be among the first to experience the Diaspora Network of Africa platform. 
            Fill out the form below to join our beta program.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin" className="text-sm font-medium">
              LinkedIn Profile URL
            </Label>
            <Input
              id="linkedin"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interest" className="text-sm font-medium">
              What interests you most about DNA?
            </Label>
            <Textarea
              id="interest"
              value={formData.interest}
              onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
              placeholder="Tell us about your goals, expertise, or how you'd like to contribute..."
              rows={4}
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
              className="flex-1 bg-dna-emerald hover:bg-dna-forest"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Join Beta Program'
              )}
            </Button>
          </div>
        </form>
      </ResponsiveModal>
  );
};

export default JoinBetaDialog;
