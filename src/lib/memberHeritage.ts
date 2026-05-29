/**
 * Helpers for writing/reading a member's primary origin country via
 * the canonical `member_heritage` table.
 *
 * BD038 — origin country moved off `profiles.country_of_origin` (a name)
 * onto `member_heritage.origin_country` (ISO-3 code, primary row).
 *
 * Storage layer speaks codes. Display layer maps to names via COUNTRIES.
 */

import { supabase } from '@/integrations/supabase/client';
import { COUNTRIES } from '@/data/countries';

/**
 * Upsert the user's primary origin country.
 * Delete-then-insert keeps the (profile_id, is_primary) invariant clean.
 * Pass empty / nullish to clear the primary row.
 */
export async function upsertPrimaryOrigin(
  profileId: string,
  originCountryCode: string | null | undefined,
): Promise<void> {
  if (!profileId) return;

  const { error: delErr } = await supabase
    .from('member_heritage')
    .delete()
    .eq('profile_id', profileId)
    .eq('is_primary', true);
  if (delErr) throw delErr;

  const code = (originCountryCode ?? '').trim();
  if (!code) return;

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
 * Map an ISO-3166 alpha-2 (or alpha-3 — accepts whatever is stored) code
 * to a human-readable country name for display / username seeding.
 * Returns empty string if not resolvable.
 */
export function originCodeToName(code: string | null | undefined): string {
  if (!code) return '';
  const upper = code.trim().toUpperCase();
  if (!upper) return '';
  const hit = COUNTRIES.find((c) => c.code.toUpperCase() === upper);
  return hit?.name ?? '';
}

/**
 * Map a country name back to its ISO code. Tolerant case match.
 * Used to bridge legacy name-shaped form state into the code-shaped write.
 */
export function originNameToCode(name: string | null | undefined): string {
  if (!name) return '';
  const lower = name.trim().toLowerCase();
  if (!lower) return '';
  const hit = COUNTRIES.find((c) => c.name.toLowerCase() === lower);
  return hit?.code ?? '';
}
