/**
 * Contribute Fulfillment Service
 * Typed wrapper over need_fulfillments table + RPCs.
 */
import { supabase } from '@/integrations/supabase/client';

export type FulfillmentStatus =
  | 'pending'
  | 'in_progress'
  | 'fulfilled'
  | 'confirmed'
  | 'cancelled';

export interface FulfillmentRow {
  id: string;
  need_id: string;
  fulfiller_id: string;
  requester_id: string;
  room_curation_id: string | null;
  thread_id: string | null;
  status: FulfillmentStatus;
  fulfiller_message: string | null;
  fulfilled_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileLite {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface NeedLite {
  id: string;
  title: string;
  user_id: string;
}

export interface FulfillmentWithParties extends FulfillmentRow {
  fulfiller: ProfileLite | null;
  requester: ProfileLite | null;
  need: NeedLite | null;
}

export interface AcknowledgmentRow {
  id: string;
  fulfillment_id: string | null;
  from_profile_id: string;
  to_profile_id: string;
  message: string | null;
  is_public: boolean;
  created_at: string;
}

export interface AcknowledgmentWithGiver extends AcknowledgmentRow {
  from_profile: ProfileLite | null;
}

const FULFILLMENT_COLS = `
  id, need_id, fulfiller_id, requester_id, room_curation_id, thread_id,
  status, fulfiller_message, fulfilled_at, confirmed_at, cancelled_at,
  cancelled_by, created_at, updated_at
`;

interface OfferArgs {
  needId: string;
  roomCurationId?: string | null;
  message?: string | null;
}

async function offer(args: OfferArgs): Promise<string> {
  const { data, error } = await supabase.rpc('offer_fulfillment', {
    p_need_id: args.needId,
    p_room_curation_id: args.roomCurationId ?? null,
    p_message: args.message ?? null,
  });
  if (error) throw error;
  return data as string;
}

async function confirm(fulfillmentId: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_fulfillment', {
    p_fulfillment_id: fulfillmentId,
  });
  if (error) throw error;
}

async function setStatus(
  fulfillmentId: string,
  status: Exclude<FulfillmentStatus, 'cancelled' | 'confirmed'>
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === 'fulfilled') patch.fulfilled_at = new Date().toISOString();
  const { error } = await supabase
    .from('need_fulfillments')
    .update(patch)
    .eq('id', fulfillmentId);
  if (error) throw error;
}

async function cancel(fulfillmentId: string, _reason?: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  const { error } = await supabase
    .from('need_fulfillments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: uid,
    })
    .eq('id', fulfillmentId);
  if (error) throw error;
}

async function fetchProfiles(ids: string[]): Promise<Map<string, ProfileLite>> {
  const map = new Map<string, ProfileLite>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return map;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .in('id', unique);
  if (error) throw error;
  (data ?? []).forEach((p) => map.set(p.id, p as ProfileLite));
  return map;
}

async function fetchNeeds(ids: string[]): Promise<Map<string, NeedLite>> {
  const map = new Map<string, NeedLite>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return map;
  const { data, error } = await supabase
    .from('need_declarations')
    .select('id, title, user_id')
    .in('id', unique);
  if (error) throw error;
  (data ?? []).forEach((n) => map.set(n.id, n as NeedLite));
  return map;
}

async function listForNeed(needId: string): Promise<FulfillmentWithParties[]> {
  const { data, error } = await supabase
    .from('need_fulfillments')
    .select(FULFILLMENT_COLS)
    .eq('need_id', needId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as FulfillmentRow[];
  const profiles = await fetchProfiles(
    rows.flatMap((r) => [r.fulfiller_id, r.requester_id])
  );
  const needs = await fetchNeeds([needId]);
  return rows.map((r) => ({
    ...r,
    fulfiller: profiles.get(r.fulfiller_id) ?? null,
    requester: profiles.get(r.requester_id) ?? null,
    need: needs.get(r.need_id) ?? null,
  }));
}

async function listMyOffers(): Promise<FulfillmentWithParties[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('need_fulfillments')
    .select(FULFILLMENT_COLS)
    .eq('fulfiller_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as FulfillmentRow[];
  const profiles = await fetchProfiles(rows.map((r) => r.requester_id));
  const needs = await fetchNeeds(rows.map((r) => r.need_id));
  return rows.map((r) => ({
    ...r,
    fulfiller: null,
    requester: profiles.get(r.requester_id) ?? null,
    need: needs.get(r.need_id) ?? null,
  }));
}

async function getById(id: string): Promise<FulfillmentWithParties | null> {
  const { data, error } = await supabase
    .from('need_fulfillments')
    .select(FULFILLMENT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as FulfillmentRow;
  const profiles = await fetchProfiles([r.fulfiller_id, r.requester_id]);
  const needs = await fetchNeeds([r.need_id]);
  return {
    ...r,
    fulfiller: profiles.get(r.fulfiller_id) ?? null,
    requester: profiles.get(r.requester_id) ?? null,
    need: needs.get(r.need_id) ?? null,
  };
}

async function listAcknowledgments(
  fulfillmentId: string
): Promise<AcknowledgmentWithGiver[]> {
  const { data, error } = await supabase
    .from('contribution_acknowledgments')
    .select('id, fulfillment_id, from_profile_id, to_profile_id, message, is_public, created_at')
    .eq('fulfillment_id', fulfillmentId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as AcknowledgmentRow[];
  const profiles = await fetchProfiles(rows.map((r) => r.from_profile_id));
  return rows.map((r) => ({ ...r, from_profile: profiles.get(r.from_profile_id) ?? null }));
}

async function listAsanteForProfile(
  profileId: string,
  limit = 50
): Promise<AcknowledgmentWithGiver[]> {
  const { data, error } = await supabase
    .from('contribution_acknowledgments')
    .select('id, fulfillment_id, from_profile_id, to_profile_id, message, is_public, created_at')
    .eq('to_profile_id', profileId)
    .eq('is_public', true)
    .ilike('message', 'Asante%')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as AcknowledgmentRow[];
  const profiles = await fetchProfiles(rows.map((r) => r.from_profile_id));
  return rows.map((r) => ({ ...r, from_profile: profiles.get(r.from_profile_id) ?? null }));
}

export const contributeFulfillmentService = {
  offer,
  confirm,
  setStatus,
  cancel,
  listForNeed,
  listMyOffers,
  getById,
  listAcknowledgments,
  listAsanteForProfile,
};
