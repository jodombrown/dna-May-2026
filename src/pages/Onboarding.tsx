import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOnboardingForm } from '@/components/onboarding/hooks/useOnboardingForm';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';
import UserTypeStep from '@/components/onboarding/steps/UserTypeStep';
import IdentityStep from '@/components/onboarding/steps/IdentityStep';
import DiasporaOriginStep from '@/components/onboarding/steps/DiasporaOriginStep';
import DiscoveryStep from '@/components/onboarding/steps/DiscoveryStep';
import UsernameStep from '@/components/onboarding/steps/UsernameStep';
import RoleDeclarationStep, { type DnaIdentityRole } from '@/components/onboarding/RoleDeclarationStep';
import PlaceDeclarationStep from '@/components/onboarding/PlaceDeclarationStep';
import type { ContinentCode } from '@/data/continentCountries';
import { validateStep } from '@/components/onboarding/validation/onboardingStepValidation';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getErrorMessage } from '@/lib/errorLogger';

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  'How are you joining?',
  'Basic Identity',
  'Connection to Africa',
  'Your Interests & Goals',
  'Claim Your Username',
  'Declare Your Role',
  'Where You Are',
];

const Onboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with any existing profile data
  const { formData, updateField } = useOnboardingForm({
    user_type: ((profile as any)?.user_type as any) || 'individual',
    first_name: profile?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
    last_name: profile?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    avatar_url: profile?.avatar_url || user?.user_metadata?.picture || '',
    current_country: profile?.current_country || '',
    headline: profile?.headline || '',
    username: profile?.username || '',
    country_of_origin: profile?.country_of_origin || '',
    diaspora_status: profile?.diaspora_status || '',
    // Deferred fields - kept for profile completion later
    profession: profile?.profession || '',
    professional_role: profile?.professional_role || '',
    professional_sectors: profile?.professional_sectors || [],
    skills: profile?.skills || [],
    years_experience: profile?.years_experience?.toString() || '',
    interests: profile?.interests || [],
    my_dna_statement: profile?.my_dna_statement || '',
    focus_areas: profile?.focus_areas || [],
    regional_expertise: profile?.regional_expertise || [],
    industries: profile?.industries || [],
    engagement_intentions: profile?.engagement_intentions || [],
  });

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // If profile already has onboarding_completed_at, redirect to dashboard
  useEffect(() => {
    if (profile?.onboarding_completed_at) {
      navigate('/dna/feed');
    }
  }, [profile, navigate]);

  const handleNext = async () => {
    // Validate current step
    const validationErrors = validateStep(currentStep, formData);
    
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      
      toast({
        title: "Please complete required fields",
        description: validationErrors[0].message,
        variant: "destructive"
      });
      return;
    }

    // Clear errors
    setErrors({});

    // If not on last step, advance
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // On final step (username), submit and go to feed
    await handleSubmit();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();

      // Prepare profile data - only include fields that exist in DB
      const profileData: any = {
        id: user.id,
        email: user.email,
        full_name: fullName,
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        avatar_url: formData.avatar_url,
        current_country: formData.current_country,
        headline: formData.headline || null,
        user_type: formData.user_type || 'individual',
        profession: formData.profession || null,
        professional_role: formData.professional_role || null,
        professional_sectors: formData.professional_sectors || [],
        skills: formData.skills || [],
        years_experience: formData.years_experience ? parseInt(formData.years_experience.split('-')[0]) : null,
        country_of_origin: formData.country_of_origin,
        diaspora_status: formData.diaspora_status || null,
        interests: formData.interests || [],
        my_dna_statement: formData.my_dna_statement || null,
        focus_areas: formData.focus_areas || [],
        regional_expertise: formData.regional_expertise || [],
        industries: formData.industries || [],
        engagement_intentions: formData.engagement_intentions || [],
        is_public: true,
        updated_at: new Date().toISOString()
      };

      // Upsert profile
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert([profileData], { onConflict: 'id' });

      if (upsertError) {
        if (upsertError.code === '23505') {
          toast({
            title: "Username Taken",
            description: "This username was just taken. Please go back and choose a different one.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          setCurrentStep(3); // Go back to username step
          return;
        } else {
          throw upsertError;
        }
      }

      // Wait for DB to commit
      await new Promise(resolve => setTimeout(resolve, 300));

      // Calculate profile completion percentage
      const { data: completionData, error: completionError } = await supabase
        .rpc('calculate_profile_completion_percentage', { profile_id: user.id });

      // Mark onboarding as complete
      const { error: completeError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (completeError) throw completeError;

      // Refresh profile
      await refreshProfile();

      // 🎉 CONFETTI CELEBRATION!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#C87533', '#2F5233', '#3D8B40', '#FFD700']
      });

      toast({
        title: "🎉 Welcome to DNA!",
        description: `You're all set, @${formData.username}! Let's connect with the diaspora.`,
      });

      // Go to feed after celebration
      setTimeout(() => {
        navigate('/dna/feed');
      }, 1800);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error) || "Failed to complete onboarding. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  // Calculate estimated completion based on current step
  const estimateCompletion = () => {
    return Math.round(((currentStep + 1) / TOTAL_STEPS) * 100);
  };

  const currentStepComponent = () => {
    switch (currentStep) {
      case 0:
        return (
          <UserTypeStep
            data={{
              user_type: formData.user_type,
              organization_name: '',
              organization_category: '',
            }}
            onUpdate={(field, value) => updateField(field as any, value)}
            errors={errors}
          />
        );
      case 1:
        return (
          <IdentityStep
            data={formData}
            onUpdate={updateField}
            errors={errors}
          />
        );
      case 2:
        return (
          <DiasporaOriginStep
            data={{
              country_of_origin: formData.country_of_origin,
              diaspora_status: formData.diaspora_status,
            }}
            onUpdate={(field, value) => updateField(field as any, value)}
            errors={errors}
          />
        );
      case 3:
        return (
          <DiscoveryStep
            data={{
              focus_areas: formData.focus_areas,
              regional_expertise: formData.regional_expertise,
              industries: formData.industries,
              engagement_intentions: formData.engagement_intentions,
            }}
            onUpdate={(field, value) => updateField(field as any, value)}
          />
        );
      case 4:
        return (
          <UsernameStep
            data={{
              full_name: `${formData.first_name} ${formData.last_name}`,
              username: formData.username,
              country_of_origin: formData.country_of_origin,
              current_country: formData.current_country,
              industry: formData.profession,
            }}
            updateData={(updates) => {
              Object.entries(updates).forEach(([key, value]) => {
                updateField(key as any, value);
              });
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dna-mint/20 via-background to-dna-emerald/10">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <OnboardingProgressBar
            currentStep={currentStep + 1}
            totalSteps={TOTAL_STEPS}
            completionPercentage={estimateCompletion()}
          />
          <p className="text-center text-xs text-muted-foreground mt-2">
            Step {currentStep + 1} of {TOTAL_STEPS}: {STEP_TITLES[currentStep]}
          </p>
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {currentStepComponent()}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-0">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="bg-dna-copper hover:bg-dna-gold text-white flex items-center justify-center gap-2 px-6 min-h-[44px] w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : currentStep === TOTAL_STEPS - 1 ? (
              "Complete & Join DNA 🎉"
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;