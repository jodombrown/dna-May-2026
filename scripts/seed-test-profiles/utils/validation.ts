/**
 * DNA Platform - Test Profile Validation Utilities
 *
 * Utilities for validating profile completeness and content quality
 * to ensure seeded test profiles meet 100% coverage requirements.
 */

import { TestProfile } from '../data/profiles';

/**
 * Required profile fields for 100% completeness
 * Based on the DNA profile schema and ProfileV2 types
 */
const REQUIRED_FIELDS: (keyof TestProfile)[] = [
  // Core identity
  'id',
  'username',
  'email',
  'full_name',
  'first_name',
  'last_name',
  'display_name',

  // Professional info
  'headline',
  'professional_role',
  'company',
  'bio',
  'intro_text',

  // Media
  'avatar_url',
  'banner_url',

  // Location
  'location',
  'current_city',
  'current_country',
  'country_of_origin',

  // Diaspora-specific
  'diaspora_status',
  'diaspora_networks',
  'ethnic_heritage',
  'african_causes',
  'engagement_intentions',
  'return_intentions',
  'africa_visit_frequency',

  // Professional details
  'profession',
  'industry',
  'years_experience',

  // Tags and skills
  'skills',
  'interests',
  'impact_areas',
  'focus_areas',
  'regional_expertise',
  'mentorship_areas',
  'available_for',
  'professional_sectors',
  'industries',
  'languages',

  // External links
  'website_url',
  'linkedin_url',
  'twitter_url',
  'instagram_url',

  // Platform settings
  'user_type',
  'selected_pillars',
  'verification_status',
  'is_public',
  'is_seeded',
  'is_test_account',
  'auto_connect_enabled',
  'onboarding_completed',
  'profile_completeness_score',
  'agrees_to_values',
];

/**
 * Array fields that should have at least one item
 */
const REQUIRED_ARRAY_FIELDS: (keyof TestProfile)[] = [
  'diaspora_networks',
  'ethnic_heritage',
  'african_causes',
  'engagement_intentions',
  'skills',
  'interests',
  'impact_areas',
  'focus_areas',
  'regional_expertise',
  'mentorship_areas',
  'available_for',
  'professional_sectors',
  'industries',
  'languages',
  'selected_pillars',
];

/**
 * String fields that should have meaningful content (min length)
 */
const MIN_LENGTH_FIELDS: Partial<Record<keyof TestProfile, number>> = {
  bio: 100, // At least 100 characters for bio
  intro_text: 50, // At least 50 characters for intro
  headline: 20, // At least 20 characters for headline
};

export interface ValidationResult {
  score: number;
  missing: string[];
  warnings: string[];
  details: {
    requiredFieldsPresent: number;
    requiredFieldsTotal: number;
    arrayFieldsPopulated: number;
    arrayFieldsTotal: number;
    contentLengthOk: number;
    contentLengthTotal: number;
  };
}

/**
 * Validate profile completeness
 * Returns a score (0-100) and list of missing/incomplete fields
 */
export function validateProfileCompleteness(profile: TestProfile): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  let requiredFieldsPresent = 0;
  let arrayFieldsPopulated = 0;
  let contentLengthOk = 0;

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    const value = profile[field];
    if (value === undefined || value === null || value === '') {
      missing.push(`Missing required field: ${field}`);
    } else {
      requiredFieldsPresent++;
    }
  }

  // Check array fields have items
  for (const field of REQUIRED_ARRAY_FIELDS) {
    const value = profile[field] as unknown[];
    if (Array.isArray(value) && value.length > 0) {
      arrayFieldsPopulated++;
    } else {
      missing.push(`Empty array field: ${field}`);
    }
  }

  // Check content length
  for (const [field, minLength] of Object.entries(MIN_LENGTH_FIELDS)) {
    const value = profile[field as keyof TestProfile] as string;
    if (typeof value === 'string' && value.length >= minLength) {
      contentLengthOk++;
    } else if (typeof value === 'string' && value.length < minLength) {
      warnings.push(`${field} is below recommended length (${value.length}/${minLength} chars)`);
    }
  }

  // Calculate score
  const totalChecks =
    REQUIRED_FIELDS.length +
    REQUIRED_ARRAY_FIELDS.length +
    Object.keys(MIN_LENGTH_FIELDS).length;

  const passedChecks =
    requiredFieldsPresent +
    arrayFieldsPopulated +
    contentLengthOk;

  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    score,
    missing,
    warnings,
    details: {
      requiredFieldsPresent,
      requiredFieldsTotal: REQUIRED_FIELDS.length,
      arrayFieldsPopulated,
      arrayFieldsTotal: REQUIRED_ARRAY_FIELDS.length,
      contentLengthOk,
      contentLengthTotal: Object.keys(MIN_LENGTH_FIELDS).length,
    },
  };
}

