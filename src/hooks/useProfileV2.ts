/**
 * useProfileV2 - View Other Users' Profiles
 *
 * Use this hook to fetch a profile bundle by username for viewing.
 * Includes viewer context for personalized data (e.g., connection status).
 *
 * For the current user's OWN profile, use useProfile instead.
 *
 * Anonymous (logged-out) viewers use the anon-granted get_public_profile
 * RPC, which returns a flat public snapshot (or null for private/nonexistent
 * profiles). The snapshot is normalized into a ProfileV2Bundle so the page
 * can render PublicProfileLandingView without a separate code path.
 *
 * BULLETPROOF: Never throws errors - always returns null on failure
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileV2Bundle, ProfileV2Data } from '@/types/profileV2';
import { useAuth } from '@/contexts/AuthContext';
import { STALE_TIMES } from '@/lib/queryClient';

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

const buildAnonymousBundle = (row: PublicProfileRow): ProfileV2Bundle => {
  const city = row.current_city ?? row.city;
  const country = row.current_country ?? row.country;

  const profile: ProfileV2Data & {
    display_name: string | null;
    website_url: string | null;
    pronouns: string | null;
  } = {
    id: row.id,
    username: row.username,
    full_name: row.full_name || row.display_name || row.username,
    display_name: row.display_name,
    headline: row.headline,
    professional_role: null,
    company: null,
    avatar_url: row.avatar_url,
    banner_url: row.banner_url,
    current_city: city,
    current_country: country,
    location: [city, country].filter(Boolean).join(', ') || null,
    primary_origin_country: null,
    bio: row.bio,
    profession: null,
    industry: null,
    years_experience: null,
    website_url: row.website_url,
    pronouns: row.pronouns,
    verification_status: 'pending_verification',
    created_at: row.created_at ?? undefined,
  };

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
        if (!user?.id) {
          // Anonymous viewer: anon-granted RPC returning a public snapshot,
          // or null when the profile is private or doesn't exist.
          const { data, error } = await supabase.rpc('get_public_profile', {
            p_username: username,
          });

          if (error || !data) {
            return null;
          }

          return buildAnonymousBundle(data as unknown as PublicProfileRow);
        }

        const { data, error } = await supabase.rpc('rpc_get_profile_bundle', {
          p_username: username,
          p_viewer_id: user.id,
        });

        // Return null on error - NEVER throw to avoid ErrorBoundary
        if (error) {
          return null;
        }

        return data as unknown as ProfileV2Bundle;
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
