import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LockKeyhole, Mail, User, MessageSquare, Calendar, Loader2, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { getErrorMessage } from '@/lib/errorLogger';

interface BetaWaitlistProps {
  onBack?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const BetaWaitlist = ({ onBack, open, onOpenChange }: BetaWaitlistProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    linkedin: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast({
        title: "Missing Information",
        description: "Please provide your first name, last name, and email.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('beta_waitlist')
        .insert([{
          email: formData.email.toLowerCase().trim(),
          full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          linkedin_url: formData.linkedin.trim() || null,
          message: formData.message.trim() || null
        }]);

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Already on the waitlist",
            description: "You're already registered! We'll notify you when we launch.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "You're on the list! 🎉",
          description: "We'll email you when DNA opens to more users after the beta period ends.",
        });
        
        // Clear form and close dialog
        setFormData({ firstName: '', lastName: '', email: '', linkedin: '', message: '' });
        if (onOpenChange) onOpenChange(false);
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error) || "Failed to join waitlist. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <>
      <div className="space-y-1 text-center mb-6">
        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-dna-copper to-dna-gold rounded-full flex items-center justify-center">
          <LockKeyhole className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-dna-forest">
          Beta Now Active
        </h2>
        <p className="text-base text-muted-foreground">
          Our beta is currently active for a select group of African Diaspora testers from{' '}
          <span className="font-semibold text-dna-copper">December 15, 2025 – January 15, 2026</span>.
        </p>
      </div>
      <div className="mb-6 p-4 bg-dna-mint/10 border border-dna-mint/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-dna-copper mt-0.5 flex-shrink-0" />
          <div className="text-sm text-neutral-700">
            <p className="font-medium mb-1">Join our waitlist for upcoming access</p>
            <p className="text-neutral-600">
              Join now to be notified when DNA opens to more users after the beta period.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="waitlist-firstName" className="text-sm font-medium">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="waitlist-firstName"
              type="text"
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="border-neutral-300 focus:border-dna-copper focus:ring-dna-copper"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waitlist-lastName" className="text-sm font-medium">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="waitlist-lastName"
              type="text"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="border-neutral-300 focus:border-dna-copper focus:ring-dna-copper"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="waitlist-email" className="text-sm font-medium">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <Input
              id="waitlist-email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="pl-10 border-neutral-300 focus:border-dna-copper focus:ring-dna-copper"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="waitlist-linkedin" className="text-sm font-medium">
            LinkedIn Profile URL
          </Label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <Input
              id="waitlist-linkedin"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedin}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
              className="pl-10 border-neutral-300 focus:border-dna-copper focus:ring-dna-copper"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="waitlist-message" className="text-sm font-medium">
            Why are you interested? (Optional)
          </Label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 text-neutral-400 w-5 h-5" />
            <Textarea
              id="waitlist-message"
              placeholder="Tell us what excites you about DNA..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="pl-10 pt-2 border-neutral-300 focus:border-dna-copper focus:ring-dna-copper min-h-[100px]"
              maxLength={500}
            />
          </div>
          <p className="text-xs text-neutral-500 text-right">
            {formData.message.length}/500 characters
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-dna-copper to-dna-gold hover:from-dna-gold hover:to-dna-copper text-white font-medium py-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Joining Waitlist...
            </>
          ) : (
            'Join the Waitlist'
          )}
        </Button>

        {onBack && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full text-neutral-600 hover:text-dna-forest"
          >
            ← Back to Sign In
          </Button>
        )}
      </form>

      {onBack && (
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <p className="text-xs text-center text-neutral-500">
            Already have an account?{' '}
            <button
              onClick={onBack}
              className="text-dna-copper hover:text-dna-gold font-medium underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      )}
    </>
  );

  // If used as a dialog
  if (open !== undefined && onOpenChange) {
    return (
      <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-[500px]">
          {content}
        </ResponsiveModal>
    );
  }

  // If used as a standalone card
  return (
    <Card className="border-dna-copper/20 shadow-xl">
      <CardContent className="pt-6">
        {content}
      </CardContent>
    </Card>
  );
};
