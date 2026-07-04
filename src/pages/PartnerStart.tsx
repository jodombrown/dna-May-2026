import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { onboardingSteps } from '@/config/partnerContent';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import ComprehensiveLocationInput from '@/components/ui/comprehensive-location-input';

const PartnerStart = () => {
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    location: '',
    sector: '',
    interest: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    trackEvent('partner_form_submitted', { 
      sector: formData.sector,
      page: 'partner-start'
    });
    
    // Create mailto body
    const mailtoBody = `
Partnership Inquiry from ${formData.organization}

Name: ${formData.name}
Organization: ${formData.organization}
Email: ${formData.email}
Location: ${formData.location || 'Not specified'}
Sector: ${formData.sector}

What they're interested in:
${formData.interest}
    `.trim();
    
    // Open mailto link
    window.location.href = `mailto:aweh@diasporanetwork.africa,jaune@diasporanetwork.africa?subject=DNA Partnership Inquiry - ${formData.organization}&body=${encodeURIComponent(mailtoBody)}`;
    
    toast({
      title: 'Thank you for your interest!',
      description: 'Your email client should open. Our team will reach out within 2 business days.',
    });
    
    // Reset form
    setFormData({
      name: '',
      organization: '',
      email: '',
      location: '',
      sector: '',
      interest: ''
    });
  };

  const handleCTAClick = (ctaType: string, href?: string) => {
    trackEvent('partner_page_cta_clicked', { 
      cta_name: ctaType,
      page: 'partner-start'
    });
    if (href) {
      if (href.startsWith('#')) {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      } else if (href.startsWith('/')) {
        navigate(href);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-mint/10 via-background to-dna-copper/10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Start Your Partnership Journey
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            From exploration to co-design, here's how we build together.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Your Partnership Path
          </h2>
          <div className="space-y-8">
            {onboardingSteps.map((step) => (
              <div 
                key={step.number} 
                className="flex gap-6 p-6 bg-card border border-border rounded-lg hover:border-dna-emerald transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-dna-emerald to-dna-copper rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick CTAs */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-mint/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <EnhancedButton 
              variant="dna" 
              size="lg" 
              className="w-full"
              onClick={() => handleCTAClick('get-started', '#form')}
            >
              Get Started
            </EnhancedButton>
            <EnhancedButton 
              variant="dna-outline" 
              size="lg" 
              className="w-full"
              onClick={() => handleCTAClick('request-meeting', '#call')}
            >
              Request a Meeting
            </EnhancedButton>
            <EnhancedButton 
              variant="outline" 
              size="lg" 
              className="w-full"
              asChild
              onClick={() => handleCTAClick('join-dna', '/auth?mode=signup')}
            >
              <Link to="/auth?mode=signup">Sign Up</Link>
            </EnhancedButton>
          </div>
        </div>
      </section>

      {/* Partnership Form */}
      <section id="form" className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">
            Partnership Inquiry Form
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Tell us about your organization and what you're hoping to accomplish.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-card border border-border rounded-lg">
            <div>
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <Label htmlFor="organization">Organization *</Label>
              <Input
                id="organization"
                required
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="Your organization name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane@organization.com"
              />
            </div>

            <ComprehensiveLocationInput
              id="location"
              label="Location"
              value={formData.location}
              onChange={(value) => setFormData({ ...formData, location: value })}
              placeholder="City, State/Province, Country"
              required={false}
            />

            <div>
              <Label htmlFor="sector">Sector *</Label>
              <select
                id="sector"
                required
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Select a sector</option>
                <option value="public-sector">Public Sector & Economic Development</option>
                <option value="private-industry">Private Industry</option>
                <option value="hbcus">HBCUs</option>
                <option value="global-universities">Global Universities</option>
                <option value="ngos-civil-society">NGOs & Civil Society</option>
                <option value="innovation-ecosystems">Innovation Ecosystems</option>
                <option value="investors">Investors</option>
                <option value="multilaterals-sdg">UN / SDG & Multilaterals</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="interest">What are you interested in? *</Label>
              <Textarea
                id="interest"
                required
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                placeholder="Tell us about your goals and how you'd like to partner with DNA..."
                rows={6}
              />
            </div>

            <EnhancedButton type="submit" variant="dna" size="lg" className="w-full">
              Submit Partnership Inquiry
            </EnhancedButton>
          </form>
        </div>
      </section>

      {/* Meeting CTA */}
      <section id="call" className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dna-emerald/10 via-background to-dna-copper/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prefer to Talk First?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Book a 30-minute call with our partnerships team to explore opportunities.
          </p>
          <EnhancedButton 
            variant="dna" 
            size="lg"
            onClick={() => handleCTAClick('book-call', 'mailto:aweh@diasporanetwork.africa,jaune@diasporanetwork.africa?subject=Partnership%20Call%20Request')}
          >
            Request a Partnership Call
          </EnhancedButton>
          <p className="text-sm text-muted-foreground mt-4">
            Or email us directly at aweh@diasporanetwork.africa
          </p>
        </div>
      </section>
    </div>
  );
};

export default PartnerStart;
