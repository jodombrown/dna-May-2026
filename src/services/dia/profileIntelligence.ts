/**
 * DIA | Profile Intelligence Service
 *
 * Analyzes user profiles for completeness, skill gaps, and network position.
 * Powers: Composer (audience suggestions), Feed (skill matching), Profile (completion nudges)
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ProfileIntelligenceInput,
  ProfileIntelligenceResult,
  ProfileField,
  SkillGap,
  NetworkPosition,
  ProfileAction,
} from '@/types/dia';

/** Fields required for a "complete" profile and their weights */
const PROFILE_FIELD_WEIGHTS: Record<ProfileField, number> = {
  avatar: 15,
  headline: 12,
  bio: 12,
  skills: 15,
  interests: 10,
  location: 10,
  languages: 6,
  diaspora_heritage: 8,
  professional_background: 7,
  education: 5,
};

/** Map profile fields to actual database column names */
const FIELD_TO_COLUMN: Record<ProfileField, string> = {
  avatar: 'avatar_url',
  headline: 'headline',
  bio: 'bio',
  skills: 'skills',
  interests: 'interests',
  location: 'location',
  languages: 'languages',
  diaspora_heritage: 'ethnic_heritage',
  professional_background: 'profession',
  education: 'education',
};

/**
 * Compute profile completeness score and identify missing fields.
 */
async function analyzeProfile(input: ProfileIntelligenceInput): Promise<ProfileIntelligenceResult> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', input.user_id)
    .single();

  if (!profile) {
    return {
      user_id: input.user_id,
      completeness_score: 0,
      missing_fields: Object.keys(PROFILE_FIELD_WEIGHTS) as ProfileField[],
      skill_gaps: [],
      network_position: getDefaultNetworkPosition(),
      recommended_actions: [],
      computed_at: new Date().toISOString(),
    };
  }

  // Compute completeness
  const missing: ProfileField[] = [];
  let earned = 0;
  const total = Object.values(PROFILE_FIELD_WEIGHTS).reduce((a, b) => a + b, 0);

  for (const [field, weight] of Object.entries(PROFILE_FIELD_WEIGHTS)) {
    const column = FIELD_TO_COLUMN[field as ProfileField];
    const value = profile[column];
    const hasValue = Array.isArray(value)
      ? value.length > 0
      : value != null && value !== '';

    if (hasValue) {
      earned += weight;
    } else {
      missing.push(field as ProfileField);
    }
  }

  const completeness_score = Math.round((earned / total) * 100);

  // Build skill gaps if requested
  const skill_gaps: SkillGap[] = input.include_skill_gaps
    ? await computeSkillGaps(profile.skills || [])
    : [];

  // Build network position if requested
  const network_position: NetworkPosition = input.include_network_position
    ? await computeNetworkPosition(input.user_id)
    : getDefaultNetworkPosition();

  // Generate contextual actions
  const recommended_actions = generateProfileActions(missing, completeness_score);

  return {
    user_id: input.user_id,
    completeness_score,
    missing_fields: missing,
    skill_gaps,
    network_position,
    recommended_actions,
    computed_at: new Date().toISOString(),
  };
}

/**
 * Identify skills that are in-demand on the platform but missing from user's profile.
 */
