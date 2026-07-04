/**
 * WitnessScreen — step c of the Affirmation flow.
 *
 * Lists eligible witnesses from rpc_list_eligible_witnesses (names resolved via
 * public_profiles). Submit INSERTs the pending affirmation. Empty state is
 * graceful — pre-genesis there are zero candidates, and it must not dead-end.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEligibleWitnesses, useCreateAffirmation } from '@/hooks/useAffirmation';
import { affirmationChromeContent as C } from '@/content/affirmation-chrome.content';
import type { AffirmRole } from '@/content/affirmation-ceremony.content';
import WitnessList from './WitnessList';

interface WitnessScreenProps {
  role: AffirmRole;
  statement: string;
  onBack: () => void;
  onSubmitted: () => void;
}

const WitnessScreen: React.FC<WitnessScreenProps> = ({ role, statement, onBack, onSubmitted }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: witnesses, isLoading } = useEligibleWitnesses(role);
  const create = useCreateAffirmation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedId) return;
    try {
      await create.mutateAsync({
        role,
        witnessId: selectedId,
        statement: statement.trim() ? statement.trim() : null,
      });
      toast({ title: C.pending.submittedToast });
      onSubmitted();
    } catch {
      toast({ title: C.witness.submitError, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dna-copper" />
      </div>
    );
  }

  const candidates = witnesses ?? [];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-dna-forest">{C.witness.title}</h1>
          <p className="text-sm text-muted-foreground">{C.witness.body}</p>
        </header>

        {candidates.length === 0 ? (
          <div className="rounded-lg border border-border bg-dna-sand-light/40 p-6 text-center space-y-4">
            <h2 className="text-base font-semibold text-dna-forest">{C.witness.emptyTitle}</h2>
            <p className="text-sm text-muted-foreground">{C.witness.emptyBody}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button variant="outline" onClick={onBack}>
                {C.witness.changeStatementCta}
              </Button>
              <Button
                className="bg-dna-copper hover:bg-dna-copper-dark text-white"
                onClick={() => navigate('/dna/feed')}
              >
                {C.witness.emptyCta}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <WitnessList
              candidates={candidates}
              selectedId={selectedId}
              onSelect={setSelectedId}
              ariaLabel={C.witness.selectAria}
              unnamedLabel={C.witness.unnamedMember}
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onBack} className="sm:w-auto">
                {C.common.back}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedId || create.isPending}
                className="flex-1 bg-dna-copper hover:bg-dna-copper-dark text-white"
              >
                {create.isPending ? C.witness.submittingCta : C.witness.submitCta}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WitnessScreen;
