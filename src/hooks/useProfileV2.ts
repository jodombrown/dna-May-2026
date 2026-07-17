/**
 * useProfileV2 - View Other Users' Profiles
 *
 * Use this hook to fetch a profile bundle by username for viewing.
 * Includes viewer context for personalized data (e.g., connection status).
 *
 * For the current user's OWN profile, use useProfile instead.
 *
 * BULLETPROOF: Never throws errors - always returns null on failure
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileV2Bundle, ProfileV2Data, VerificationStatus } from '@/types/profileV2';
import { useAuth } from '@/contexts/AuthContext';
import { STALE_TIMES } from '@/lib/queryClient';

/** jsonb shape returned by public.get_public_profile (SECURITY DEFINER, callable by anon). */
interface PublicProfileRow {
  id: string;
  username: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  headline: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  current_city: string | null;
  current_country: string | null;
  website_url: string | null;
  pronouns: string | null;
  created_at: string | null;
}

const normalizePublicProfileBundle = (raw: PublicProfileRow): ProfileV2Bundle => {
  const city = raw.current_city ?? raw.city ?? null;
  const country = raw.current_country ?? raw.country ?? null;

  const profile = {
    id: raw.id,
    username: raw.username,
    full_name: raw.full_name || raw.display_name || raw.username,
    headline: raw.headline ?? null,
    professional_role: null,
    company: null,
    avatar_url: raw.avatar_url ?? null,
    banner_url: raw.banner_url ?? null,
    banner_type: raw.banner_url ? ('image' as const) : undefined,
    current_country: country,
    current_city: city,
    location: city && country ? `${city}, ${country}` : city ?? country,
    primary_origin_country: null,
    bio: raw.bio ?? null,
    profession: null,
    industry: null,
    years_experience: null,
    verification_status: 'pending_verification' as VerificationStatus,
    created_at: raw.created_at ?? undefined,
    website_url: raw.website_url ?? null,
    pronouns: raw.pronouns ?? null,
  } as ProfileV2Data;

  return {
    profile,
    tags: {},
    activity: { spaces: [], events: [] },
    permissions: {
      is_owner: false,
      can_edit: false,
      can_create_events: false,
      can_create_public_spaces: false,
    },
    visibility: {
      about: 'public',
      skills: 'public',
      interests: 'public',
      activity: 'public',
    },
    completion: { score: 0, suggested_actions: [] },
    verification_meta: {},
    connection_status: 'none',
    should_show_public_landing: true,
  };
};

export const useProfileV2 = (username: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile-v2', username, user?.id],
    queryFn: async (): Promise<ProfileV2Bundle | null> => {
      if (!username) return null;

      try {
        // Anonymous viewers can't read the full bundle (RLS); use the
        // anon-callable public profile RPC instead. A null result means the
        // profile is private or doesn't exist.
        if (!user?.id) {
          const { data, error } = await supabase.rpc('get_public_profile', {
            p_username: username,
          });

          if (error || data == null) {
            return null;
          }

          return normalizePublicProfileBundle(data as unknown as PublicProfileRow);
        }

        const { data, error } = await supabase.rpc('rpc_get_profile_bundle_v2' as never, {
          p_username: username,
          p_viewer_id: user?.id || null,
        } as never);


        // Return null on error - NEVER throw to avoid ErrorBoundary
        if (error) {
          return null;
        }

        // Defensive fallback: if a stale RPC ever forgets to stamp `permissions`
        // or `should_show_public_landing`, derive them from the viewer id so
        // owners never fall through to the visitor UI.
        const bundle = data as unknown as ProfileV2Bundle & { is_owner?: boolean };
        const derivedIsOwner =
          bundle?.permissions?.is_owner ??
          bundle?.is_owner ??
          (!!user?.id && bundle?.profile?.id === user.id);

        return {
          ...bundle,
          permissions: {
            is_owner: derivedIsOwner,
            can_edit: bundle?.permissions?.can_edit ?? derivedIsOwner,
            can_create_events: bundle?.permissions?.can_create_events ?? derivedIsOwner,
            can_create_public_spaces:
              bundle?.permissions?.can_create_public_spaces ?? derivedIsOwner,
            can_connect: bundle?.permissions?.can_connect ?? !derivedIsOwner,
          },
          should_show_public_landing: derivedIsOwner
            ? false
            : bundle?.should_show_public_landing ?? false,
        } as ProfileV2Bundle;
      } catch {
        // Catch any unexpected errors - NEVER throw
        return null;
      }
    },
    enabled: !!username,
    staleTime: STALE_TIMES.profile,
    retry: 1, // Only retry once
    throwOnError: false, // Never throw to React Query error boundary
  });
};
