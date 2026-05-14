
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchFeedbackFormProps {
  onClose: () => void;
}

const SearchFeedbackForm: React.FC<SearchFeedbackFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    linkedin_url: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in your name and email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'feedback',
          formData: {
            name: formData.name,
            email: formData.email,
            linkedin_url: formData.linkedin_url,
            feedback: formData.message || 'User provided feedback about advanced search features.',
            pageType: 'Advanced Search Features'
          },
          userEmail: formData.email
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Thank you for your feedback! We\'ve sent you a confirmation email.');
        setFormData({ name: '', email: '', linkedin_url: '', message: '' });
        onClose();
      } else {
        throw new Error(data?.error || 'Failed to send feedback');
      }
    } catch (error: unknown) {
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t pt-6">
      <h3 className="font-semibold text-dna-forest mb-4 flex items-center gap-2">
        <GraduationCap className="w-4 h-4" />
        Help Shape Our Search Experience
      </h3>
      <p className="text-sm text-neutral-600 mb-4">
        Tell us what search features matter most to you:
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
              disabled={isSubmitting}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
              disabled={isSubmitting}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url" className="text-sm font-medium">
              LinkedIn URL (Optional)
            </Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/yourprofile"
              disabled={isSubmitting}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              What search features do you need most?
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Tell us about the search capabilities that would help you connect with the right professionals..."
              rows={3}
              className="resize-none mt-1"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            type="submit" 
            className="flex-1 bg-dna-emerald hover:bg-dna-forest text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Share Feedback'}
          </Button>
          <Button 
            type="button"
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Maybe Later
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchFeedbackForm;
