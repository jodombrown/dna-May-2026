import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMobile';
import { supabase } from '@/integrations/supabase/client';
import LocationAutocomplete from '@/components/ui/location-autocomplete';
import PrivacyPolicyModal from '@/components/legal/PrivacyPolicyModal';
import TermsOfServiceModal from '@/components/legal/TermsOfServiceModal';

interface WaitlistPopupProps {
  isOpen: boolean;
  onClose: () => void;
  scrollProgress?: number;
}

const WaitlistPopup: React.FC<WaitlistPopupProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.location) {
      toast({
        title: "Please fill in all fields",
        description: "All fields are required to join the waitlist.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit directly to Supabase with correct field mapping
      const { error } = await supabase
        .from('waitlist_signups')
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          location: formData.location,
          role: 'individual',
          status: 'pending'
        }]);

      if (error) {
        throw error;
      }

      // Send notification email (optional - won't fail if it doesn't work)
      try {
        await supabase.functions.invoke('send-universal-email', {
          body: {
            formType: 'waitlist',
            formData: {
              name: formData.fullName,
              email: formData.email,
              location: formData.location
            },
            userEmail: formData.email
          }
        });
      } catch (emailError) {
        // Don't fail the whole process if email fails
      }

      toast({
        title: "Welcome to DNA!",
        description: "You're in! We'll reach out with updates as the beta launches.",
      });

      // Store that user has joined waitlist to avoid showing popup again
      localStorage.setItem('dna_waitlist_joined', 'true');
      
      onClose();
      setFormData({ fullName: '', email: '', location: '' });
    } catch (error: unknown) {
      toast({
        title: "Something went wrong",
        description: "Please try again later or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative ${
        isMobile 
          ? "w-[90vw] max-w-[340px] mx-2" 
          : "max-w-lg w-full mx-4"
        } bg-white rounded-xl border-2 border-neutral-200/50 max-h-[90vh] overflow-y-auto animate-scale-in`}
        style={{
          boxShadow: `
            0 32px 64px -12px rgba(0, 0, 0, 0.4),
            0 18px 36px -18px rgba(0, 0, 0, 0.3),
            0 8px 16px -8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1),
            inset 1px 0 0 rgba(255, 255, 255, 0.3),
            inset -1px 0 0 rgba(0, 0, 0, 0.05)
          `,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
        }}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-neutral-100 hover:bg-dna-emerald/10 transition-colors duration-200 group"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-neutral-500 group-hover:text-dna-emerald transition-colors duration-200" />
        </button>

        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dna-emerald/10 via-dna-copper/5 to-dna-gold/10 rounded-lg"></div>
        
        {/* Content */}
        <div className="relative z-10 p-6 pr-8">
          <div className="text-center space-y-3 mb-6">
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-dna-forest`}>
              Join the DNA Beta Waitlist
            </h2>
            <p className={`text-neutral-600 ${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed`}>
              Be among the first to connect, collaborate, and contribute with Africa's global diaspora.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={`space-y-${isMobile ? '3' : '4'}`}>
            <div>
              <Label htmlFor="fullName" className={`${isMobile ? 'text-sm' : ''}`}>
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Your first and last name"
                required
                className={isMobile ? 'text-sm' : ''}
              />
            </div>

            <div>
              <Label htmlFor="email" className={`${isMobile ? 'text-sm' : ''}`}>
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                required
                className={isMobile ? 'text-sm' : ''}
              />
            </div>

            <LocationAutocomplete
              id="location"
              value={formData.location}
              onSelect={(sel) => setFormData(prev => ({ ...prev, location: sel.label }))}
              placeholder="Start typing your city..."
              required
              className={isMobile ? 'text-sm' : ''}
            />

            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-3'} ${isMobile ? 'pt-3' : 'pt-4'}`}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className={`${isMobile ? 'w-full text-sm py-2' : 'flex-1'}`}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className={`${isMobile ? 'w-full text-sm py-2' : 'flex-1'} bg-gradient-to-r from-dna-emerald to-dna-copper hover:from-dna-forest hover:to-dna-gold text-white`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
              </Button>
            </div>
          </form>

          <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-neutral-500 text-center ${isMobile ? 'mt-3' : 'mt-4'}`}>
            We respect your{' '}
            <button 
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-dna-emerald hover:text-dna-forest underline hover:no-underline transition-colors duration-200"
            >
              privacy
            </button>
            . Your information will only be used to notify you about DNA platform updates.
            <br />
            By joining, you agree to our{' '}
            <button 
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-dna-emerald hover:text-dna-forest underline hover:no-underline transition-colors duration-200"
            >
              Terms of Service
            </button>
            .
          </p>
        </div>
      </div>

      {/* Legal Modals */}
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />
      <TermsOfServiceModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </div>
  );
};

export default WaitlistPopup;