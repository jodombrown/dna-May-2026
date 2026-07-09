// src/components/hubs/shared/HostApplicationModal.tsx
// Modal for host/creator applications

import React, { useState } from 'react';
import { MateMasie } from '@/components/icons/adinkra';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { submitHostApplication, HubType } from '@/services/hubNotifications';
import { toast } from 'sonner';

interface HostApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  hub: HubType;
}

export function HostApplicationModal({
  isOpen,
  onClose,
  hub
}: HostApplicationModalProps) {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : '',
    email: user?.email || '',
    organization: '',
    concept: '',
    audienceSize: '',
    experience: ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.concept) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    const result = await submitHostApplication({
      hub,
      email: formData.email,
      userId: user?.id,
      name: formData.name,
      organization: formData.organization || undefined,
      concept: formData.concept,
      audience_size: formData.audienceSize || undefined,
      experience: formData.experience || undefined
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      toast.success('Application submitted successfully!');
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({
          name: '',
          email: user?.email || '',
          organization: '',
          concept: '',
          audienceSize: '',
          experience: ''
        });
      }, 2500);
    } else {
      toast.error(result.error || 'Failed to submit application');
    }
  };

  const getHubConfig = () => {
    const configs: Record<HubType, {
      title: string;
      description: string;
      conceptLabel: string;
      conceptPlaceholder: string;
    }> = {
      convene: {
        title: 'Apply to Host an Event',
        description: 'Share your vision for bringing the diaspora together. We review applications weekly.',
        conceptLabel: 'Event Concept',
        conceptPlaceholder: 'Describe the event you want to host, its format, and what makes it unique...'
      },
      collaborate: {
        title: 'Propose a Space',
        description: 'Tell us about the collaborative space you want to create. We help bring great ideas to life.',
        conceptLabel: 'Space Concept',
        conceptPlaceholder: 'Describe the space you want to create, its goals, and who it would bring together...'
      },
      contribute: {
        title: 'Post an Opportunity Early',
        description: 'Be among the first to list an opportunity on the DNA marketplace.',
        conceptLabel: 'Opportunity Description',
        conceptPlaceholder: 'Describe what you want to offer or what you need from the community...'
      },
      convey: {
        title: 'Apply for Early Creator Access',
        description: 'Join our early creator program and help shape how stories are shared on DNA.',
        conceptLabel: 'Content Vision',
        conceptPlaceholder: 'What stories would you tell? What topics would you cover? Share your vision...'
      }
    };
    return configs[hub];
  };

  const config = getHubConfig();

  if (isSuccess) {
    return (
      <ResponsiveModal open={isOpen} onOpenChange={onClose} className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-dna-emerald mb-4" />
            <h3 className="text-xl font-semibold mb-2">Application Received!</h3>
            <p className="text-muted-foreground">
              We'll review your application and get back to you soon.
            </p>
          </div>
        </ResponsiveModal>
    );
  }

  return (
    <ResponsiveModal open={isOpen} onOpenChange={onClose} className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <MateMasie className="w-5 h-5 text-dna-copper" />
            {config.title}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {config.description}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="app-email">Email Address *</Label>
            <Input
              id="app-email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              disabled={!!user?.email}
            />
          </div>

          {/* Organization */}
          <div className="space-y-2">
            <Label htmlFor="organization">Organization (optional)</Label>
            <Input
              id="organization"
              type="text"
              placeholder="Company, community, or project name"
              value={formData.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
            />
          </div>

          {/* Concept */}
          <div className="space-y-2">
            <Label htmlFor="concept">{config.conceptLabel} *</Label>
            <Textarea
              id="concept"
              placeholder={config.conceptPlaceholder}
              value={formData.concept}
              onChange={(e) => handleChange('concept', e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Audience Size */}
          <div className="space-y-2">
            <Label htmlFor="audienceSize">Expected Audience/Team Size</Label>
            <Select
              value={formData.audienceSize}
              onValueChange={(value) => handleChange('audienceSize', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 people</SelectItem>
                <SelectItem value="11-50">11-50 people</SelectItem>
                <SelectItem value="51-100">51-100 people</SelectItem>
                <SelectItem value="100+">100+ people</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Relevant Experience (optional)</Label>
            <Textarea
              id="experience"
              placeholder="Tell us about your background or previous experience..."
              value={formData.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-dna-emerald hover:bg-dna-emerald/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <MateMasie className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            We typically respond within 5 business days.
          </p>
        </form>
      </ResponsiveModal>
  );
}

export default HostApplicationModal;
