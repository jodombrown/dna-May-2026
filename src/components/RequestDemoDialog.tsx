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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Building2, Users, Mail } from 'lucide-react';

interface RequestDemoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestDemoDialog: React.FC<RequestDemoDialogProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    team_size: '',
    message: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.organization) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Send email via edge function
      const { error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'demo_request',
          formData: formData,
          userEmail: formData.email,
        },
      });

      if (error) throw error;

      toast({
        title: 'Demo Request Submitted!',
        description: 'We\'ll contact you shortly to schedule your demo.',
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        email: '',
        organization: '',
        role: '',
        team_size: '',
        message: '',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Please try again later or contact us directly.',
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
            Request a Demo
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            See how DNA can transform your organization's connection to the African diaspora.
            Fill out the form below and we'll schedule a personalized demo.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization" className="text-sm font-medium">
              Organization <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                placeholder="Company or organization name"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">
              Your Role
            </Label>
            <Input
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              placeholder="e.g., CEO, HR Manager, Innovation Lead"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_size" className="text-sm font-medium">
              Team Size
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="team_size"
                name="team_size"
                value={formData.team_size}
                onChange={handleInputChange}
                placeholder="e.g., 10-50 employees"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              What are you interested in?
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Tell us about your goals and how DNA might help..."
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
              className="flex-1 bg-dna-copper hover:bg-dna-gold"
              disabled={isSubmitting}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Request Demo'}
            </Button>
          </div>
        </form>
      </ResponsiveModal>
  );
};

export default RequestDemoDialog;
