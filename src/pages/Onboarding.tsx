import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOnboardingForm } from '@/components/onboarding/hooks/useOnboardingForm';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';
import IdentityStep from '@/components/onboarding/steps/IdentityStep';
import DiscoveryStep from '@/components/onboarding/steps/DiscoveryStep';
import UsernameStep from '@/components/onboarding/steps/UsernameStep';
import RoleDeclarationStep, { type DnaIdentityRole } from '@/components/onboarding/RoleDeclarationStep';
import PlaceDeclarationStep from '@/components/onboarding/PlaceDeclarationStep';
import type { ContinentCode } from '@/data/continentCountries';
import { isValidAlpha3, getCountryNameByAlpha3 } from '@/lib/dna-place';
import { validateStep } from '@/components/onboarding/validation/onboardingStepValidation';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getErrorMessage } from '@/lib/errorLogger';
import { upsertPrimaryOrigin } from '@/lib/memberHeritage';

const TOTAL_STEPS = 5;

const STEP_TITLES = [
  'Basic Identity',
  'Your Interests & Goals',
  'Claim Your Username',
  'Declare Your Role',
  'Where You Are',
];

const Onboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Read ?step= param so OnboardingGuard can route existing users straight
  // into Step 4 (role) or Step 5 (place) per D054/BD008.
  const initialStep = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = parseInt(params.get('step') || '', 10);
    if (!Number.isNaN(raw) && raw >= 1 && raw <= TOTAL_STEPS) return raw - 1;
    return 0;
  }, [location.search]);

  const profileAny = profile as any;
  const alreadyCompleted = !!profileAny?.onboarding_completed_at;
  const partialMode = alreadyCompleted && initialStep >= 3;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // D054 fields - tracked outside useOnboardingForm so we don't touch its shape.
  const [role, setRole] = useState<DnaIdentityRole | ''>(
    (profileAny?.role as DnaIdentityRole | undefined) || ''
  );
  const [continentCode, setContinentCode] = useState<ContinentCode | ''>(
    (profileAny?.continent as ContinentCode | undefined) || ''
  );
  const [countryCode, setCountryCode] = useState<string>(profileAny?.country || '');

  // Initialize form with any existing profile data
  const { formData, updateField } = useOnboardingForm({
    first_name: profile?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
    last_name: profile?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    avatar_url: profile?.avatar_url || user?.user_metadata?.picture || '',
    current_country: profile?.current_country || '',
    headline: profile?.headline || '',
    username: profile?.username || '',
    primary_origin_country: profile?.primary_origin_country || '',
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
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  // Redirect away only if onboarding is fully done AND we're not in partial mode
  // (i.e., user was sent back in to declare role/place per BD008).
  useEffect(() => {
    if (
      profile?.onboarding_completed_at &&
      !partialMode &&
      profileAny?.role_declared_at &&
      profileAny?.place_declared_at
    ) {
      navigate('/dna/feed', { replace: true });
    }
  }, [profile, profileAny, partialMode, navigate]);

  const validateD054Step = (step: number): { field: string; message: string }[] => {
    if (step === 3) {
      if (!role) return [{ field: 'role', message: 'Please choose a role to continue' }];
    }
    if (step === 4) {
      const errs: { field: string; message: string }[] = [];
      if (!continentCode) errs.push({ field: 'continent', message: 'Please select a continent' });
      if (!countryCode) {
        errs.push({ field: 'country', message: 'Please select a country' });
      } else if (!isValidAlpha3(countryCode)) {
        // Mirrors profiles_country_alpha3_check on the DB; should be unreachable
        // through the dropdown but guards against any tampered/legacy value.
        errs.push({ field: 'country', message: 'Country must be a valid 3-letter ISO code' });
      }
      return errs;
    }
    return [];
  };

  const handleNext = async () => {
    // Validate current step
    const validationErrors =
      currentStep >= 3 ? validateD054Step(currentStep) : validateStep(currentStep, formData);

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

    // On final step (place), submit
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
      const nowIso = new Date().toISOString();

      // ── PARTIAL MODE: existing pre-D054 user re-entering to declare role/place.
      // We only touch the new D054 fields; never overwrite their established profile.
      if (partialMode) {
        const slim: Record<string, any> = { updated_at: nowIso };

        if (role) {
          slim.role = role;
          if (!profileAny?.role_declared_at) slim.role_declared_at = nowIso;
        }
        if (continentCode && countryCode) {
          slim.continent = continentCode;
          slim.country = countryCode;
          const countryName = getCountryNameByAlpha3(countryCode);
          if (countryName) slim.current_country = countryName;
          if (!profileAny?.place_declared_at) slim.place_declared_at = nowIso;
        }

        const { error: slimErr } = await supabase
          .from('profiles')
          .update(slim)
          .eq('id', user.id);
        if (slimErr) throw slimErr;

        const onboardingSnapshot = {
          onboarding_completed_at: profileAny?.onboarding_completed_at || null,
          username: profileAny?.username || null,
          role_declared_at: slim.role_declared_at || profileAny?.role_declared_at || null,
          place_declared_at: slim.place_declared_at || profileAny?.place_declared_at || null,
        };

        queryClient.setQueryData(['onboarding-check', user.id], onboardingSnapshot);
        await refreshProfile();
        await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

        toast({
          title: 'Thank you',
          description: 'Your declaration has been recorded.',
        });

        const returnTo = (location.state as any)?.from || '/dna/feed';
        navigate(returnTo, { replace: true });
        return;
      }

      // ── FULL SIGNUP FLOW
      const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();

      // D054 / BD033: identity is captured solely via role (Step 4) and place (Step 5).
      // diaspora_status is retired; user_type is never written here.
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
        profession: formData.profession || null,
        professional_role: formData.professional_role || null,
        professional_sectors: formData.professional_sectors || [],
        skills: formData.skills || [],
        years_experience: formData.years_experience ? parseInt(formData.years_experience.split('-')[0]) : null,
        // BD038: primary_origin_country moved to member_heritage (written below)
        interests: formData.interests || [],
        my_dna_statement: formData.my_dna_statement || null,
        focus_areas: formData.focus_areas || [],
        regional_expertise: formData.regional_expertise || [],
        industries: formData.industries || [],
        engagement_intentions: formData.engagement_intentions || [],
        // D054 fields (always set on full signup; both timestamps written transactionally)
        role: role || null,
        role_declared_at: role ? (profileAny?.role_declared_at || nowIso) : null,
        continent: continentCode || null,
        country: countryCode || null,
        place_declared_at:
          continentCode && countryCode
            ? (profileAny?.place_declared_at || nowIso)
            : null,
        is_public: true,
        updated_at: nowIso,
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
          setCurrentStep(4); // Go back to username step
          return;
        } else {
          throw upsertError;
        }
      }

      // BD038: persist primary origin to member_heritage (was profiles.primary_origin_country).
      // formData.primary_origin_country now carries an ISO code from DiasporaImpactStep.
      if (formData.primary_origin_country) {
        try {
          await upsertPrimaryOrigin(user.id, formData.primary_origin_country);
        } catch (mhErr) {
          console.error('Failed to write primary origin to member_heritage', mhErr);
        }
      }

      // Wait for DB to commit
      await new Promise(resolve => setTimeout(resolve, 300));

      // Calculate profile completion percentage
      await supabase.rpc('calculate_profile_completion_percentage', { profile_id: user.id });

      // Mark onboarding as complete
      const { error: completeError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', user.id);

      if (completeError) throw completeError;

      queryClient.setQueryData(['onboarding-check', user.id], {
        onboarding_completed_at: nowIso,
        username: formData.username,
        role_declared_at: role ? (profileAny?.role_declared_at || nowIso) : null,
        place_declared_at: continentCode && countryCode ? (profileAny?.place_declared_at || nowIso) : null,
      });

      // Refresh profile
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });

      // Confetti celebration
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#C87533', '#2F5233', '#3D8B40', '#FFD700']
      });

      toast({
        title: 'Welcome to the Diaspora Network of Africa',
        description: `You're all set, @${formData.username}.`,
      });

      navigate('/dna/feed', { replace: true });
    } catch (error: unknown) {
      // Surface the real Supabase error so we don't silently fall back to
      // a generic toast (PostgrestError isn't an Error instance).
      // eslint-disable-next-line no-console
      console.error('[onboarding] submit failed', error);
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
          <IdentityStep
            data={formData}
            onUpdate={updateField}
            errors={errors}
          />
        );
      case 1:
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
      case 2:
        return (
          <UsernameStep
            data={{
              full_name: `${formData.first_name} ${formData.last_name}`,
              username: formData.username,
              primary_origin_country: formData.primary_origin_country,
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
      case 3:
        return (
          <RoleDeclarationStep
            value={role}
            onChange={(v) => setRole(v)}
            error={errors.role}
          />
        );
      case 4:
        return (
          <PlaceDeclarationStep
            continent={continentCode}
            country={countryCode}
            onContinentChange={(v) => setContinentCode(v)}
            onCountryChange={(v) => setCountryCode(v)}
            errors={{ continent: errors.continent, country: errors.country }}
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
            disabled={currentStep === 0 || currentStep <= initialStep || isSubmitting}
            className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={
              isSubmitting ||
              (currentStep === 4 && (!continentCode || !isValidAlpha3(countryCode)))
            }
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