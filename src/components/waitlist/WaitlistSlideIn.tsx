import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Users } from 'lucide-react';
import ComprehensiveLocationInput from '@/components/ui/comprehensive-location-input';
import { MateMasie } from '@/components/icons/adinkra';

interface WaitlistSlideInProps {
  children: React.ReactNode;
}

const WaitlistSlideIn: React.FC<WaitlistSlideInProps> = ({ children }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert into waitlist_signups table
      const { error } = await supabase
        .from('waitlist_signups')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          location: formData.location || null,
          role: 'individual',
          status: 'pending'
        });

      if (error) throw error;

      // Send notification email
      await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'waitlist_signup',
          formData: formData,
          userEmail: formData.email
        }
      });

      toast({
        title: "Welcome to the Waitlist!",
        description: "You'll be the first to know when DNA launches. Check your email for confirmation.",
      });

      // Store that user has joined waitlist
      localStorage.setItem('dna_waitlist_joined', 'true');
      
      setIsOpen(false);
      setFormData({ full_name: '', email: '', location: '' });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-center space-y-4 mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-dna-emerald to-dna-copper rounded-full flex items-center justify-center animate-pulse">
            <MateMasie className="h-8 w-8 text-white" />
          </div>
          <SheetTitle className="text-2xl font-bold text-dna-forest">
            Join the DNA Waitlist
          </SheetTitle>
          <p className="text-neutral-600 text-sm leading-relaxed">
            Be the first to connect with the global African diaspora. Get early access 
            to our platform and help shape the future of diaspora collaboration.
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="slide_full_name" className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-dna-emerald" />
              Full Name *
            </Label>
            <Input
              id="slide_full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Your full name"
              required
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="slide_email" className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-dna-emerald" />
              Email Address *
            </Label>
            <Input
              id="slide_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your.email@example.com"
              required
              className="w-full"
            />
          </div>

          <ComprehensiveLocationInput
            id="slide_location"
            label="Location"
            value={formData.location}
            onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
            placeholder="City, State/Province, Country"
            required={false}
            icon={true}
          />

          <div className="bg-gradient-to-br from-dna-emerald/10 to-dna-copper/10 p-4 rounded-lg border border-dna-emerald/20">
            <h4 className="font-semibold text-dna-forest mb-3 flex items-center gap-2">
              <MateMasie className="h-4 w-4" />
              What you'll get:
            </h4>
            <ul className="text-sm text-neutral-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-dna-emerald rounded-full mt-2 flex-shrink-0"></span>
                Early access to the DNA platform
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-dna-emerald rounded-full mt-2 flex-shrink-0"></span>
                Updates on platform development
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-dna-emerald rounded-full mt-2 flex-shrink-0"></span>
                Exclusive community events
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-dna-emerald rounded-full mt-2 flex-shrink-0"></span>
                Shape the future of diaspora networking
              </li>
            </ul>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-dna-emerald to-dna-copper hover:from-dna-forest hover:to-dna-gold text-white py-3 text-lg font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </Button>
        </form>

        <p className="text-xs text-neutral-500 text-center mt-6">
          We respect your privacy. Your information will only be used to notify you about DNA platform updates.
        </p>
      </SheetContent>
    </Sheet>
  );
};

export default WaitlistSlideIn;