/**
 * DNA | DIA Uniqueness Service — Sprint 13B
 *
 * Generates personalized "What Makes You Unique" insights
 * that appear on the user's profile.
 */

import { supabase } from '@/integrations/supabase/client';
import { getOrComputeImpactScores, type ImpactScores } from '@/services/impact-score-service';
import { logger } from '@/lib/logger';

/**
 * Generate a uniqueness insight string for a user's profile
 */
export async function generateUniquenessInsight(userId: string): Promise<string> {
  try {
    const [profileResult, impactScores, networkStats] = await Promise.all([
      supabase
        .from('profiles')
        .select('skills, ethnic_heritage, current_country, primary_origin_country, professional_sectors, bio, profession')
        .eq('id', userId)
        .single(),
      getOrComputeImpactScores(userId),
      getNetworkCountrySpan(userId),
    ]);

    const profile = profileResult.data;
    if (!profile) return '';

    const insights: string[] = [];

    // Heritage uniqueness
    const heritage = profile.ethnic_heritage;
    if (Array.isArray(heritage) && heritage.length > 1) {
      insights.push(
        `Your ${heritage.slice(0, 3).join(' and ')} heritage bridges communities that rarely connect on other platforms.`
      );
    }

    // Network span
    if (networkStats > 5) {
      insights.push(
        `Your network spans ${networkStats} countries — you're a true global connector.`
      );
    }

    // Skill recognition
    const skills = profile.skills;
    if (Array.isArray(skills) && skills.length > 3) {
      const topSkill = skills[0];
      insights.push(
        `Your ${topSkill} expertise positions you uniquely in the diaspora network.`
      );
    }

    // Impact balance
    if (impactScores && impactScores.strongestC !== impactScores.growthOpportunityC) {
      insights.push(
        `You lead in ${formatCName(impactScores.strongestC)} and have room to grow in ${formatCName(impactScores.growthOpportunityC)} — the combination could amplify your impact.`
      );
    }

    // Five C's breadth
    const activeCs = countActiveCs(impactScores);
    if (activeCs >= 4) {
      insights.push(
        `Active across ${activeCs} of the Five C's — that puts you in the top tier of DNA members.`
      );
    } else if (activeCs === 1 && impactScores) {
      insights.push(
        `You've started strong in ${formatCName(impactScores.strongestC)}. Exploring other C's could unlock surprising connections.`
      );
    }

    // Location-heritage bridge
    if (profile.current_country && profile.primary_origin_country &&
        profile.current_country !== profile.primary_origin_country) {
      insights.push(
        `Living in ${profile.current_country} with roots in ${profile.primary_origin_country} gives you a unique bridge between both worlds.`
      );
    }

    const result = insights.slice(0, 3).join(' ');

    // Cache the insight
    try {
      await supabase
        .from('profiles')
        .update({
          dia_insight: result,
          dia_insight_updated_at: new Date().toISOString(),
        } as any)
        .eq('id', userId);
    } catch {
      // Cache failure is non-critical
    }

    return result;
  } catch (err) {
    logger.warn('DiaUniquenessService', 'Failed to generate insight', err);
    return '';
  }
}

/**
 * Get cached insight or generate fresh one
 */
export async function getOrGenerateInsight(userId: string): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data } = await db
      .from('profiles')
      .select('dia_insight, dia_insight_updated_at')
      .eq('id', userId)
      .single();

    if (data?.dia_insight && data?.dia_insight_updated_at) {
      const updatedAt = new Date(data.dia_insight_updated_at as string).getTime();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - updatedAt < weekMs) {
        return data.dia_insight as string;
      }
    }
  } catch {
    // Fall through
  }

  return generateUniquenessInsight(userId);
}

// ============================================================
// HELPERS
// ============================================================

async function getNetworkCountrySpan(userId: string): Promise<number> {
  const { data: connections } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq('status', 'accepted')
    .limit(200);

  if (!connections || connections.length === 0) return 0;

  const connectedIds = connections.map(c =>
    c.requester_id === userId ? c.recipient_id : c.requester_id
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('current_country')
    .in('id', connectedIds.slice(0, 100));

  return new Set(
    (profiles ?? []).map(p => p.current_country).filter(Boolean)
  ).size;
}

function formatCName(c: string): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function countActiveCs(scores: ImpactScores | null): number {
  if (!scores) return 0;
  let count = 0;
  if (scores.connect > 0) count++;
  if (scores.convene > 0) count++;
  if (scores.collaborate > 0) count++;
  if (scores.contribute > 0) count++;
  if (scores.convey > 0) count++;
  return count;
}
