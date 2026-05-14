
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeText, isValidLinkedInUrl, isRateLimited } from '@/utils/validation';
import { getGenericErrorMessage } from '@/utils/errorHandling';

interface NotificationFormProps {
  onClose: () => void;
}

const NotificationForm: React.FC<NotificationFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    linkedin_url: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    if (isRateLimited(lastSubmission, 5000)) {
      toast.error('Please wait a moment before submitting again');
      return;
    }

    // Sanitize and validate inputs
    const sanitizedName = sanitizeText(formData.name.trim());
    const sanitizedEmail = sanitizeText(formData.email.trim());
    const sanitizedMessage = sanitizeText(formData.message);
    const sanitizedLinkedIn = sanitizeText(formData.linkedin_url);

    if (!sanitizedName || !sanitizedEmail) {
      toast.error('Please fill in your name and email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(sanitizedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (sanitizedLinkedIn && !isValidLinkedInUrl(sanitizedLinkedIn)) {
      toast.error('Please enter a valid LinkedIn profile URL');
      return;
    }

    setIsSubmitting(true);
    setLastSubmission(Date.now());

    try {
      const { data, error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'contact',
          formData: {
            name: sanitizedName,
            email: sanitizedEmail,
            message: sanitizedMessage || 'I would like to stay notified about the DNA platform launch.',
            linkedin_url: sanitizedLinkedIn
          },
          userEmail: sanitizedEmail
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success('Thank you! We\'ve sent you a confirmation email.');
        setFormData({ name: '', email: '', linkedin_url: '', message: '' });
        onClose();
      } else {
        throw new Error(data?.error || 'Failed to send email');
      }
    } catch (error: unknown) {
      toast.error(getGenericErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="stay-notified-name" className="block text-sm font-medium text-neutral-700 mb-2">
          Full Name *
        </label>
        <Input
          id="stay-notified-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter your full name"
          required
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label htmlFor="stay-notified-email" className="block text-sm font-medium text-neutral-700 mb-2">
          Email Address *
        </label>
        <Input
          id="stay-notified-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter your email address"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="stay-notified-linkedin" className="block text-sm font-medium text-neutral-700 mb-2">
          LinkedIn URL (Optional)
        </label>
        <Input
          id="stay-notified-linkedin"
          type="url"
          value={formData.linkedin_url}
          onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
          placeholder="https://linkedin.com/in/yourprofile"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="stay-notified-message" className="block text-sm font-medium text-neutral-700 mb-2">
          Message (Optional)
        </label>
        <Textarea
          id="stay-notified-message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us about your background and how you'd like to contribute to Africa's development..."
          rows={4}
          disabled={isSubmitting}
          className="resize-none"
        />
      </div>

      <Button 
        type="submit" 
        size="lg" 
        className="w-full bg-dna-emerald hover:bg-dna-forest text-white py-3 text-base font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending...' : 'Stay Notified'}
      </Button>
    </form>
  );
};

export default NotificationForm;
