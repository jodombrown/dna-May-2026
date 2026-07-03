import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, LogOut } from 'lucide-react';
import UnifiedHeader from '@/components/UnifiedHeader';
import ProfileCompletionBar, { calculateProfileCompletionPts } from '@/components/profile/ProfileCompletionBar';
import TourResumeBanner from '@/components/onboarding/TourResumeBanner';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import UsernameManager from '@/components/profile/UsernameManager';
import { upsertPrimaryOrigin, getPrimaryOriginCode } from '@/lib/memberHeritage';

// Import modular profile edit components
import {
  ProfileEditImages,
  ProfileEditBasicInfo,
  ProfileEditContactPreferences,
  ProfileEditOpenTo,
  ProfileEditProfessional,
  ProfileEditDiaspora,
  ProfileEditInterests,
  ProfileEditLanguages,
  ProfileEditSocialLinks,
  ProfileEditPrivacy,
} from '@/components/profile-edit';

const ProfileEdit = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showTour, setShowTour] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Fetch current profile using unified hook
  const { data: profile, isLoading, isError, error, refetch } = useProfile();

  // Auto-retry if profile is null but user exists (give trigger time to complete)
  useEffect(() => {
    if (!isLoading && !profile && user && retryCount < 3) {
      const timeout = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refetch();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, profile, user, retryCount, refetch]);

  // Image state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<'gradient' | 'solid' | 'image'>('gradient');
  const [bannerGradient, setBannerGradient] = useState<string>('dna');
  const [bannerOverlay, setBannerOverlay] = useState<boolean>(false);

  // Basic info state
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [currentCountry, setCurrentCountry] = useState('');
  const [pronouns, setPronouns] = useState('');

  // Contact preferences state (unified)
  const [preferredContactMethod, setPreferredContactMethod] = useState('platform_message');
  const [contactNumberVisibility, setContactNumberVisibility] = useState('none');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [timezone, setTimezone] = useState('');

  // Open to / Collaboration state
  const [availableFor, setAvailableFor] = useState<string[]>([]);

  // Professional state
  const [profession, setProfession] = useState('');
  const [company, setCompany] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [professionalSectors, setProfessionalSectors] = useState<string[]>([]);

  // Diaspora state
  const [diasporaNetworks, setDiasporaNetworks] = useState<string[]>([]);
  const [engagementIntentions, setEngagementIntentions] = useState<string[]>([]);
  const [mentorshipAreas, setMentorshipAreas] = useState<string[]>([]);
  const [ethnicHeritage, setEthnicHeritage] = useState<string[]>([]);
  const [returnIntentions, setReturnIntentions] = useState('');
  const [africanCauses, setAfricanCauses] = useState<string[]>([]);
  const [visitFrequency, setVisitFrequency] = useState('');

  // Interests & Discovery state
  const [interests, setInterests] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [regionalExpertise, setRegionalExpertise] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  // Languages state
  const [languages, setLanguages] = useState<string[]>([]);

  // Social links state
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Privacy state
  const [isPublic, setIsPublic] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      // Images
      setAvatarUrl(profile.avatar_url || null);
      setBannerUrl(profile.banner_url || null);
      setBannerType((profile as any).banner_type || 'gradient');
      setBannerGradient((profile as any).banner_gradient || 'dna');
      setBannerOverlay((profile as any).banner_overlay || false);

      // Basic info
      setFullName(profile.full_name || '');
      setHeadline(profile.headline || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setCountryOfOrigin((profile as any).primary_origin_country || '');
      setCurrentCountry(profile.current_country || '');
      setPronouns((profile as any).pronouns || '');

      // Contact preferences (unified)
      setPreferredContactMethod((profile as any).preferred_contact_method || 'platform_message');
      setContactNumberVisibility((profile as any).contact_number_visibility || 'none');
      setPhoneNumber((profile as any).phone_number || '');
      setWhatsappNumber((profile as any).whatsapp_number || '');
      setTimezone((profile as any).timezone || '');

      // Open to / Collaboration
      setAvailableFor(Array.isArray(profile.available_for) ? profile.available_for : []);

      // Professional
      setProfession(profile.profession || '');
      setCompany(profile.company || '');
      setYearsExperience(profile.years_experience || 0);
      setSkills(Array.isArray(profile.skills) ? profile.skills : []);
      setProfessionalSectors(Array.isArray(profile.professional_sectors) ? profile.professional_sectors : []);

      // Diaspora
      setDiasporaNetworks(Array.isArray(profile.diaspora_networks) ? profile.diaspora_networks : []);
      setEngagementIntentions(Array.isArray(profile.engagement_intentions) ? profile.engagement_intentions : []);
      setMentorshipAreas(Array.isArray(profile.mentorship_areas) ? profile.mentorship_areas : []);
      setEthnicHeritage(Array.isArray((profile as any).ethnic_heritage) ? (profile as any).ethnic_heritage : []);
      setReturnIntentions((profile as any).return_intentions || '');
      setAfricanCauses(Array.isArray((profile as any).african_causes) ? (profile as any).african_causes : []);
      setVisitFrequency((profile as any).africa_visit_frequency || '');

      // Interests & Discovery
      setInterests(Array.isArray(profile.interests) ? profile.interests : []);
      setFocusAreas(Array.isArray(profile.focus_areas) ? profile.focus_areas : []);
      setRegionalExpertise(Array.isArray(profile.regional_expertise) ? profile.regional_expertise : []);
      setIndustries(Array.isArray(profile.industries) ? profile.industries : []);

      // Languages
      setLanguages(Array.isArray(profile.languages) ? profile.languages : []);

      // Social links
      setLinkedinUrl(profile.linkedin_url || '');
      setTwitterUrl(profile.twitter_url || '');
      setWebsiteUrl(profile.website_url || '');

      // Privacy
      setIsPublic(profile.is_public || false);
    }
  }, [profile]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Profile not found');
      }
      return data[0];
    },
    onSuccess: (data) => {
      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile-v2'] });
      // Invalidate feed queries so updated avatar/name appears immediately in posts
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      queryClient.invalidateQueries({ queryKey: ['universal-feed-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      
      // Use points-based calculation (100 pts total)
      const completionPts = calculateProfileCompletionPts(data);
      
      toast({
        title: 'Profile updated!',
        description: `You're at ${completionPts} pts. ${completionPts >= 40 ? '✅ All features unlocked!' : `Complete ${40 - completionPts} more pts to unlock all features.`}`,
      });
      
      navigate('/dna/feed');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  // Form validation
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required field validation
    if (!fullName.trim()) {
      errors.push('Full name is required');
    }

    // URL validation
    if (linkedinUrl && !isValidUrl(linkedinUrl)) {
      errors.push('LinkedIn URL is invalid');
    }
    if (twitterUrl && !isValidUrl(twitterUrl)) {
      errors.push('Twitter/X URL is invalid');
    }
    if (websiteUrl && !isValidUrl(websiteUrl)) {
      errors.push('Website URL is invalid');
    }

    // Bio length suggestion (not blocking)
    if (bio && bio.length < 50) {
      // Just a soft warning, not an error
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    const { isValid, errors } = validateForm();
    if (!isValid) {
      toast({
        title: 'Please fix the following errors',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    const updates = {
      // Basic info
      full_name: fullName,
      headline,
      bio,
      location,
      primary_origin_country: countryOfOrigin,
      current_country: currentCountry,
      pronouns,

      // Contact preferences (unified)
      preferred_contact_method: preferredContactMethod,
      contact_number_visibility: contactNumberVisibility,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      timezone,

      // Open to / Collaboration
      available_for: availableFor,

      // Professional
      profession,
      company,
      years_experience: yearsExperience,
      skills,
      professional_sectors: professionalSectors,

      // Diaspora
      diaspora_networks: diasporaNetworks,
      engagement_intentions: engagementIntentions,
      mentorship_areas: mentorshipAreas,
      ethnic_heritage: ethnicHeritage,
      return_intentions: returnIntentions,
      african_causes: africanCauses,
      africa_visit_frequency: visitFrequency,

      // Interests & Discovery
      interests,
      focus_areas: focusAreas,
      regional_expertise: regionalExpertise,
      industries,

      // Languages
      languages,

      // Social links
      linkedin_url: linkedinUrl,
      twitter_url: twitterUrl,
      website_url: websiteUrl,

      // Privacy
      is_public: isPublic,

      // Meta
      updated_at: new Date().toISOString(),
    };
    
    updateMutation.mutate(updates);
  };

  if (isLoading || (!profile && user && retryCount < 3)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Failed to load profile</h2>
          <p className="text-muted-foreground mt-2">
            {error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dna/feed')}>
            Back to Feed
          </Button>
          <Button onClick={() => {
            setRetryCount(0);
            refetch();
          }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Not signed in</h2>
          <p className="text-muted-foreground mt-2">
            Please sign in to edit your profile.
          </p>
        </div>
        <Button onClick={() => navigate('/auth')}>
          Sign In
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Profile not found</h2>
          <p className="text-muted-foreground mt-2">
            Your profile may still be loading. Please wait or try refreshing.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dna/feed')}>
            Back to Feed
          </Button>
          <Button onClick={() => {
            setRetryCount(0);
            refetch();
          }}>
            Reload Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dna/feed')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Button>
            
            {/* Mobile Save Button - top right */}
            <Button
              type="button"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
              disabled={updateMutation.isPending}
              className="md:hidden"
              size="sm"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground mt-2">
            Complete your profile to unlock all DNA features and connect with the diaspora community
          </p>
          
          {/* Quick nudges for incomplete fields */}
          <div className="mt-4 flex flex-wrap gap-2">
            {!avatarUrl && (
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                + Add photo
              </Badge>
            )}
            {!bannerUrl && (
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
                + Add banner
              </Badge>
            )}
            {!headline && (
              <Badge variant="outline" className="text-xs">+ Add headline</Badge>
            )}
            {skills.length < 3 && (
              <Badge variant="outline" className="text-xs">+ Add 3+ skills</Badge>
            )}
            {focusAreas.length < 2 && (
              <Badge variant="outline" className="text-xs">+ Add focus areas</Badge>
            )}
          </div>
        </div>

        {/* Profile Completion Progress */}
        <ProfileCompletionBar profile={{ ...profile, avatar_url: avatarUrl, banner_url: bannerUrl }} />

        {/* Tour Resume Banner - shows if user skipped tour */}
        <TourResumeBanner onStartTour={() => setShowTour(true)} />

        <form onSubmit={handleSubmit} onKeyDown={(e) => {
          // Prevent Enter key from submitting the form (except in textareas)
          if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }} className="space-y-6">
          {/* Username Section */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Username</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your username is your unique identity on DNA.
            </p>
            <UsernameManager
              currentUsername={profile?.username || ''}
              onUsernameChange={(newUsername) => {
                queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
                toast({
                  title: '🎉 Username updated!',
                  description: `Your new username is @${newUsername}`,
                });
              }}
            />
          </div>

          {/* Profile Images */}
          <ProfileEditImages
            userId={user.id}
            avatarUrl={avatarUrl}
            bannerUrl={bannerUrl}
            bannerType={bannerType}
            bannerGradient={bannerGradient}
            bannerOverlay={bannerOverlay}
            onAvatarChange={setAvatarUrl}
            onBannerChange={setBannerUrl}
            onBannerUpdate={(data) => {
              // Immediately update local state for instant preview
              setBannerType(data.type);
              setBannerGradient(data.gradient || 'dna');
              setBannerUrl(data.url || null);
              setBannerOverlay(data.overlay);
              // Also refetch for any other data
              refetch();
            }}
            userDisplayName={fullName}
          />

          {/* Basic Information */}
          <ProfileEditBasicInfo
            fullName={fullName}
            headline={headline}
            bio={bio}
            location={location}
            countryOfOrigin={countryOfOrigin}
            currentCountry={currentCountry}
            pronouns={pronouns}
            skills={skills}
            professionalSectors={professionalSectors}
            onFullNameChange={setFullName}
            onHeadlineChange={setHeadline}
            onBioChange={setBio}
            onLocationChange={setLocation}
            onCountryOfOriginChange={setCountryOfOrigin}
            onCurrentCountryChange={setCurrentCountry}
            onPronounsChange={setPronouns}
          />

          {/* Contact Preferences (unified) */}
          <ProfileEditContactPreferences
            preferredContactMethod={preferredContactMethod}
            contactNumberVisibility={contactNumberVisibility}
            phoneNumber={phoneNumber}
            whatsappNumber={whatsappNumber}
            timezone={timezone}
            onPreferredContactChange={setPreferredContactMethod}
            onContactNumberVisibilityChange={setContactNumberVisibility}
            onPhoneNumberChange={setPhoneNumber}
            onWhatsappNumberChange={setWhatsappNumber}
            onTimezoneChange={setTimezone}
          />

          {/* Open To / Collaboration */}
          <ProfileEditOpenTo
            availableFor={availableFor}
            onAvailableForChange={setAvailableFor}
          />

          {/* Professional Background */}
          <ProfileEditProfessional
            profession={profession}
            company={company}
            yearsExperience={yearsExperience}
            skills={skills}
            professionalSectors={professionalSectors}
            onProfessionChange={setProfession}
            onCompanyChange={setCompany}
            onYearsExperienceChange={setYearsExperience}
            onSkillsChange={setSkills}
            onSectorsChange={setProfessionalSectors}
          />

          {/* African Diaspora Identity */}
          <ProfileEditDiaspora
            diasporaNetworks={diasporaNetworks}
            engagementIntentions={engagementIntentions}
            mentorshipAreas={mentorshipAreas}
            ethnicHeritage={ethnicHeritage}
            returnIntentions={returnIntentions}
            africanCauses={africanCauses}
            visitFrequency={visitFrequency}
            onNetworksChange={setDiasporaNetworks}
            onIntentionsChange={setEngagementIntentions}
            onMentorshipAreasChange={setMentorshipAreas}
            onEthnicHeritageChange={setEthnicHeritage}
            onReturnIntentionsChange={setReturnIntentions}
            onAfricanCausesChange={setAfricanCauses}
            onVisitFrequencyChange={setVisitFrequency}
          />

          {/* Interests & Focus Areas */}
          <ProfileEditInterests
            interests={interests}
            focusAreas={focusAreas}
            regionalExpertise={regionalExpertise}
            industries={industries}
            onInterestsChange={setInterests}
            onFocusAreasChange={setFocusAreas}
            onRegionalExpertiseChange={setRegionalExpertise}
            onIndustriesChange={setIndustries}
          />

          {/* Languages */}
          <ProfileEditLanguages
            languages={languages}
            onLanguagesChange={setLanguages}
          />

          {/* Social Links */}
          <ProfileEditSocialLinks
            linkedinUrl={linkedinUrl}
            twitterUrl={twitterUrl}
            websiteUrl={websiteUrl}
            onLinkedinChange={setLinkedinUrl}
            onTwitterChange={setTwitterUrl}
            onWebsiteChange={setWebsiteUrl}
          />

          {/* Privacy Settings */}
          <ProfileEditPrivacy
            isPublic={isPublic}
            onIsPublicChange={setIsPublic}
          />

          {/* Submit Buttons */}
          <div className="flex flex-wrap gap-3 justify-between pb-8">
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => navigate('/dna/feed')}
            >
              Cancel
            </Button>
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                type="button"
                variant="ghost"
                className="shrink-0"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button
                type="submit"
                className="shrink-0"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Platform Tour Dialog */}
      <OnboardingTour open={showTour} onClose={() => setShowTour(false)} />
    </div>
  );
};

export default ProfileEdit;
