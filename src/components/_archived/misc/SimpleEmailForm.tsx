
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeText, isValidLinkedInUrl, isRateLimited } from '@/utils/validation';
import { getGenericErrorMessage } from '@/utils/errorHandling';

const SimpleEmailForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    linkedin_url: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    if (isRateLimited(lastSubmission, 5000)) {
      toast({
        title: "Too Many Requests",
        description: "Please wait a moment before submitting again",
        variant: "destructive",
      });
      return;
    }

    // Sanitize and validate inputs
    const sanitizedName = sanitizeText(formData.name.trim());
    const sanitizedEmail = sanitizeText(formData.email.trim());
    const sanitizedMessage = sanitizeText(formData.message);
    const sanitizedLinkedIn = sanitizeText(formData.linkedin_url);

    if (!sanitizedName || !sanitizedEmail) {
      toast({
        title: "Validation Error",
        description: "Please fill in your name and email",
        variant: "destructive",
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(sanitizedEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (sanitizedLinkedIn && !isValidLinkedInUrl(sanitizedLinkedIn)) {
      toast({
        title: "Invalid LinkedIn URL",
        description: "Please enter a valid LinkedIn profile URL",
        variant: "destructive",
      });
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
            message: sanitizedMessage || 'I would like to join the DNA platform.',
            linkedin_url: sanitizedLinkedIn
          },
          userEmail: sanitizedEmail
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success!",
          description: "Thank you! We've sent you a confirmation email.",
        });
        setFormData({ name: '', email: '', linkedin_url: '', message: '' });
      } else {
        throw new Error(data?.error || 'Failed to send email');
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getGenericErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-dna-mint/20 p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-dna-forest mb-4">
              Ready to Join the Movement?
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Be the first to connect with Africa's diaspora professionals when we launch our revolutionary platform
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6" data-email-form>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                  Full Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  disabled={isSubmitting}
                  className="border-dna-mint/30 focus:border-dna-emerald focus:ring-dna-emerald"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  required
                  disabled={isSubmitting}
                  className="border-dna-mint/30 focus:border-dna-emerald focus:ring-dna-emerald"
                />
              </div>
            </div>

            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-medium text-neutral-700 mb-2">
                LinkedIn URL (Optional)
              </label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/yourprofile"
                disabled={isSubmitting}
                className="border-dna-mint/30 focus:border-dna-emerald focus:ring-dna-emerald"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-2">
                Message (Optional)
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Tell us about your background and how you'd like to contribute..."
                rows={4}
                disabled={isSubmitting}
                className="resize-none border-dna-mint/30 focus:border-dna-emerald focus:ring-dna-emerald"
              />
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-gradient-to-r from-dna-emerald to-dna-forest hover:from-dna-forest hover:to-dna-emerald text-white py-4 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Join DNA'}
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            We respect your privacy. Your information will only be used to notify you about our platform launch. 
            During the Prototyping and Building Phase, emails will come from our mother company{' '}
            <a 
              href="https://www.Roadmap.Africa" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-dna-emerald hover:text-dna-forest underline"
            >
              Roadmap.Africa
            </a>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SimpleEmailForm;