async function computeSkillGaps(userSkills: string[]): Promise<SkillGap[]> {
  // Query popular skills from opportunities — contribution_needs uses 'type' not 'skills_needed'
  const { data: opportunities } = await supabase
    .from('contribution_needs')
    .select('type, title, description')
    .eq('status', 'open')
    .limit(200);

  if (!opportunities) return [];

  // Count skill demand from type + title + description text
  const skillDemand = new Map<string, number>();
  for (const opp of opportunities) {
    const text = `${opp.type || ''} ${opp.title || ''} ${opp.description || ''}`;
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    for (const word of words) {
      const normalized = word.trim();
      skillDemand.set(normalized, (skillDemand.get(normalized) || 0) + 1);
    }
  }

  // Find gaps — skills in demand that user doesn't have
  const normalizedUserSkills = new Set(userSkills.map(s => s.toLowerCase().trim()));
  const gaps: SkillGap[] = [];

  for (const [skill, count] of skillDemand.entries()) {
    if (!normalizedUserSkills.has(skill) && count >= 3) {
      gaps.push({
        skill,
        demand_score: Math.min(100, count * 10),
        opportunity_count: count,
        recommendation: `Adding "${skill}" could match you with ${count} open opportunities`,
      });
    }
  }

  return gaps.sort((a, b) => b.demand_score - a.demand_score).slice(0, 10);
}

/**
 * Compute user's position in the network graph.
 */
async function computeNetworkPosition(userId: string): Promise<NetworkPosition> {
  const { count: connectionCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  return {
    total_connections: connectionCount || 0,
    cluster_memberships: [],
    bridge_score: 0, // Computed by network analysis batch job
    influence_reach: connectionCount || 0,
    regional_presence: [],
  };
}

function getDefaultNetworkPosition(): NetworkPosition {
  return {
    total_connections: 0,
    cluster_memberships: [],
    bridge_score: 0,
    influence_reach: 0,
    regional_presence: [],
  };
}

/**
 * Generate contextual profile completion actions.
 * DIA guides users progressively — not a checklist, but contextual nudges.
 */
function generateProfileActions(
  missingFields: ProfileField[],
  completenessScore: number,
): ProfileAction[] {
  const actions: ProfileAction[] = [];

  const fieldActions: Record<ProfileField, Omit<ProfileAction, 'field' | 'action_type'>> = {
    avatar: {
      title: 'Add a profile photo',
      description: 'Profiles with photos get 5x more connection requests',
      value_proposition: 'Build trust and recognition in the network',
      priority: 'high',
    },
    headline: {
      title: 'Add a professional headline',
      description: 'Tell the network what you do in one line',
      value_proposition: 'Help connections understand your expertise at a glance',
      priority: 'high',
    },
    skills: {
      title: 'Add your skills',
      description: 'Skills power opportunity matching and DIA recommendations',
      value_proposition: 'See match scores on opportunities that fit your expertise',
      priority: 'high',
    },
    bio: {
      title: 'Write your bio',
      description: 'Share your story with the diaspora',
      value_proposition: 'Appear in more search results and recommendations',
      priority: 'medium',
    },
    location: {
      title: 'Add your location',
      description: 'Location unlocks local event recommendations',
      value_proposition: 'Discover events and opportunities near you',
      priority: 'medium',
    },
    interests: {
      title: 'Add your interests',
      description: 'Interests help DIA personalize your feed',
      value_proposition: 'See content and events aligned with what you care about',
      priority: 'medium',
    },
    diaspora_heritage: {
      title: 'Share your diaspora connection',
      description: 'Connect with your heritage community',
      value_proposition: 'Get culturally relevant content and regional updates',
      priority: 'medium',
    },
    languages: {
      title: 'Add your languages',
      description: 'Languages help with cross-diaspora matching',
      value_proposition: 'Connect with diaspora members across language barriers',
      priority: 'low',
    },
    professional_background: {
      title: 'Add your profession',
      description: 'Professional context improves matching accuracy',
      value_proposition: 'Get industry-specific recommendations and connections',
      priority: 'low',
    },
    education: {
      title: 'Add your education',
      description: 'Education helps find alumni connections',
      value_proposition: 'Discover alumni in the diaspora network',
      priority: 'low',
    },
  };

  for (const field of missingFields) {
    const action = fieldActions[field];
    if (action) {
      actions.push({ action_type: 'add_field', field, ...action });
    }
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export const profileIntelligenceService = {
  analyzeProfile,
  computeSkillGaps,
  computeNetworkPosition,
};