/**
 * Validate all profiles and return summary
 */
export function validateAllProfiles(profiles: TestProfile[]): {
  allPassing: boolean;
  results: Record<string, ValidationResult>;
  summary: {
    totalProfiles: number;
    passingProfiles: number;
    averageScore: number;
    commonIssues: string[];
  };
} {
  const results: Record<string, ValidationResult> = {};
  const issueCount: Record<string, number> = {};

  let totalScore = 0;
  let passingCount = 0;

  for (const profile of profiles) {
    const validation = validateProfileCompleteness(profile);
    results[profile.full_name] = validation;
    totalScore += validation.score;

    if (validation.score === 100) {
      passingCount++;
    }

    // Track common issues
    for (const issue of [...validation.missing, ...validation.warnings]) {
      issueCount[issue] = (issueCount[issue] || 0) + 1;
    }
  }

  // Get top common issues
  const commonIssues = Object.entries(issueCount)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([issue, count]) => `${issue} (${count} profiles)`)
    .slice(0, 5);

  return {
    allPassing: passingCount === profiles.length,
    results,
    summary: {
      totalProfiles: profiles.length,
      passingProfiles: passingCount,
      averageScore: Math.round(totalScore / profiles.length),
      commonIssues,
    },
  };
}

/**
 * Validate post completeness
 */
export function validatePost(post: {
  author_id: string;
  content: string;
  post_type: string;
  privacy_level: string;
  image_url?: string;
  link_url?: string;
  is_seeded: boolean;
}): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!post.author_id) issues.push('Missing author_id');
  if (!post.content || post.content.length < 10) issues.push('Content too short');
  if (!post.post_type) issues.push('Missing post_type');
  if (!post.privacy_level) issues.push('Missing privacy_level');
  if (!post.is_seeded) issues.push('Not marked as seeded');

  // Type-specific validation
  if (post.post_type === 'image' && !post.image_url) {
    issues.push('Image post missing image_url');
  }
  if ((post.post_type === 'link' || post.post_type === 'video') && !post.link_url) {
    issues.push('Link/video post missing link_url');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validate story completeness
 */
export function validateStory(story: {
  author_id: string;
  title: string;
  subtitle: string;
  content: string;
  story_type: string;
  is_seeded: boolean;
}): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!story.author_id) issues.push('Missing author_id');
  if (!story.title || story.title.length < 10) issues.push('Title too short');
  if (!story.subtitle) issues.push('Missing subtitle');
  if (!story.content || story.content.length < 200) issues.push('Content too short for story');
  if (!story.story_type) issues.push('Missing story_type');
  if (!story.is_seeded) issues.push('Not marked as seeded');

  // Story type validation
  const validStoryTypes = ['impact', 'update', 'spotlight', 'photo_essay'];
  if (!validStoryTypes.includes(story.story_type)) {
    issues.push(`Invalid story_type: ${story.story_type}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validate connection data
 */
export function validateConnection(connection: {
  requester_id: string;
  recipient_id: string;
  status: string;
  message: string;
}): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!connection.requester_id) issues.push('Missing requester_id');
  if (!connection.recipient_id) issues.push('Missing recipient_id');
  if (connection.requester_id === connection.recipient_id) {
    issues.push('Cannot connect to self');
  }
  if (!['pending', 'accepted', 'declined'].includes(connection.status)) {
    issues.push(`Invalid status: ${connection.status}`);
  }
  if (!connection.message || connection.message.length < 10) {
    issues.push('Connection message too short');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export default {
  validateProfileCompleteness,
  validateAllProfiles,
  validatePost,
  validateStory,
  validateConnection,
};
