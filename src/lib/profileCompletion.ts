// Pure utility for profile completion calculation - no React imports
// This prevents circular dependency issues

interface ProfileForCompletion {
  avatar_url?: string | null;
  full_name?: string | null;
  headline?: string | null;
  profession?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  skills?: string[] | null;
  focus_areas?: string[] | null;
  interests?: string[] | null;
  primary_origin_country?: string | null;
  current_country?: string | null;
  languages?: string[] | null;
  banner_url?: string | null;
  industries?: string[] | null;
}

export interface ProfileFieldCheck {
  field: string;
  label: string;
  complete: boolean;
  points: number;
  priority: number;
  pillar: string;
}

// 5-pillar system totaling exactly 100 points
export function getProfileFieldChecks(profile: ProfileForCompletion | null): ProfileFieldCheck[] {
  if (!profile) return [];

  // Helper to check if a string has actual content (not just whitespace)
  const hasContent = (val: string | null | undefined): boolean => !!val?.trim();
  
  // Helper to count valid items in an array (filtering out empty/whitespace strings)
  const validArrayLength = (arr: unknown[] | null | undefined): number => {
    if (!Array.isArray(arr)) return 0;
    return arr.filter(item => typeof item === 'string' ? item.trim() : !!item).length;
  };

  return [
    // Pillar 1: Identity (25 pts)
    {
      field: 'avatar_url',
      label: 'Profile photo',
      complete: hasContent(profile.avatar_url),
      points: 10,
      priority: 1,
      pillar: 'Identity',
    },
    {
      field: 'full_name',
      label: 'Full name',
      complete: hasContent(profile.full_name) && profile.full_name.trim().length >= 2,
      points: 5,
      priority: 1,
      pillar: 'Identity',
    },
    {
      field: 'headline',
      label: 'Professional headline',
      complete: hasContent(profile.headline) && profile.headline.trim().length >= 5,
      points: 10,
      priority: 2,
      pillar: 'Identity',
    },

    // Pillar 2: Professional (20 pts)
    {
      field: 'profession',
      label: 'Professional role',
      complete: hasContent(profile.profession),
      points: 5,
      priority: 2,
      pillar: 'Professional',
    },
    {
      field: 'bio',
      label: 'Bio (50+ characters)',
      complete: hasContent(profile.bio) && profile.bio.trim().length >= 50,
      points: 10,
      priority: 3,
      pillar: 'Professional',
    },
    {
      field: 'linkedin_url',
      label: 'LinkedIn profile',
      complete: hasContent(profile.linkedin_url),
      points: 5,
      priority: 4,
      pillar: 'Professional',
    },

    // Pillar 3: Discovery (30 pts)
    {
      field: 'skills',
      label: 'Skills (3+)',
      complete: validArrayLength(profile.skills) >= 3,
      points: 10,
      priority: 2,
      pillar: 'Discovery',
    },
    {
      field: 'focus_areas',
      label: 'Focus areas (2+)',
      complete: validArrayLength(profile.focus_areas) >= 2,
      points: 10,
      priority: 2,
      pillar: 'Discovery',
    },
    {
      field: 'interests',
      label: 'Interests (3+)',
      complete: validArrayLength(profile.interests) >= 3,
      points: 10,
      priority: 3,
      pillar: 'Discovery',
    },

    // Pillar 4: Diaspora Context (15 pts)
    {
      field: 'primary_origin_country',
      label: 'Country of origin',
      complete: hasContent(profile.primary_origin_country),
      points: 5,
      priority: 1,
      pillar: 'Diaspora Context',
    },
    {
      field: 'current_country',
      label: 'Current country',
      complete: hasContent(profile.current_country),
      points: 5,
      priority: 1,
      pillar: 'Diaspora Context',
    },
    {
      field: 'languages',
      label: 'Languages (1+)',
      complete: validArrayLength(profile.languages) >= 1,
      points: 5,
      priority: 3,
      pillar: 'Diaspora Context',
    },

    // Pillar 5: Engagement (10 pts)
    {
      field: 'banner_url',
      label: 'Profile banner',
      complete: hasContent(profile.banner_url),
      points: 5,
      priority: 5,
      pillar: 'Engagement',
    },
    {
      field: 'industries',
      label: 'Industries (1+)',
      complete: validArrayLength(profile.industries) >= 1,
      points: 5,
      priority: 4,
      pillar: 'Engagement',
    },
  ];
}

// Calculate total completion points (max 100)
export function calculateProfileCompletionPts(profile: ProfileForCompletion | null): number {
  if (!profile) return 0;
  const fields = getProfileFieldChecks(profile);
  return Math.min(100, fields.filter(f => f.complete).reduce((sum, f) => sum + f.points, 0));
}

// Get missing fields sorted by priority (ascending) then points (descending)
export function getMissingFields(profile: ProfileForCompletion | null): ProfileFieldCheck[] {
  const fields = getProfileFieldChecks(profile);
  return fields
    .filter(f => !f.complete)
    .sort((a, b) => a.priority - b.priority || b.points - a.points);
}

// Get completed fields
export function getCompletedFields(profile: ProfileForCompletion | null): ProfileFieldCheck[] {
  return getProfileFieldChecks(profile).filter(f => f.complete);
}

// Get completion breakdown by pillar
export function getCompletionByPillar(profile: ProfileForCompletion | null): Record<string, { earned: number; total: number }> {
  const fields = getProfileFieldChecks(profile);
  const pillars: Record<string, { earned: number; total: number }> = {};

  fields.forEach(f => {
    if (!pillars[f.pillar]) {
      pillars[f.pillar] = { earned: 0, total: 0 };
    }
    pillars[f.pillar].total += f.points;
    if (f.complete) {
      pillars[f.pillar].earned += f.points;
    }
  });

  return pillars;
}

// Legacy alias for backward compatibility
export const calculateProfileCompletion = calculateProfileCompletionPts;
