/**
 * Helpers for writing/reading a member's primary origin country via
 * the canonical `member_heritage` table.
 *
 * BD038/BD039 — origin country moved off `profiles.country_of_origin` (a name)
 * onto `member_heritage.origin_country` (ISO-3 alpha-3 code, primary row).
 *
 * Canonical dialect: ISO 3166-1 alpha-3 (matches DB char(3) constraint).
 * Source of truth for codes/names: `@/lib/dna-place` (alpha-3).
 * Legacy bridge: tolerate alpha-2 / display-name on the way in (form state),
 * but the storage layer MUST only ever persist a validated alpha-3.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  CONTINENT_COUNTRY_LIST,
  isValidAlpha3,
  KNOWN_ALPHA3,
} from '@/lib/dna-place';

// --- canonical alpha-3 lookup tables (built from dna-place) ---
const ALPHA3_TO_NAME: Map<string, string> = new Map();
const NAME_TO_ALPHA3: Map<string, string> = new Map();
for (const list of Object.values(CONTINENT_COUNTRY_LIST)) {
  for (const c of list) {
    ALPHA3_TO_NAME.set(c.alpha3, c.name);
    NAME_TO_ALPHA3.set(c.name.toLowerCase(), c.alpha3);
  }
}

// --- legacy alpha-2 -> alpha-3 bridge (covers all dna-place countries) ---
// Built once from the curated dna-place name list crossed against ISO alpha-2
// codes held in @/data/countries. Kept inline (single source) so the cascade
// has exactly one dialect translator.
import { COUNTRIES as COUNTRIES_ALPHA2 } from '@/data/countries';
const ALPHA2_TO_ALPHA3: Map<string, string> = new Map();
for (const { code, name } of COUNTRIES_ALPHA2) {
  const a3 = NAME_TO_ALPHA3.get(name.toLowerCase());
  if (a3) ALPHA2_TO_ALPHA3.set(code.toUpperCase(), a3);
}

/**
 * Normalize whatever a caller might hand us (alpha-3 / alpha-2 / display name)
 * into a validated alpha-3. Returns '' if we cannot resolve it.
 * This is the ONLY function allowed to widen acceptance — every writer must
 * route through it before persistence.
 */
export function toAlpha3(input: string | null | undefined): string {
  if (!input) return '';
  const raw = input.trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (raw.length === 3 && isValidAlpha3(upper)) return upper;
  if (raw.length === 2) {
    const mapped = ALPHA2_TO_ALPHA3.get(upper);
    if (mapped) return mapped;
  }
  const byName = NAME_TO_ALPHA3.get(raw.toLowerCase());
  return byName ?? '';
}

/**
 * Upsert the user's primary origin country.
 * Delete-then-insert keeps the (profile_id, is_primary) invariant clean.
 * Accepts alpha-3 / alpha-2 / display name; persists ONLY validated alpha-3.
 * Pass empty / nullish to clear the primary row.
 */
export async function upsertPrimaryOrigin(
  profileId: string,
  originCountry: string | null | undefined,
): Promise<void> {
  if (!profileId) return;

  const { error: delErr } = await supabase
    .from('member_heritage')
    .delete()
    .eq('profile_id', profileId)
    .eq('is_primary', true);
  if (delErr) throw delErr;

  const code = toAlpha3(originCountry);
  if (!code) return; // empty input clears; unresolvable input also clears (safe)
  if (!isValidAlpha3(code)) return; // defence in depth

  const { error: insErr } = await supabase
    .from('member_heritage')
    .insert({
      profile_id: profileId,
      origin_country: code,
      is_primary: true,
    });
  if (insErr) throw insErr;
}

/**
 * Map an ISO 3166-1 alpha-3 code to a human-readable country name.
 * Tolerates legacy alpha-2 input by upgrading it first.
 * Returns '' if not resolvable.
 */
export function originCodeToName(code: string | null | undefined): string {
  const a3 = toAlpha3(code);
  if (!a3) return '';
  return ALPHA3_TO_NAME.get(a3) ?? '';
}

/**
 * Map a country name back to its alpha-3 code. Tolerant case match.
 * Used to bridge legacy name-shaped form state into the code-shaped write.
 */
export function originNameToCode(name: string | null | undefined): string {
  return toAlpha3(name);
}

/**
 * Fetch the primary origin country code for a single profile.
 * Returns null when no primary row exists.
 */
export async function getPrimaryOriginCode(
  profileId: string,
): Promise<string | null> {
  if (!profileId) return null;
  const { data } = await supabase
    .from('member_heritage')
    .select('origin_country')
    .eq('profile_id', profileId)
    .eq('is_primary', true)
    .maybeSingle();
  const code = (data?.origin_country ?? '').trim().toUpperCase();
  if (!code) return null;
  return KNOWN_ALPHA3.has(code) ? code : null;
}

/**
 * Batch-fetch primary origin codes for many profiles. Returns a
 * Map<profileId, alpha3OrNull>. Used by equality/match readers to
 * avoid N+1 queries while comparing code-vs-code on both sides.
 */
export async function getPrimaryOriginCodes(
  profileIds: string[],
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  if (!profileIds.length) return out;
  const { data } = await supabase
    .from('member_heritage')
    .select('profile_id, origin_country')
    .in('profile_id', profileIds)
    .eq('is_primary', true);
  for (const row of data ?? []) {
    const code = (row.origin_country ?? '').trim().toUpperCase();
    out.set(row.profile_id, code && KNOWN_ALPHA3.has(code) ? code : null);
  }
  for (const id of profileIds) if (!out.has(id)) out.set(id, null);
  return out;
}
