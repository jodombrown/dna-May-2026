
import { supabase } from '@/integrations/supabase/client';
import { FormData, ArrayStates } from './FormDataTypes';
import { upsertPrimaryOrigin, originNameToCode } from '@/lib/memberHeritage';

export const handleProfileSubmission = async (
  userId: string,
  formData: FormData,
  arrayStates: ArrayStates,
  avatarUrl: string,
  bannerUrl: string
) => {
  // BD038: origin country no longer lives on profiles.country_of_origin.
  // Strip it from the profiles update; persist via member_heritage instead.
  const { country_of_origin: rawOrigin, ...formRest } = formData;

  // Convert string numbers to actual numbers for database compatibility
  const processedData = {
    ...formRest,
    years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
    years_in_diaspora: formData.years_in_diaspora ? parseInt(formData.years_in_diaspora) : null,
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      ...processedData,
      avatar_url: avatarUrl,
      skills: arrayStates.skills,
      interests: arrayStates.interests,
      impact_areas: arrayStates.impactAreas,
      engagement_intentions: arrayStates.engagementIntentions,
      skills_offered: arrayStates.skillsOffered,
      skills_needed: arrayStates.skillsNeeded,
      available_for: arrayStates.availableFor,
      professional_sectors: arrayStates.professionalSectors,
      diaspora_networks: arrayStates.diasporaNetworks,
      mentorship_areas: arrayStates.mentorshipAreas,
      // NEW: Discovery tags
      focus_areas: arrayStates.focusAreas,
      regional_expertise: arrayStates.regionalExpertise,
      industries: arrayStates.industries,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', userId);

  if (error) throw error;

  // Persist primary origin to member_heritage. Form state may still be
  // name-shaped (legacy); tolerate both code and name on the way out.
  if (rawOrigin !== undefined) {
    const code = rawOrigin && rawOrigin.length <= 3
      ? rawOrigin.toUpperCase()
      : originNameToCode(rawOrigin);
    await upsertPrimaryOrigin(userId, code);
  }
};
