import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { config } from '@/lib/config';
import { Mail, Users, Globe, Heart, Calendar, MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import ComprehensiveLocationInput from '@/components/ui/comprehensive-location-input';
import { Link } from 'react-router-dom';
import { MateMasie } from '@/components/icons/adinkra';

const Waitlist = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please provide a valid email address.",
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
        });

      if (error) {
        // Check for duplicate email
        if (error.code === '23505') {
          toast({
            title: "Already on Waitlist",
            description: "This email is already registered on our waitlist!",
            variant: "default",
          });
          setIsSuccess(true);
          return;
        }
        throw error;
      }

      // Send notification emails (admin + user confirmation)
      await supabase.functions.invoke('send-universal-email', {
        body: {
          formType: 'waitlist_signup',
          formData: {
            name: formData.full_name,
            email: formData.email,
            full_name: formData.full_name,
            location: formData.location
          },
          userEmail: formData.email
        }
      });

      // Store that user has joined waitlist
      localStorage.setItem('dna_waitlist_joined', 'true');
      
      setIsSuccess(true);
      toast({
        title: "Welcome to the Waitlist!",
        description: "Check your email for confirmation.",
      });
    } catch (error: unknown) {
      console.error('Waitlist signup error:', error);
      toast({
        title: "Error",
        description: "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Users,
      title: "Early Access",
      description: "Be among the first to connect with 200M+ global diaspora members"
    },
    {
      icon: Calendar,
      title: "Exclusive Events",
      description: "Get invited to virtual and in-person diaspora gatherings"
    },
    {
      icon: Globe,
      title: "Shape the Platform",
      description: "Your feedback will directly influence DNA's development"
    },
    {
      icon: Heart,
      title: "Community First",
      description: "Join a movement building Africa's future together"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Join the Waitlist | DNA - Diaspora Network of Africa</title>
        <meta name="description" content="Join the DNA waitlist and be the first to connect with the global African diaspora. Get early access to the platform transforming how we collaborate for Africa's future." />
        <meta property="og:title" content="Join the DNA Waitlist" />
        <meta property="og:description" content="Be the first to connect with 200M+ global diaspora members. Join the movement building Africa's future together." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${config.APP_URL}/waitlist`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                  <span>Building Together</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                  Join the 
                  <span className="text-primary block">DNA Movement</span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                  The Diaspora Network of Africa is building the operating system for mobilizing 
                  200M+ diaspora members toward Africa's economic transformation.
                </p>

                {/* Benefits Grid - Mobile */}
                <div className="grid grid-cols-2 gap-4 lg:hidden mb-8">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex flex-col items-center text-center p-4 bg-card/50 rounded-xl border border-border/50">
                      <benefit.icon className="h-8 w-8 text-primary mb-2" />
                      <h3 className="font-semibold text-sm text-foreground">{benefit.title}</h3>
                    </div>
                  ))}
                </div>

                {/* Benefits List - Desktop */}
                <div className="hidden lg:grid gap-4 mb-8">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-card/30 rounded-xl border border-border/30 hover:bg-card/50 transition-colors">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Form */}
              <div className="lg:pl-8">
                <div className="bg-card rounded-lg shadow-xl border border-border p-6 sm:p-8">
                  {isSuccess ? (
                    /* Success State */
                    <div className="text-center py-8">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-4">
                        You're on the List!
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        Check your inbox for a confirmation email. We'll notify you as soon as DNA is ready for you.
                      </p>
                      <div className="space-y-3">
                        <Button 
                          onClick={() => navigate('/')}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          Explore DNA
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsSuccess(false);
                            setFormData({ full_name: '', email: '', location: '' });
                          }}
                          className="w-full"
                        >
                          Refer a Friend
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Form */
                    <>
                      <div className="text-center mb-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4">
                          <MateMasie className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">
                          Join the Waitlist
                        </h2>
                        <p className="text-muted-foreground mt-2">
                          Be first in line when we launch
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                          <Label htmlFor="full_name" className="flex items-center gap-2 mb-2 text-foreground">
                            <Users className="h-4 w-4 text-primary" />
                            Full Name *
                          </Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            placeholder="Your full name"
                            required
                            className="w-full h-12"
                          />
                        </div>

                        <div>
                          <Label htmlFor="email" className="flex items-center gap-2 mb-2 text-foreground">
                            <Mail className="h-4 w-4 text-primary" />
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="your.email@example.com"
                            required
                            className="w-full h-12"
                          />
                        </div>

                        <ComprehensiveLocationInput
                          id="location"
                          label="Location"
                          value={formData.location}
                          onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                          placeholder="City, Country"
                          required={false}
                          icon={true}
                        />

                        <Button 
                          type="submit" 
                          className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold text-lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin mr-2">⟳</span>
                              Joining...
                            </>
                          ) : (
                            <>
                              Join the Waitlist
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </form>

                      <p className="text-xs text-muted-foreground text-center mt-6">
                        We respect your privacy. Your information will only be used to notify you about DNA updates.
                      </p>
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have access?{' '}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Waitlist;
