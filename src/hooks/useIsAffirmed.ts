/**
 * useIsAffirmed — is the current user an Affirmed Member?
 *
 * True when the user has an own affirmations row with attested_at IS NOT NULL.
 * RLS permits reading own rows. Exported for later gating; nothing is gated on
 * it in this pass (gentle rollout).
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { affirmationsService } from '@/services/affirmationsService';
import { affirmationKeys } from '@/hooks/useAffirmation';

interface UseIsAffirmedResult {
  isAffirmed: boolean;
  isLoading: boolean;
}

export const useIsAffirmed = (): UseIsAffirmedResult => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: affirmationKeys.own(user?.id),
    queryFn: () => affirmationsService.getOwn(user!.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  return {
    isAffirmed: !!data?.attested_at,
    isLoading: !!user?.id && isLoading,
  };
};
