/**
 * Affirm — the /dna/affirm ceremony flow orchestrator.
 *
 * Chooses the surface from the user's state:
 *  - Affirmed (attested row)      -> read-only record
 *  - Pending row                  -> pending screen (edit statement / re-pick)
 *  - role 'exploring' / unset      -> gate (declare an affirming role first)
 *  - otherwise                    -> ceremony -> witness -> INSERT -> pending
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useOwnAffirmation } from '@/hooks/useAffirmation';
import type { DnaIdentityRole } from '@/components/onboarding/RoleDeclarationStep';
import type { AffirmRole } from '@/content/affirmation-ceremony.content';
import AffirmGate from '@/components/affirm/AffirmGate';
import CeremonyScreen from '@/components/affirm/CeremonyScreen';
import WitnessScreen from '@/components/affirm/WitnessScreen';
import PendingScreen from '@/components/affirm/PendingScreen';
import AffirmedRecord from '@/components/affirm/AffirmedRecord';

interface RoleRow {
  role: DnaIdentityRole | null;
  role_declared_at: string | null;
}

const Spinner: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dna-copper" />
  </div>
);

const Affirm: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<'ceremony' | 'witness'>('ceremony');
  const [statement, setStatement] = useState('');

  const { data: own, isLoading: ownLoading } = useOwnAffirmation();

  const {
    data: roleRow,
    isLoading: roleLoading,
    refetch: refetchRole,
  } = useQuery<RoleRow | null>({
    queryKey: ['affirm-role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, role_declared_at')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as RoleRow | null;
    },
    enabled: !!user?.id,
    staleTime: 15_000,
  });

  if (authLoading || ownLoading || roleLoading || !user) {
    return <Spinner />;
  }

  // State 4 — already Affirmed: immutable record.
  if (own?.attested_at) {
    return <AffirmedRecord affirmation={own} />;
  }

  // State 2 — a pending row exists.
  if (own) {
    return <PendingScreen affirmation={own} />;
  }

  // Step a — gate when role is unset or 'exploring'.
  const role = roleRow?.role ?? null;
  if (!role || role === 'exploring') {
    return (
      <AffirmGate
        currentRole={role}
        needsDeclaredAt={!roleRow?.role_declared_at}
        onDeclared={() => refetchRole()}
      />
    );
  }

  // Steps b / c — ceremony then witness. INSERT flips `own` to a pending row,
  // which re-renders into PendingScreen automatically.
  const affirmRole = role as AffirmRole;
  if (step === 'witness') {
    return (
      <WitnessScreen
        role={affirmRole}
        statement={statement}
        onBack={() => setStep('ceremony')}
        onSubmitted={() => setStep('ceremony')}
      />
    );
  }

  return (
    <CeremonyScreen
      role={affirmRole}
      statement={statement}
      onStatementChange={setStatement}
      onCommit={() => setStep('witness')}
    />
  );
};

export default Affirm;
