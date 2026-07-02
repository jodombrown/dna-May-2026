
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { X, CheckCircle, Users, Target, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pageType: 'connect' | 'collaborate' | 'contribute' | 'convene' | 'convey';
}

const FeedbackPanel = ({ isOpen, onClose, pageType }: FeedbackPanelProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    linkedin: '',
    recommendations: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageContent = {
    connect: {
      title: 'Propose a New Connection Initiative',
      description: 'Help us build the ultimate networking experience for the African diaspora',
      guide: [
        'Identify gaps in our current networking features',
        'Suggest new ways for professionals to discover each other',
        'Propose community-building activities or events',
        'Share ideas for better matching algorithms',
        'Recommend integration with existing professional platforms'
      ],
      icon: Users
    },
    collaborate: {
      title: 'Propose a New Collaboration Project',
      description: 'Share your vision for impactful projects that unite the diaspora',
      guide: [
        'Define the problem your project would solve',
        'Identify potential collaborators and their expertise',
        'Outline the expected impact across African communities',
        'Suggest funding strategies and resource requirements',
        'Propose timeline and key milestones for implementation'
      ],
      icon: Target
    },
    contribute: {
      title: 'Propose a New Contribution Method',
      description: 'Help us create more ways for people to give back to Africa',
      guide: [
        'Identify new forms of contribution beyond financial',
        'Suggest skill-sharing or mentorship programs',
        'Propose educational or capacity-building initiatives',
        'Recommend partnerships with African organizations',
        'Share ideas for measuring and showcasing impact'
      ],
      icon: CheckCircle
    },
    convene: {
      title: 'Propose a New Event or Gathering',
      description: 'Help us create better diaspora gatherings and networking events',
      guide: [
        'Suggest event formats that foster meaningful connections',
        'Identify topics or themes the diaspora cares about',
        'Propose virtual, hybrid, or in-person event ideas',
        'Share ideas for post-event engagement and follow-up',
        'Recommend partnerships with event organizers or venues'
      ],
      icon: Users
    },
    convey: {
      title: 'Propose a New Impact Story Format',
      description: 'Help us better amplify and share diaspora success stories',
      guide: [
        'Suggest new ways to showcase diaspora achievements',
        'Identify story formats that inspire action',
        'Propose platforms or channels for wider distribution',
        'Share ideas for measuring story impact and reach',
        'Recommend ways to encourage more story submissions'
      ],
      icon: MessageSquare
    }
  };

  const content = pageContent[pageType];
  const IconComponent = content.icon;

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
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const message = `Feedback for ${pageType} page:\n\n${formData.recommendations || 'No specific recommendations provided.'}`;

      const { data, error } = await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'feedback',
          formData: {
            name: fullName,
            email: formData.email,
            pageType: pageType,
            feedback: formData.recommendations,
            linkedin_url: formData.linkedin
          },
          userEmail: formData.email
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success('Thank you for your feedback! We\'ve received your suggestions and will be in touch soon.');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          linkedin: '',
          recommendations: ''
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
              <IconComponent className="w-6 h-6 text-dna-emerald" />
            </div>
            <Badge className="bg-dna-copper text-white">
              Platform Preview
            </Badge>
          </div>
          <SheetTitle className="text-2xl text-neutral-900">{content.title}</SheetTitle>
          <SheetDescription className="text-base text-neutral-600">
            {content.description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          <div className="bg-gradient-to-r from-dna-emerald/5 to-dna-copper/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-dna-emerald" />
              How We Envision This Working
            </h3>
            <div className="space-y-3">
              {content.guide.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-dna-emerald text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-neutral-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Help Us Build Better
            </h3>
            <p className="text-neutral-600 mb-6">
              We're always looking for suggestions and ideas on how to improve. Share your thoughts with us as we build this platform together.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  maxLength={254}
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
                <Label htmlFor="recommendations" className="text-sm font-medium text-neutral-700">
                  Your Recommendations & Suggestions
                </Label>
                <Textarea
                  id="recommendations"
                  placeholder="Share your ideas, suggestions, or recommendations for how we can improve this feature or the platform overall..."
                  value={formData.recommendations}
                  onChange={(e) => handleInputChange('recommendations', e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {formData.recommendations.length}/1000 characters
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  variant="default"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Sending...' : 'Share Your Ideas'}
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
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FeedbackPanel;
