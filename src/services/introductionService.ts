/**
 * DNA | Introduction Service
 *
 * Handles warm introductions between two connections:
 * - Group introduction (3-person thread)
 * - Separate introductions (individual 1:1 messages)
 * - Tracks introductions in the `introductions` table
 */

import { supabase } from '@/integrations/supabase/client';

export interface IntroductionPayload {
  introducerId: string;
  personAId: string;
  personBId: string;
  message: string;
  introType: 'group' | 'separate';
  context?: Record<string, unknown>;
}

export interface IntroductionResult {
  success: boolean;
  conversationId?: string;
  error?: string;
}

/**
 * Send a group introduction — creates a 3-person conversation
 */
export async function sendGroupIntroduction(
  payload: IntroductionPayload
): Promise<IntroductionResult> {
  const { introducerId, personAId, personBId, message, context } = payload;

  try {
    // 1. Create group conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations_new')
      .insert({
        conversation_type: 'group',
        origin_type: 'introduction',
        created_by: introducerId,
        title: 'Introduction',
        metadata: { introduction: true },
      })
      .select('id')
      .single();

    if (convError || !conversation) {
      return { success: false, error: convError?.message || 'Failed to create conversation' };
    }

    const conversationId = conversation.id;

    // 2. Add all 3 participants
    const participants = [introducerId, personAId, personBId].map(userId => ({
      conversation_id: conversationId,
      user_id: userId,
    }));

    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (partError) {
      return { success: false, error: partError.message };
    }

    // 3. Fetch profiles for the card payload
    const { data: cardProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username, headline')
      .in('id', [introducerId, personAId, personBId]);

    const profileMap = new Map(
      (cardProfiles || []).map(p => [p.id, p])
    );

    // 4. Send the introduction message with rich card payload
    const introPayload = {
      introductionCard: {
        introducer: profileMap.get(introducerId) || { id: introducerId, full_name: null, avatar_url: null, username: null, headline: null },
        personA: profileMap.get(personAId) || { id: personAId, full_name: null, avatar_url: null, username: null, headline: null },
        personB: profileMap.get(personBId) || { id: personBId, full_name: null, avatar_url: null, username: null, headline: null },
      },
    };

    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: introducerId,
        content: message,
        message_type: 'text',
        payload: introPayload,
      });

    if (msgError) {
      // Try alternate messages table
      await (supabase as unknown as { from: (t: string) => typeof supabase extends { from: infer F } ? ReturnType<F extends (...a: unknown[]) => infer R ? () => R : never> : never })
        .from('messaging_messages' as never)
        .insert({
          conversation_id: conversationId,
          sender_id: introducerId,
          content: message,
          message_type: 'text',
          payload: introPayload,
        } as never);
    }

    // 4. Update conversation last_message_at
    await supabase
      .from('conversations_new')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // 5. Track the introduction
    await supabase
      .from('introductions' as never)
      .insert({
        introducer_id: introducerId,
        person_a_id: personAId,
        person_b_id: personBId,
        conversation_id: conversationId,
        intro_type: 'group',
        message,
        context: context || {},
      } as never);

    // 6. Create richer notifications for both recipients
    const personAProfile = profileMap.get(personAId);
    const personBProfile = profileMap.get(personBId);
    const introducerProfile = profileMap.get(introducerId);
    const introducerName = introducerProfile?.full_name || 'Someone';

    // Person A gets notified about Person B
    await supabase.from('notifications').insert({
      user_id: personAId,
      type: 'introduction',
      title: `${introducerName} introduced you to ${personBProfile?.full_name || 'someone'}`,
      message: message.slice(0, 120),
      link_url: `/dna/messages?conversation=${conversationId}`,
      read: false,
      payload: { actor_id: introducerId, conversation_id: conversationId },
    });

    // Person B gets notified about Person A
    await supabase.from('notifications').insert({
      user_id: personBId,
      type: 'introduction',
      title: `${introducerName} introduced you to ${personAProfile?.full_name || 'someone'}`,
      message: message.slice(0, 120),
      link_url: `/dna/messages?conversation=${conversationId}`,
      read: false,
      payload: { actor_id: introducerId, conversation_id: conversationId },
    });

    return { success: true, conversationId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Generate a warm introduction message template
 */
export function generateIntroMessage(
  personAName: string,
  personBName: string,
  personAHeadline?: string,
  personBHeadline?: string
): string {
  const aDesc = personAHeadline ? `, ${personAHeadline}` : '';
  const bDesc = personBHeadline ? `, ${personBHeadline}` : '';

  return `Hey ${personAName} and ${personBName}! I wanted to connect you two — ${personAName}${aDesc} and ${personBName}${bDesc}. I think you'd have a lot to talk about!`;
}

// ── Analytics & Queries ────────────────────────────────

export interface IntroductionRecord {
  id: string;
  person_a_id: string;
  person_b_id: string;
  intro_type: string;
  status: string;
  message: string | null;
  context: Record<string, unknown>;
  created_at: string;
  conversation_id: string | null;
  person_a?: { full_name: string | null; avatar_url: string | null };
  person_b?: { full_name: string | null; avatar_url: string | null };
}

/**
 * Fetch introductions made by a user
 */
export async function getMyIntroductions(userId: string): Promise<IntroductionRecord[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from('introductions')
      .select('id, person_a_id, person_b_id, intro_type, status, message, context, created_at, conversation_id')
      .eq('introducer_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];

    const records = data as IntroductionRecord[];

    // Collect unique person IDs to fetch profiles
    const personIds = new Set<string>();
    for (const intro of records) {
      personIds.add(intro.person_a_id);
      personIds.add(intro.person_b_id);
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', Array.from(personIds));

    const profileMap = new Map(
      (profiles || []).map(p => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
    );

    return records.map(intro => ({
      ...intro,
      person_a: profileMap.get(intro.person_a_id),
      person_b: profileMap.get(intro.person_b_id),
    }));
  } catch {
    return [];
  }
}

/**
 * Check if an introduction already exists between two people by this introducer.
 * Used by DIA to avoid re-suggesting introductions.
 */
export async function hasExistingIntroduction(
  introducerId: string,
  personAId: string,
  personBId: string
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { count } = await db
      .from('introductions')
      .select('id', { count: 'exact', head: true })
      .eq('introducer_id', introducerId)
      .or(
        `and(person_a_id.eq.${personAId},person_b_id.eq.${personBId}),and(person_a_id.eq.${personBId},person_b_id.eq.${personAId})`
      );

    return (count || 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Update introduction status when both people respond or connect
 */
export async function updateIntroductionStatus(
  introductionId: string,
  status: 'accepted' | 'connected'
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  await db
    .from('introductions')
    .update({ status })
    .eq('id', introductionId);
}
