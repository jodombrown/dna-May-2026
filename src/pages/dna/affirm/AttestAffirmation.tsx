/**
 * AttestAffirmation — /dna/affirm/attest/:id, the witness's attestation surface.
 *
 * Renders the declaration and statement, a single attest action calling
 * rpc_attest_affirmation, then a confirmation state. Non-witness visitors get a
 * clean not-found / not-yours state (RLS also enforces this server-side).
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAffirmationById,
  useResolvedMember,
  useAttestAffirmation,
} from '@/hooks/useAffirmation';
import { affirmationChromeContent as C } from '@/content/affirmation-chrome.content';
import { getRoleLabel } from '@/components/onboarding/RoleDeclarationStep';
import type { AffirmRole } from '@/content/affirmation-ceremony.content';
import DeclarationBody from '@/components/affirm/DeclarationBody';

const Spinner: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dna-copper" />
  </div>
);

const CenteredCard: React.FC<{ title: string; body: string; children?: React.ReactNode }> = ({
  title,
  body,
  children,
}) => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
    <div className="w-full max-w-md text-center space-y-4">
      <h1 className="text-2xl font-bold text-dna-forest">{title}</h1>
      <p className="text-sm text-muted-foreground">{body}</p>
      {children}
    </div>
  </div>
);

const AttestAffirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const { data: affirmation, isLoading } = useAffirmationById(id);
  const { data: declarer } = useResolvedMember(affirmation?.profile_id ?? null);
  const attest = useAttestAffirmation();
  const [justAttested, setJustAttested] = useState(false);

  if (authLoading || isLoading || !user) {
    return <Spinner />;
  }

  const isWitness = !!affirmation && affirmation.witness_id === user.id;

  // Not found, or this link isn't the visitor's to attest.
  if (!affirmation || !isWitness) {
    return (
      <CenteredCard title={C.attest.notFoundTitle} body={C.attest.notFoundBody}>
        <Button
          className="bg-dna-copper hover:bg-dna-copper-dark text-white"
          onClick={() => navigate('/dna/feed')}
        >
          {C.attest.notFoundCta}
        </Button>
      </CenteredCard>
    );
  }

  const declarerName = declarer?.name;

  // Fresh confirmation right after attesting.
  if (justAttested) {
    return (
      <CenteredCard
        title={C.attest.confirmTitle}
        body={
          declarerName
            ? C.attest.confirmBodyNamed.replace('{name}', declarerName)
            : C.attest.confirmBodyUnnamed
        }
      >
        <Button
          className="bg-dna-copper hover:bg-dna-copper-dark text-white"
          onClick={() => navigate('/dna/feed')}
        >
          {C.attest.notFoundCta}
        </Button>
      </CenteredCard>
    );
  }

  // Already attested on a previous visit.
  if (affirmation.attested_at) {
    return <CenteredCard title={C.attest.alreadyTitle} body={C.attest.alreadyBody} />;
  }

  const role = affirmation.role_at_affirm as AffirmRole;

  const handleAttest = async () => {
    try {
      await attest.mutateAsync(affirmation.id);
      setJustAttested(true);
    } catch {
      toast({ title: C.attest.attestError, variant: 'destructive' });
    }
  };

  const intro = declarerName
    ? C.attest.introNamed.replace('{name}', declarerName)
    : C.attest.introUnnamed;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-dna-copper">
            {C.attest.eyebrow}
          </p>
          <h1 className="text-2xl font-bold text-dna-forest">{C.attest.title}</h1>
          <p className="text-sm text-muted-foreground">
            {intro} {C.attest.instruction}
          </p>
        </header>

        <DeclarationBody role={role} />

        <section className="space-y-1">
          <p className="text-xs text-muted-foreground">{C.attest.roleLabel}</p>
          <p className="text-sm font-medium text-dna-forest">{getRoleLabel(role)}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-dna-forest">{C.attest.statementLabel}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {affirmation.statement?.trim() || C.attest.noStatement}
          </p>
        </section>

        <Button
          size="lg"
          onClick={handleAttest}
          disabled={attest.isPending}
          className="w-full bg-dna-copper hover:bg-dna-copper-dark text-white"
        >
          {attest.isPending ? C.attest.attestingCta : C.attest.attestCta}
        </Button>
      </div>
    </div>
  );
};

export default AttestAffirmation;
